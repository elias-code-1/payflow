'use strict';

const { getQuery, runQuery, runTransaction } = require('../db');

const CURRENCIES = new Set(['XOF', 'EUR', 'USD']);

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function normalizedText(value, maxLength = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizedTags(value) {
  const tags = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(tags.map((tag) => normalizedText(String(tag), 40).replace(/[,\n]/g, '')).filter(Boolean))].slice(0, 30).join(',');
}

function validId(value, label = 'Identifiant') {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) fail(`${label} invalide.`);
  return id;
}

function validAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000_000) fail('Le montant doit être supérieur à 0.');
  return amount;
}

function validCurrency(value) {
  const currency = String(value || 'XOF').toUpperCase();
  if (!CURRENCIES.has(currency)) fail('Devise non prise en charge.');
  return currency;
}

function validDate(value, label = 'Date') {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) fail(`${label} invalide.`);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function ownedRow(table, userId, id, tx = null) {
  const get = tx?.get || getQuery;
  const rows = await get(`SELECT * FROM ${table} WHERE user_id = ? AND id = ?`, [userId, id]);
  if (!rows[0]) fail('Élément introuvable dans ce compte.', 404);
  return rows[0];
}

function dateConditions(field, filters, clauses, params) {
  if (filters.from) {
    clauses.push(`${field} >= ?`);
    params.push(`${filters.from} 00:00:00`);
  }
  if (filters.to) {
    clauses.push(`${field} < datetime(?, '+1 day')`);
    params.push(`${filters.to} 00:00:00`);
  }
}

function asUtcDate(value) {
  if (!value) return null;
  const text = String(value);
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
  const normalized = text.includes('T') ? text : text.replace(' ', 'T');
  return new Date(hasZone ? normalized : `${normalized}Z`);
}

async function validateCustomerLink(userId, customerId, link, tx = null) {
  if (customerId) {
    const customer = await ownedRow('customer_profiles', userId, customerId, tx);
    if (customer.archived_at) fail('Réactivez cette fiche client avant de la relier à un nouvel objet.');
    if (link?.customer_id && Number(link.customer_id) !== Number(customerId)) {
      fail('Le client choisi ne correspond pas au client associé à ce lien.');
    }
  }
  return customerId || (link ? link.customer_id : null) || null;
}

async function getManualPayment(userId, id) {
  const rows = await getQuery(`
    SELECT mp.*, pl.identifier AS link_identifier, cp.full_name AS customer_name,
      cp.phone_number AS customer_phone, cp.email AS customer_email
    FROM manual_payments mp
    LEFT JOIN payment_links pl ON pl.id = mp.payment_link_id AND pl.user_id = mp.user_id
    LEFT JOIN customer_profiles cp ON cp.id = mp.customer_id AND cp.user_id = mp.user_id
    WHERE mp.user_id = ? AND mp.id = ?
  `, [userId, id]);
  return rows[0] || null;
}

const FeatureModel = {
  async listManualPayments(userId, filters = {}) {
    const clauses = ['mp.user_id = ?'];
    const params = [userId];
    if (filters.status && ['confirmed', 'void'].includes(filters.status)) {
      clauses.push('mp.status = ?');
      params.push(filters.status);
    }
    if (filters.currency && CURRENCIES.has(filters.currency)) {
      clauses.push('mp.currency = ?');
      params.push(filters.currency);
    }
    if (filters.method) {
      clauses.push('LOWER(mp.method) = LOWER(?)');
      params.push(filters.method);
    }
    if (filters.customerId) {
      clauses.push('mp.customer_id = ?');
      params.push(validId(filters.customerId, 'Client'));
    }
    dateConditions('mp.paid_at', filters, clauses, params);
    if (filters.q) {
      clauses.push('(LOWER(mp.reference) LIKE ? OR LOWER(mp.note) LIKE ? OR LOWER(COALESCE(pl.identifier, "")) LIKE ? OR LOWER(COALESCE(cp.full_name, "")) LIKE ?)');
      const query = `%${String(filters.q).trim().toLowerCase()}%`;
      params.push(query, query, query, query);
    }
    return getQuery(`
      SELECT mp.*, pl.identifier AS link_identifier, cp.full_name AS customer_name,
        cp.phone_number AS customer_phone, cp.email AS customer_email
      FROM manual_payments mp
      LEFT JOIN payment_links pl ON pl.id = mp.payment_link_id AND pl.user_id = mp.user_id
      LEFT JOIN customer_profiles cp ON cp.id = mp.customer_id AND cp.user_id = mp.user_id
      WHERE ${clauses.join(' AND ')}
      ORDER BY mp.paid_at DESC, mp.id DESC LIMIT 2000
    `, params);
  },

  async createManualPayment(userId, input) {
    const amount = validAmount(input.amount);
    const currency = validCurrency(input.currency);
    const method = normalizedText(input.method, 60);
    if (!method) fail('La méthode de paiement est obligatoire.');
    const paidAt = validDate(input.paidAt, 'Date de règlement');
    const linkId = input.paymentLinkId ? validId(input.paymentLinkId, 'Lien') : null;
    const link = linkId ? await ownedRow('payment_links', userId, linkId) : null;
    const requestedCustomerId = input.customerId ? validId(input.customerId, 'Client') : null;
    const customerId = await validateCustomerLink(userId, requestedCustomerId, link);

    const result = await runQuery(`
      INSERT INTO manual_payments
        (user_id, payment_link_id, customer_id, amount, currency, method, reference, paid_at, note, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', CURRENT_TIMESTAMP)
    `, [userId, linkId, customerId, amount, currency, method, normalizedText(input.reference, 180), paidAt, normalizedText(input.note, 2000)]);
    return getManualPayment(userId, result.id);
  },

  async updateManualPayment(userId, id, input) {
    const paymentId = validId(id, 'Encaissement');
    const reason = normalizedText(input.reason, 300);
    if (!reason) fail('Indiquez le motif de la modification.');
    return runTransaction(async (tx) => {
      const rows = await tx.get('SELECT * FROM manual_payments WHERE user_id = ? AND id = ?', [userId, paymentId]);
      const old = rows[0];
      if (!old) fail('Encaissement introuvable.', 404);
      const amount = validAmount(input.amount);
      const currency = validCurrency(input.currency);
      const method = normalizedText(input.method, 60);
      if (!method) fail('La méthode de paiement est obligatoire.');
      const paidAt = validDate(input.paidAt, 'Date de règlement');
      const linkId = input.paymentLinkId ? validId(input.paymentLinkId, 'Lien') : null;
      const link = linkId ? await ownedRow('payment_links', userId, linkId, tx) : null;
      const customerId = await validateCustomerLink(userId, input.customerId ? validId(input.customerId, 'Client') : null, link, tx);
      const oldValues = {
        payment_link_id: old.payment_link_id,
        customer_id: old.customer_id,
        amount: old.amount,
        currency: old.currency,
        method: old.method,
        reference: old.reference,
        paid_at: old.paid_at,
        note: old.note,
        status: old.status,
      };
      const newValues = {
        payment_link_id: linkId,
        customer_id: customerId,
        amount,
        currency,
        method,
        reference: normalizedText(input.reference, 180),
        paid_at: paidAt,
        note: normalizedText(input.note, 2000),
        status: old.status,
      };
      await tx.run(`UPDATE manual_payments SET payment_link_id = ?, customer_id = ?, amount = ?, currency = ?, method = ?,
        reference = ?, paid_at = ?, note = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`,
      [newValues.payment_link_id, newValues.customer_id, newValues.amount, newValues.currency, newValues.method,
        newValues.reference, newValues.paid_at, newValues.note, userId, paymentId]);
      await tx.run(`INSERT INTO manual_payment_history
        (user_id, manual_payment_id, reason, old_values, new_values) VALUES (?, ?, ?, ?, ?)`,
      [userId, paymentId, reason, JSON.stringify(oldValues), JSON.stringify(newValues)]);
      return (await tx.get(`SELECT mp.*, pl.identifier AS link_identifier, cp.full_name AS customer_name,
        cp.phone_number AS customer_phone, cp.email AS customer_email
        FROM manual_payments mp
        LEFT JOIN payment_links pl ON pl.id = mp.payment_link_id AND pl.user_id = mp.user_id
        LEFT JOIN customer_profiles cp ON cp.id = mp.customer_id AND cp.user_id = mp.user_id
        WHERE mp.user_id = ? AND mp.id = ?`, [userId, paymentId]))[0];
    });
  },

  async changeManualPaymentStatus(userId, id, status, reason) {
    const paymentId = validId(id, 'Encaissement');
    if (!['confirmed', 'void'].includes(status)) fail('Statut d’encaissement invalide.');
    const note = normalizedText(reason, 300);
    if (!note) fail('Indiquez un motif pour confirmer ou annuler cette saisie.');
    return runTransaction(async (tx) => {
      const rows = await tx.get('SELECT * FROM manual_payments WHERE user_id = ? AND id = ?', [userId, paymentId]);
      const old = rows[0];
      if (!old) fail('Encaissement introuvable.', 404);
      const oldValues = { status: old.status };
      const newValues = { status };
      await tx.run('UPDATE manual_payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?', [status, userId, paymentId]);
      await tx.run(`INSERT INTO manual_payment_history (user_id, manual_payment_id, reason, old_values, new_values)
        VALUES (?, ?, ?, ?, ?)`, [userId, paymentId, note, JSON.stringify(oldValues), JSON.stringify(newValues)]);
      return (await tx.get('SELECT * FROM manual_payments WHERE user_id = ? AND id = ?', [userId, paymentId]))[0];
    });
  },

  async getManualPaymentHistory(userId, id) {
    const paymentId = validId(id, 'Encaissement');
    await ownedRow('manual_payments', userId, paymentId);
    const rows = await getQuery('SELECT * FROM manual_payment_history WHERE user_id = ? AND manual_payment_id = ? ORDER BY id DESC', [userId, paymentId]);
    return rows.map((row) => ({ ...row, old_values: JSON.parse(row.old_values), new_values: JSON.parse(row.new_values) }));
  },

  async listCustomerProfiles(userId, filters = {}) {
    const clauses = ['cp.user_id = ?'];
    const params = [userId];
    const lastActivity = `(SELECT MAX(activity_at) FROM (
      SELECT COALESCE(pl.status_updated_at, pl.created_at) AS activity_at FROM payment_links pl WHERE pl.user_id = cp.user_id AND pl.customer_id = cp.id
      UNION ALL SELECT COALESCE(mp.updated_at, mp.paid_at) FROM manual_payments mp WHERE mp.user_id = cp.user_id AND mp.customer_id = cp.id
    ))`;
    if (filters.archived === 'true') clauses.push('cp.archived_at IS NOT NULL');
    else if (filters.archived !== 'all') clauses.push('cp.archived_at IS NULL');
    if (filters.q) {
      const query = `%${String(filters.q).trim().toLowerCase()}%`;
      clauses.push('(LOWER(cp.full_name) LIKE ? OR LOWER(cp.phone_number) LIKE ? OR LOWER(cp.email) LIKE ? OR LOWER(cp.company) LIKE ? OR LOWER(cp.tags) LIKE ?)');
      params.push(query, query, query, query, query);
    }
    if (filters.from) {
      clauses.push(`COALESCE(${lastActivity}, cp.created_at) >= ?`);
      params.push(`${filters.from} 00:00:00`);
    }
    if (filters.to) {
      clauses.push(`COALESCE(${lastActivity}, cp.created_at) < datetime(?, '+1 day')`);
      params.push(`${filters.to} 00:00:00`);
    }
    return getQuery(`
      SELECT cp.*,
        (SELECT COUNT(*) FROM payment_links pl WHERE pl.user_id = cp.user_id AND pl.customer_id = cp.id) AS link_count,
        (SELECT COUNT(*) FROM manual_payments mp WHERE mp.user_id = cp.user_id AND mp.customer_id = cp.id) AS receipt_count,
        ${lastActivity} AS last_activity
      FROM customer_profiles cp WHERE ${clauses.join(' AND ')}
      ORDER BY cp.archived_at IS NOT NULL, COALESCE(last_activity, cp.updated_at) DESC, cp.id DESC LIMIT 1000
    `, params);
  },

  async getCustomerDetails(userId, id) {
    const customerId = validId(id, 'Client');
    const customer = await ownedRow('customer_profiles', userId, customerId);
    const [links, receipts, totals] = await Promise.all([
      getQuery(`SELECT id, identifier, description, amount, COALESCE(display_amount, amount) AS display_amount,
        CASE WHEN display_amount IS NULL THEN 'XOF' ELSE COALESCE(currency, 'XOF') END AS currency,
        payment_method, payment_url, status, status_updated_at, created_at, expires_at, archived_at
        FROM payment_links WHERE user_id = ? AND customer_id = ? ORDER BY id DESC`, [userId, customerId]),
      getQuery(`SELECT mp.*, pl.identifier AS link_identifier FROM manual_payments mp
        LEFT JOIN payment_links pl ON pl.id = mp.payment_link_id AND pl.user_id = mp.user_id
        WHERE mp.user_id = ? AND mp.customer_id = ? ORDER BY mp.paid_at DESC`, [userId, customerId]),
      getQuery(`SELECT currency, SUM(amount) AS amount, COUNT(*) AS count FROM (
        SELECT mp.currency, mp.amount FROM manual_payments mp WHERE mp.user_id = ? AND mp.customer_id = ? AND mp.status = 'confirmed'
        UNION ALL SELECT CASE WHEN pl.display_amount IS NULL THEN 'XOF' ELSE COALESCE(pl.currency, 'XOF') END, COALESCE(pl.display_amount, pl.amount) FROM payment_links pl
          WHERE pl.user_id = ? AND pl.customer_id = ? AND pl.status = 'paid'
            AND NOT EXISTS (SELECT 1 FROM manual_payments mp WHERE mp.user_id = pl.user_id AND mp.payment_link_id = pl.id AND mp.status = 'confirmed')
      ) GROUP BY currency`, [userId, customerId, userId, customerId]),
    ]);
    return { customer, links, receipts, totals };
  },

  async findPotentialCustomerDuplicates(userId, input) {
    const customerId = input.excludeId ? validId(input.excludeId, 'Client') : 0;
    const phone = normalizedText(input.phoneNumber, 80).toLowerCase();
    const email = normalizedText(input.email, 254).toLowerCase();
    if (!phone && !email) return [];
    const clauses = [];
    const params = [userId];
    if (phone) { clauses.push('LOWER(phone_number) = ?'); params.push(phone); }
    if (email) { clauses.push('LOWER(email) = ?'); params.push(email); }
    params.push(customerId);
    return getQuery(`SELECT id, full_name, phone_number, email, company, archived_at FROM customer_profiles
      WHERE user_id = ? AND (${clauses.join(' OR ')}) AND id != ? ORDER BY id DESC LIMIT 20`, params);
  },

  async createCustomerProfile(userId, input) {
    const fullName = normalizedText(input.fullName, 180);
    const phoneNumber = normalizedText(input.phoneNumber, 80);
    const email = normalizedText(input.email, 254).toLowerCase();
    if (!fullName && !phoneNumber && !email) fail('Saisissez au moins un nom, un téléphone ou un e-mail.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Adresse e-mail invalide.');
    const result = await runQuery(`INSERT INTO customer_profiles
      (user_id, full_name, phone_number, email, company, address, tags, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, fullName, phoneNumber, email, normalizedText(input.company, 180), normalizedText(input.address, 400), normalizedTags(input.tags), normalizedText(input.notes, 4000)]);
    return ownedRow('customer_profiles', userId, result.id);
  },

  async updateCustomerProfile(userId, id, input) {
    const customerId = validId(id, 'Client');
    const existing = await ownedRow('customer_profiles', userId, customerId);
    const fullName = input.fullName === undefined ? existing.full_name : normalizedText(input.fullName, 180);
    const phoneNumber = input.phoneNumber === undefined ? existing.phone_number : normalizedText(input.phoneNumber, 80);
    const email = input.email === undefined ? existing.email : normalizedText(input.email, 254).toLowerCase();
    if (!fullName && !phoneNumber && !email) fail('Conservez au moins un nom, un téléphone ou un e-mail.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Adresse e-mail invalide.');
    await runQuery(`UPDATE customer_profiles SET full_name = ?, phone_number = ?, email = ?, company = ?, address = ?,
      tags = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`, [
      fullName,
      phoneNumber,
      email,
      input.company === undefined ? existing.company : normalizedText(input.company, 180),
      input.address === undefined ? existing.address : normalizedText(input.address, 400),
      input.tags === undefined ? existing.tags : normalizedTags(input.tags),
      input.notes === undefined ? existing.notes : normalizedText(input.notes, 4000),
      userId,
      customerId,
    ]);
    return ownedRow('customer_profiles', userId, customerId);
  },

  async setCustomerArchived(userId, id, archived) {
    const customerId = validId(id, 'Client');
    await ownedRow('customer_profiles', userId, customerId);
    await runQuery(`UPDATE customer_profiles SET archived_at = ${archived ? 'CURRENT_TIMESTAMP' : 'NULL'},
      updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`, [userId, customerId]);
    return ownedRow('customer_profiles', userId, customerId);
  },

  async deleteOrAnonymizeCustomer(userId, id, mode) {
    const customerId = validId(id, 'Client');
    await ownedRow('customer_profiles', userId, customerId);
    const related = await getQuery(`SELECT
      (SELECT COUNT(*) FROM payment_links WHERE user_id = ? AND customer_id = ?) +
      (SELECT COUNT(*) FROM manual_payments WHERE user_id = ? AND customer_id = ?) AS count`, [userId, customerId, userId, customerId]);
    if (mode === 'anonymize') {
      await runQuery(`UPDATE customer_profiles SET full_name = 'Client anonymisé', phone_number = '', email = '', company = '',
        address = '', tags = '', notes = '', archived_at = COALESCE(archived_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND id = ?`, [userId, customerId]);
      return { anonymized: true };
    }
    if (related[0].count) fail('Ce client est encore relié à des liens ou encaissements. Choisissez l’anonymisation pour garder leur historique.', 409);
    await runQuery('DELETE FROM customer_profiles WHERE user_id = ? AND id = ?', [userId, customerId]);
    return { deleted: true };
  },

  async previewCustomerMerge(userId, targetId, sourceIds) {
    const target = validId(targetId, 'Client cible');
    const sources = [...new Set((sourceIds || []).map((id) => validId(id, 'Client source')))].filter((id) => id !== target);
    if (!sources.length || sources.length > 20) fail('Sélectionnez de 1 à 20 fiches à fusionner.');
    const targetRow = await ownedRow('customer_profiles', userId, target);
    const placeholders = sources.map(() => '?').join(',');
    const sourceRows = await getQuery(`SELECT * FROM customer_profiles WHERE user_id = ? AND id IN (${placeholders})`, [userId, ...sources]);
    if (sourceRows.length !== sources.length) fail('Une fiche source est introuvable dans ce compte.', 404);
    const counts = await getQuery(`SELECT
      (SELECT COUNT(*) FROM payment_links WHERE user_id = ? AND customer_id IN (${placeholders})) AS links,
      (SELECT COUNT(*) FROM manual_payments WHERE user_id = ? AND customer_id IN (${placeholders})) AS receipts`,
    [userId, ...sources, userId, ...sources]);
    return { target: targetRow, sources: sourceRows, links: counts[0].links, receipts: counts[0].receipts };
  },

  async mergeCustomers(userId, targetId, sourceIds) {
    const preview = await this.previewCustomerMerge(userId, targetId, sourceIds);
    const target = preview.target.id;
    const sources = preview.sources.map((row) => row.id);
    const placeholders = sources.map(() => '?').join(',');
    await runTransaction(async (tx) => {
      await tx.run(`UPDATE payment_links SET customer_id = ? WHERE user_id = ? AND customer_id IN (${placeholders})`, [target, userId, ...sources]);
      await tx.run(`UPDATE manual_payments SET customer_id = ? WHERE user_id = ? AND customer_id IN (${placeholders})`, [target, userId, ...sources]);
      await tx.run(`DELETE FROM customer_profiles WHERE user_id = ? AND id IN (${placeholders})`, [userId, ...sources]);
    });
    return { targetId: target, mergedIds: sources, links: preview.links, receipts: preview.receipts };
  },

  async listCatalogItems(userId, filters = {}) {
    const clauses = ['ci.user_id = ?'];
    const params = [userId];
    if (filters.archived === 'true') clauses.push('ci.archived_at IS NOT NULL');
    else if (filters.archived !== 'all') clauses.push('ci.archived_at IS NULL');
    if (filters.category) { clauses.push('LOWER(ci.category) = LOWER(?)'); params.push(filters.category); }
    if (filters.q) {
      const query = `%${String(filters.q).trim().toLowerCase()}%`;
      clauses.push('(LOWER(ci.name) LIKE ? OR LOWER(ci.description) LIKE ? OR LOWER(ci.sku) LIKE ? OR LOWER(ci.category) LIKE ?)');
      params.push(query, query, query, query);
    }
    return getQuery(`SELECT ci.*,
      (SELECT COUNT(*) FROM payment_links pl WHERE pl.user_id = ci.user_id AND pl.catalog_item_id = ci.id) AS link_count,
      (SELECT COUNT(*) FROM payment_links pl WHERE pl.user_id = ci.user_id AND pl.catalog_item_id = ci.id AND pl.status = 'paid') AS paid_link_count
      FROM catalog_items ci WHERE ${clauses.join(' AND ')} ORDER BY ci.archived_at IS NOT NULL, ci.name COLLATE NOCASE LIMIT 1000`, params);
  },

  async getCatalogItem(userId, id) {
    const itemId = validId(id, 'Article');
    const item = await ownedRow('catalog_items', userId, itemId);
    const [links, transactions] = await Promise.all([
      getQuery(`SELECT id, identifier, description, amount, COALESCE(display_amount, amount) AS display_amount,
        CASE WHEN display_amount IS NULL THEN 'XOF' ELSE COALESCE(currency, 'XOF') END AS currency,
        status, status_updated_at, created_at FROM payment_links WHERE user_id = ? AND catalog_item_id = ? ORDER BY id DESC`, [userId, itemId]),
      this.getTransactions(userId),
    ]);
    const salesMap = new Map();
    transactions.filter((row) => Number(row.catalog_item_id) === itemId && row.status === 'confirmed').forEach((row) => {
      const current = salesMap.get(row.currency) || { currency: row.currency, count: 0, amount: 0 };
      current.count += 1;
      current.amount += Number(row.amount || 0);
      salesMap.set(row.currency, current);
    });
    const sales = [...salesMap.values()];
    return { item, links, sales };
  },

  async createCatalogItem(userId, input) {
    const name = normalizedText(input.name, 180);
    if (!name) fail('Le nom de l’article est obligatoire.');
    const amount = validAmount(input.amount);
    const currency = validCurrency(input.currency);
    const result = await runQuery(`INSERT INTO catalog_items (user_id, name, description, sku, amount, currency, category, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [userId, name, normalizedText(input.description, 1000), normalizedText(input.sku, 80), amount, currency, normalizedText(input.category, 100)]);
    return ownedRow('catalog_items', userId, result.id);
  },

  async updateCatalogItem(userId, id, input) {
    const itemId = validId(id, 'Article');
    const item = await ownedRow('catalog_items', userId, itemId);
    const name = input.name === undefined ? item.name : normalizedText(input.name, 180);
    if (!name) fail('Le nom de l’article est obligatoire.');
    await runQuery(`UPDATE catalog_items SET name = ?, description = ?, sku = ?, amount = ?, currency = ?, category = ?,
      updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`, [
      name,
      input.description === undefined ? item.description : normalizedText(input.description, 1000),
      input.sku === undefined ? item.sku : normalizedText(input.sku, 80),
      input.amount === undefined ? item.amount : validAmount(input.amount),
      input.currency === undefined ? item.currency : validCurrency(input.currency),
      input.category === undefined ? item.category : normalizedText(input.category, 100),
      userId,
      itemId,
    ]);
    return ownedRow('catalog_items', userId, itemId);
  },

  async duplicateCatalogItem(userId, id) {
    const item = await ownedRow('catalog_items', userId, validId(id, 'Article'));
    if (item.archived_at) fail('Un article archivé ne peut pas être dupliqué.');
    const result = await runQuery(`INSERT INTO catalog_items (user_id, name, description, sku, amount, currency, category, updated_at)
      VALUES (?, ?, ?, '', ?, ?, ?, CURRENT_TIMESTAMP)`, [userId, `${item.name} (copie)`.slice(0, 180), item.description, item.amount, item.currency, item.category]);
    return ownedRow('catalog_items', userId, result.id);
  },

  async setCatalogArchived(userId, id, archived) {
    const itemId = validId(id, 'Article');
    await ownedRow('catalog_items', userId, itemId);
    await runQuery(`UPDATE catalog_items SET archived_at = ${archived ? 'CURRENT_TIMESTAMP' : 'NULL'},
      updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`, [userId, itemId]);
    return ownedRow('catalog_items', userId, itemId);
  },

  async getPaymentLinkForUser(userId, id) {
    const linkId = validId(id, 'Lien');
    const rows = await getQuery(`SELECT pl.*, cp.full_name AS customer_name, cp.email AS customer_email,
      cp.phone_number AS customer_phone, ci.name AS catalog_item_name
      FROM payment_links pl
      LEFT JOIN customer_profiles cp ON cp.id = pl.customer_id AND cp.user_id = pl.user_id
      LEFT JOIN catalog_items ci ON ci.id = pl.catalog_item_id AND ci.user_id = pl.user_id
      WHERE pl.user_id = ? AND pl.id = ?`, [userId, linkId]);
    return rows[0] || null;
  },

  async changePaymentLinkLifecycle(userId, id, input) {
    const linkId = validId(id, 'Lien');
    const requestedExpiresAt = input.expiresAt !== undefined ? (input.expiresAt ? validDate(input.expiresAt, 'Expiration locale') : null) : undefined;
    const reason = normalizedText(input.reason, 300);
    return runTransaction(async (tx) => {
      const rows = await tx.get('SELECT * FROM payment_links WHERE user_id = ? AND id = ?', [userId, linkId]);
      const link = rows[0];
      if (!link) fail('Élément introuvable dans ce compte.', 404);
      const archived = input.archived === undefined ? Boolean(link.archived_at) : Boolean(input.archived);
      const expiresAt = requestedExpiresAt === undefined ? link.expires_at : requestedExpiresAt;
      const archivedAt = archived ? (link.archived_at || new Date().toISOString().slice(0, 19).replace('T', ' ')) : null;
      const before = { archived_at: link.archived_at, expires_at: link.expires_at };
      await tx.run('UPDATE payment_links SET archived_at = ?, expires_at = ? WHERE user_id = ? AND id = ?', [archivedAt, expiresAt, userId, linkId]);
      const after = { archived_at: archivedAt, expires_at: expiresAt };
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        await tx.run(`INSERT INTO payment_link_history (user_id, payment_link_id, action, old_value, new_value, reason)
          VALUES (?, ?, 'lifecycle', ?, ?, ?)`, [userId, linkId, JSON.stringify(before), JSON.stringify(after), reason]);
      }
      return (await tx.get('SELECT * FROM payment_links WHERE user_id = ? AND id = ?', [userId, linkId]))[0];
    });
  },

  async getPaymentLinkHistory(userId, id) {
    const linkId = validId(id, 'Lien');
    await ownedRow('payment_links', userId, linkId);
    const rows = await getQuery('SELECT * FROM payment_link_history WHERE user_id = ? AND payment_link_id = ? ORDER BY id DESC', [userId, linkId]);
    return rows.map((row) => ({ ...row, old_value: parseJsonOrString(row.old_value), new_value: parseJsonOrString(row.new_value) }));
  },

  async bulkArchivePaymentLinks(userId, ids) {
    const linkIds = [...new Set((ids || []).map((id) => validId(id, 'Lien')))];
    if (!linkIds.length || linkIds.length > 100) fail('Sélectionnez de 1 à 100 liens.');
    const placeholders = linkIds.map(() => '?').join(',');
    return runTransaction(async (tx) => {
      const rows = await tx.get(`SELECT id, archived_at FROM payment_links WHERE user_id = ? AND id IN (${placeholders})`, [userId, ...linkIds]);
      if (rows.length !== linkIds.length) fail('Un des liens sélectionnés est introuvable dans ce compte.', 404);
      for (const row of rows) {
        if (row.archived_at) continue;
        await tx.run('UPDATE payment_links SET archived_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?', [userId, row.id]);
        await tx.run(`INSERT INTO payment_link_history (user_id, payment_link_id, action, old_value, new_value)
          VALUES (?, ?, 'archive', '', 'archived')`, [userId, row.id]);
      }
      return { archived: rows.filter((row) => !row.archived_at).length };
    });
  },

  async listReminders(userId) {
    const links = await getQuery(`SELECT pl.id, pl.identifier, pl.description, pl.amount,
      COALESCE(pl.display_amount, pl.amount) AS display_amount,
      CASE WHEN pl.display_amount IS NULL THEN 'XOF' ELSE COALESCE(pl.currency, 'XOF') END AS currency,
      pl.payment_method, pl.phone_number, pl.payment_url, pl.status, pl.expires_at, pl.created_at,
      pl.customer_id, cp.full_name AS customer_name, cp.email AS customer_email, ci.name AS catalog_item_name
      FROM payment_links pl
      LEFT JOIN customer_profiles cp ON cp.id = pl.customer_id AND cp.user_id = pl.user_id
      LEFT JOIN catalog_items ci ON ci.id = pl.catalog_item_id AND ci.user_id = pl.user_id
      WHERE pl.user_id = ? AND pl.status = 'pending' AND pl.archived_at IS NULL
        AND (pl.expires_at IS NULL OR pl.expires_at > CURRENT_TIMESTAMP)
      ORDER BY pl.created_at ASC LIMIT 1000`, [userId]);
    const history = await getQuery(`SELECT r.*, pl.identifier FROM payment_reminders r
      JOIN payment_links pl ON pl.id = r.payment_link_id AND pl.user_id = r.user_id
      WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 300`, [userId]);
    return { eligible: links, history };
  },

  async createReminder(userId, input) {
    const linkId = validId(input.paymentLinkId, 'Lien');
    const link = await ownedRow('payment_links', userId, linkId);
    if (link.status !== 'pending' || link.archived_at) fail('Seuls les liens en attente et actifs peuvent recevoir une relance préparée.');
    if (link.expires_at && new Date(link.expires_at.replace(' ', 'T') + 'Z').getTime() <= Date.now()) fail('Ce lien a expiré localement; vérifiez son état avant de préparer une relance.');
    const message = normalizedText(input.message, 4000);
    if (!message) fail('Le texte du rappel est obligatoire.');
    const status = input.status === 'sent' ? 'sent' : 'prepared';
    const channel = normalizedText(input.channel, 40);
    const result = await runQuery(`INSERT INTO payment_reminders (user_id, payment_link_id, message, channel, status, sent_at)
      VALUES (?, ?, ?, ?, ?, ${status === 'sent' ? 'CURRENT_TIMESTAMP' : 'NULL'})`, [userId, linkId, message, channel, status]);
    const rows = await getQuery('SELECT * FROM payment_reminders WHERE user_id = ? AND id = ?', [userId, result.id]);
    return rows[0];
  },

  async updateReminder(userId, id, input) {
    const reminderId = validId(id, 'Relance');
    const status = input.status;
    if (!['prepared', 'sent'].includes(status)) fail('Statut de relance invalide.');
    const rows = await getQuery('SELECT * FROM payment_reminders WHERE user_id = ? AND id = ?', [userId, reminderId]);
    const reminder = rows[0];
    if (!reminder) fail('Relance introuvable.', 404);
    const link = await ownedRow('payment_links', userId, reminder.payment_link_id);
    const expired = link.expires_at && asUtcDate(link.expires_at)?.getTime() <= Date.now();
    if (status === 'prepared' && (link.status !== 'pending' || link.archived_at || expired)) fail('Seuls les liens en attente, actifs et non expirés localement peuvent garder une relance préparée.');
    if (status === 'sent' && reminder.status === 'prepared' && (link.status !== 'pending' || link.archived_at || expired)) fail('Un lien payé, annulé, archivé ou expiré ne peut pas recevoir une nouvelle relance déclarée envoyée.');
    const message = input.message === undefined ? reminder.message : normalizedText(input.message, 4000);
    const channel = input.channel === undefined ? reminder.channel : normalizedText(input.channel, 40);
    await runQuery(`UPDATE payment_reminders SET message = ?, channel = ?, status = ?,
      sent_at = CASE WHEN ? = 'sent' THEN COALESCE(sent_at, CURRENT_TIMESTAMP) ELSE NULL END,
      updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`, [message, channel, status, status, userId, reminderId]);
    const updated = await getQuery('SELECT * FROM payment_reminders WHERE user_id = ? AND id = ?', [userId, reminderId]);
    return updated[0];
  },

  async getAccountData(userId, query = getQuery) {
    const tables = [
      ['customers', `SELECT id, full_name, phone_number, email, company, address, tags, notes, archived_at, created_at, updated_at FROM customer_profiles WHERE user_id = ? ORDER BY id`],
      ['catalogItems', `SELECT id, name, description, sku, amount, currency, category, archived_at, created_at, updated_at FROM catalog_items WHERE user_id = ? ORDER BY id`],
      ['paymentLinks', `SELECT id, identifier, description, amount, display_amount, currency, payment_method, phone_number, payment_url, status, status_updated_at, expires_at, archived_at, customer_id, catalog_item_id, created_at FROM payment_links WHERE user_id = ? ORDER BY id`],
      ['manualPayments', `SELECT id, payment_link_id, customer_id, amount, currency, method, reference, paid_at, note, status, created_at, updated_at FROM manual_payments WHERE user_id = ? ORDER BY id`],
      ['manualPaymentHistory', `SELECT id, manual_payment_id, reason, old_values, new_values, changed_at FROM manual_payment_history WHERE user_id = ? ORDER BY id`],
      ['paymentLinkHistory', `SELECT id, payment_link_id, action, old_value, new_value, reason, created_at FROM payment_link_history WHERE user_id = ? ORDER BY id`],
      ['reminders', `SELECT id, payment_link_id, message, channel, status, sent_at, created_at, updated_at FROM payment_reminders WHERE user_id = ? ORDER BY id`],
    ];
    const data = {};
    for (const [key, sql] of tables) data[key] = await query(sql, [userId]);
    return data;
  },

  async getTransactions(userId) {
    const [receipts, links] = await Promise.all([
      getQuery(`SELECT 'receipt-' || mp.id AS id, mp.payment_link_id, mp.customer_id, pl.catalog_item_id,
        COALESCE(cp.phone_number, pl.phone_number, '') AS phone_number, mp.amount, mp.currency, mp.method AS payment_method,
        mp.reference AS tx_reference, mp.paid_at AS created_at, mp.status, pl.identifier, mp.note,
        'manual_receipt' AS source
        FROM manual_payments mp LEFT JOIN payment_links pl ON pl.id = mp.payment_link_id AND pl.user_id = mp.user_id
        LEFT JOIN customer_profiles cp ON cp.id = mp.customer_id AND cp.user_id = mp.user_id
        WHERE mp.user_id = ? ORDER BY mp.paid_at DESC`, [userId]),
      getQuery(`SELECT 'link-' || pl.id AS id, pl.id AS payment_link_id, pl.customer_id, pl.catalog_item_id,
        COALESCE(pl.display_amount, pl.amount) AS amount,
        CASE WHEN pl.display_amount IS NULL THEN 'XOF' ELSE COALESCE(pl.currency, 'XOF') END AS currency, pl.phone_number,
        pl.payment_method, 'Confirmation manuelle' AS tx_reference, COALESCE(pl.status_updated_at, pl.created_at) AS created_at,
        'confirmed' AS status, pl.identifier, pl.description AS note, 'manual_link' AS source
        FROM payment_links pl WHERE pl.user_id = ? AND pl.status = 'paid'
          AND NOT EXISTS (SELECT 1 FROM manual_payments mp WHERE mp.user_id = pl.user_id AND mp.payment_link_id = pl.id AND mp.status = 'confirmed')
        ORDER BY created_at DESC`, [userId]),
    ]);
    return [...receipts, ...links].sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)));
  },

  async getRawRows(userId, table, filters = {}) {
    const allowed = {
      links: { query: `SELECT pl.id, pl.user_id, pl.identifier, pl.description,
        COALESCE(pl.display_amount, pl.amount) AS amount, pl.amount AS provider_amount,
        COALESCE(pl.display_amount, pl.amount) AS display_amount,
        CASE WHEN pl.display_amount IS NULL THEN 'XOF' ELSE COALESCE(pl.currency, 'XOF') END AS currency,
        pl.payment_method, pl.phone_number, pl.payment_url, pl.status, pl.status_updated_at, pl.expires_at,
        pl.archived_at, pl.customer_id, pl.catalog_item_id, pl.created_at,
        cp.full_name AS customer_name, ci.name AS catalog_item_name FROM payment_links pl
        LEFT JOIN customer_profiles cp ON cp.id = pl.customer_id AND cp.user_id = pl.user_id
        LEFT JOIN catalog_items ci ON ci.id = pl.catalog_item_id AND ci.user_id = pl.user_id WHERE pl.user_id = ? ORDER BY pl.created_at DESC`, date: 'pl.created_at', marker: 'WHERE pl.user_id = ?', alias: 'pl.' },
      receipts: { query: `SELECT mp.*, pl.identifier AS link_identifier, cp.full_name AS customer_name FROM manual_payments mp
        LEFT JOIN payment_links pl ON pl.id = mp.payment_link_id AND pl.user_id = mp.user_id
        LEFT JOIN customer_profiles cp ON cp.id = mp.customer_id AND cp.user_id = mp.user_id WHERE mp.user_id = ? ORDER BY mp.paid_at DESC`, date: 'mp.paid_at', marker: 'WHERE mp.user_id = ?', alias: 'mp.' },
      customers: { query: 'SELECT * FROM customer_profiles WHERE user_id = ? ORDER BY created_at DESC', date: 'created_at', marker: 'WHERE user_id = ?', alias: '' },
      catalog: { query: 'SELECT * FROM catalog_items WHERE user_id = ? ORDER BY created_at DESC', date: 'created_at', marker: 'WHERE user_id = ?', alias: '' },
    };
    if (table === 'transactions') return this.getTransactions(userId);
    const config = allowed[table];
    if (!config) fail('Type d’export inconnu.');
    const clauses = [`${config.alias}user_id = ?`];
    const params = [userId];
    if (filters.status) {
      if (!['links', 'receipts'].includes(table)) fail('Le statut ne s’applique pas à ce type d’export.');
      const allowedStatuses = table === 'links' ? ['pending', 'paid', 'cancelled'] : ['confirmed', 'void'];
      if (!allowedStatuses.includes(filters.status)) fail('Statut de filtre invalide.');
      clauses.push(`${config.alias}status = ?`);
      params.push(filters.status);
    }
    if (filters.currency && CURRENCIES.has(filters.currency)) {
      clauses.push(table === 'links'
        ? `CASE WHEN pl.display_amount IS NULL THEN 'XOF' ELSE COALESCE(pl.currency, 'XOF') END = ?`
        : `${config.alias}currency = ?`);
      params.push(filters.currency);
    }
    if (filters.customerId && ['links', 'receipts'].includes(table)) {
      clauses.push(`${config.alias}customer_id = ?`);
      params.push(validId(filters.customerId, 'Client'));
    }
    if (filters.ids) {
      if (table !== 'links') fail('La sélection multiple s’applique uniquement aux liens.');
      const ids = [...new Set(String(filters.ids).split(',').map((id) => validId(id, 'Lien')))];
      if (!ids.length || ids.length > 100) fail('Sélectionnez de 1 à 100 liens à exporter.');
      clauses.push(`pl.id IN (${ids.map(() => '?').join(',')})`);
      params.push(...ids);
    }
    if (filters.from || filters.to) {
      const field = config.date.includes('.') ? config.date : `${config.alias}${config.date}`;
      dateConditions(field, filters, clauses, params);
    }
    const sql = config.query.replace(config.marker, `WHERE ${clauses.join(' AND ')}`);
    return getQuery(sql, params);
  },

  async getAnalytics(userId, from, to) {
    const [links, receipts] = await Promise.all([
      getQuery('SELECT * FROM payment_links WHERE user_id = ?', [userId]),
      getQuery('SELECT * FROM manual_payments WHERE user_id = ?', [userId]),
    ]);
    const now = new Date();
    const requestedEnd = to ? new Date(`${to}T00:00:00Z`) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const toDate = new Date(requestedEnd.getTime() + 86400000);
    const fromDate = from ? new Date(`${from}T00:00:00Z`) : new Date(toDate.getTime() - 29 * 86400000);
    if (!Number.isFinite(fromDate.getTime()) || !Number.isFinite(toDate.getTime()) || toDate <= fromDate) fail('Période analytique invalide.');
    const periodLength = toDate.getTime() - fromDate.getTime();
    const previousFrom = new Date(fromDate.getTime() - periodLength);
    const previousTo = fromDate;
    const inRange = (value, start, end) => {
      const parsed = asUtcDate(value);
      return Boolean(parsed && Number.isFinite(parsed.getTime()) && parsed >= start && parsed < end);
    };
    const linkCurrency = (row) => row.display_amount == null ? 'XOF' : row.currency || 'XOF';
    const linkAmount = (row) => Number(row.display_amount ?? row.amount ?? 0);
    const currencies = new Set([...links.map(linkCurrency), ...receipts.map((row) => row.currency)]);
    const byCurrency = new Map([...currencies].map((currency) => [currency, {
      currency, linksCreated: 0, paidLinks: 0, eligibleLinks: 0, receiptCount: 0,
      revenue: 0, pendingAmount: 0, cancelledAmount: 0, previousRevenue: 0,
    }]));
    const revenueEvents = [];
    const receiptLinkIds = new Set(receipts.filter((row) => row.status === 'confirmed' && row.payment_link_id).map((row) => Number(row.payment_link_id)));
    const linksById = new Map(links.map((link) => [Number(link.id), link]));
    for (const receipt of receipts) {
      const bucket = byCurrency.get(receipt.currency) || { currency: receipt.currency };
      byCurrency.set(receipt.currency, bucket);
      if (receipt.status === 'confirmed') {
        const relatedLink = receipt.payment_link_id ? linksById.get(Number(receipt.payment_link_id)) : null;
        const event = { date: receipt.paid_at, currency: receipt.currency, amount: Number(receipt.amount), method: receipt.method, customerId: receipt.customer_id || relatedLink?.customer_id, catalogItemId: relatedLink?.catalog_item_id, linkId: receipt.payment_link_id, source: 'receipt' };
        revenueEvents.push(event);
        if (inRange(receipt.paid_at, fromDate, toDate)) {
          bucket.receiptCount += 1;
        }
      }
    }
    for (const link of links) {
      const currency = linkCurrency(link);
      const amount = linkAmount(link);
      const bucket = byCurrency.get(currency) || { currency };
      byCurrency.set(currency, bucket);
      const createdInPeriod = inRange(link.created_at, fromDate, toDate);
      const expiration = asUtcDate(link.expires_at);
      const expiresBeforeEnd = Boolean(expiration && expiration < toDate);
      if (createdInPeriod) {
        bucket.linksCreated += 1;
        const eligible = link.status !== 'cancelled' && (link.status === 'paid' || !expiresBeforeEnd);
        if (eligible) bucket.eligibleLinks += 1;
        if (link.status === 'paid') bucket.paidLinks += 1;
        if (link.status === 'pending' && !expiresBeforeEnd) bucket.pendingAmount += amount;
        if (link.status === 'cancelled') bucket.cancelledAmount += amount;
      }
      if (link.status === 'paid') {
        const paidDate = link.status_updated_at || link.created_at;
        if (!receiptLinkIds.has(Number(link.id))) revenueEvents.push({ date: paidDate, currency, amount, method: link.payment_method, customerId: link.customer_id, catalogItemId: link.catalog_item_id, linkId: link.id, source: 'paid_link' });
      }
    }
    const dailyMap = new Map();
    const monthlyMap = new Map();
    const methodMap = new Map();
    const productMap = new Map();
    const customerMap = new Map();
    for (const event of revenueEvents) {
      const bucket = byCurrency.get(event.currency) || { currency: event.currency };
      byCurrency.set(event.currency, bucket);
      if (inRange(event.date, fromDate, toDate)) {
        bucket.revenue += event.amount;
        const date = asUtcDate(event.date);
        const day = date.toISOString().slice(0, 10);
        const key = `${event.currency}:${day}`;
        dailyMap.set(key, (dailyMap.get(key) || 0) + event.amount);
        const monthKey = `${event.currency}:${day.slice(0, 7)}`;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + event.amount);
        const methodKey = `${event.currency}\u0000${event.method || 'Autre'}`;
        methodMap.set(methodKey, (methodMap.get(methodKey) || 0) + event.amount);
        if (event.catalogItemId) {
          const productKey = `${event.currency}:${event.catalogItemId}`;
          productMap.set(productKey, (productMap.get(productKey) || 0) + event.amount);
        }
        if (event.customerId) {
          const customerKey = `${event.currency}:${event.customerId}`;
          customerMap.set(customerKey, (customerMap.get(customerKey) || 0) + event.amount);
        }
      } else if (inRange(event.date, previousFrom, previousTo)) {
        bucket.previousRevenue += event.amount;
      }
    }
    const [catalog, customers] = await Promise.all([
      getQuery('SELECT id, name FROM catalog_items WHERE user_id = ?', [userId]),
      getQuery('SELECT id, full_name, phone_number FROM customer_profiles WHERE user_id = ?', [userId]),
    ]);
    return {
      from: fromDate.toISOString().slice(0, 10),
      to: new Date(toDate.getTime() - 86400000).toISOString().slice(0, 10),
      previousFrom: previousFrom.toISOString().slice(0, 10),
      previousTo: new Date(previousTo.getTime() - 86400000).toISOString().slice(0, 10),
      currencies: [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency)).map((row) => ({
        ...row,
        conversionRate: row.eligibleLinks ? Math.round((row.paidLinks / row.eligibleLinks) * 10000) / 100 : 0,
        revenueChange: row.previousRevenue ? Math.round(((row.revenue - row.previousRevenue) / row.previousRevenue) * 10000) / 100 : null,
      })),
      daily: [...dailyMap.entries()].map(([key, amount]) => { const [currency, date] = key.split(':'); return { currency, date, amount }; }).sort((a, b) => a.date.localeCompare(b.date)),
      monthly: [...monthlyMap.entries()].map(([key, amount]) => { const [currency, month] = key.split(':'); return { currency, month, amount }; }).sort((a, b) => a.month.localeCompare(b.month)),
      methods: [...methodMap.entries()].map(([key, amount]) => { const [currency, method] = key.split('\u0000'); return { currency, method, amount }; }).sort((a, b) => b.amount - a.amount),
      products: [...productMap.entries()].map(([key, amount]) => { const [currency, id] = key.split(':'); return { currency, itemId: Number(id), name: catalog.find((row) => row.id === Number(id))?.name || 'Article archivé', amount }; }).sort((a, b) => b.amount - a.amount),
      customers: [...customerMap.entries()].map(([key, amount]) => { const [currency, id] = key.split(':'); const row = customers.find((customer) => customer.id === Number(id)); return { currency, customerId: Number(id), name: row?.full_name || row?.phone_number || 'Client', amount }; }).sort((a, b) => b.amount - a.amount),
    };
  },
};

function parseJsonOrString(value) {
  try { return JSON.parse(value); } catch { return value; }
}

module.exports = { FeatureModel, fail, normalizedText, validId, validAmount, validCurrency, validDate };
