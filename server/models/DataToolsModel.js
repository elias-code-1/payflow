'use strict';

const crypto = require('crypto');
const { getQuery, runQuery, runTransaction } = require('../db');
const { FeatureModel, fail, validId } = require('./FeatureModel');

const BACKUP_FORMAT = 'payflow-account-backup';
const BACKUP_VERSION = 1;
const BACKUP_LIMIT = 25000;
const BACKUP_TABLES = [
  'customers', 'catalogItems', 'paymentLinks', 'manualPayments',
  'manualPaymentHistory', 'paymentLinkHistory', 'reminders',
];

function checksum(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function makeDocument(data) {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_VERSION,
    generatedAt: new Date().toISOString(),
    checksum: checksum(data),
    data,
  };
}

function validateBackup(document) {
  if (!document || typeof document !== 'object' || document.format !== BACKUP_FORMAT) fail('Le fichier n’est pas une sauvegarde PayFlow reconnue.');
  if (document.schemaVersion !== BACKUP_VERSION) fail('Version de sauvegarde incompatible avec cette version de PayFlow.');
  if (!document.data || typeof document.data !== 'object' || Array.isArray(document.data)) fail('Le contenu de la sauvegarde est invalide.');
  const serialized = JSON.stringify(document);
  if (Buffer.byteLength(serialized, 'utf8') > 20 * 1024 * 1024) fail('La sauvegarde dépasse la taille maximale de 20 Mo.');
  for (const table of BACKUP_TABLES) {
    if (!Array.isArray(document.data[table]) || document.data[table].length > BACKUP_LIMIT) {
      fail(`La catégorie ${table} est absente ou dépasse la limite autorisée.`);
    }
    if (document.data[table].some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
      fail(`La catégorie ${table} contient une ligne invalide.`);
    }
  }
  if (typeof document.checksum !== 'string' || !/^[a-f0-9]{64}$/.test(document.checksum)) fail('Le checksum de la sauvegarde est absent ou invalide.');
  const actualChecksum = checksum(document.data);
  const expected = Buffer.from(document.checksum, 'hex');
  const actual = Buffer.from(actualChecksum, 'hex');
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) fail('Le checksum ne correspond pas au contenu de la sauvegarde.');

  const ids = {};
  for (const table of BACKUP_TABLES) {
    ids[table] = new Set();
    for (const row of document.data[table]) {
      const id = Number(row.id);
      if (!Number.isSafeInteger(id) || id <= 0 || ids[table].has(id)) fail(`Identifiant invalide ou dupliqué dans ${table}.`);
      ids[table].add(id);
    }
  }
  const currencies = new Set(['XOF', 'EUR', 'USD']);
  for (const customer of document.data.customers) {
    if (typeof customer.full_name !== 'string' || typeof customer.phone_number !== 'string' || typeof customer.email !== 'string') fail('Fiche client invalide.');
  }
  for (const item of document.data.catalogItems) {
    if (typeof item.name !== 'string' || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0 || !currencies.has(item.currency)) fail('Article du catalogue invalide.');
  }
  const identifiers = new Set();
  for (const link of document.data.paymentLinks) {
    if (typeof link.identifier !== 'string' || !link.identifier || identifiers.has(link.identifier)) fail('Identifiant de lien invalide ou dupliqué.');
    identifiers.add(link.identifier);
    if (!['pending', 'paid', 'cancelled'].includes(link.status) || !currencies.has(link.currency) || !Number.isFinite(Number(link.amount)) || Number(link.amount) <= 0) fail('Lien de paiement invalide.');
    if (link.customer_id && !ids.customers.has(Number(link.customer_id))) fail('Un lien référence un client absent de la sauvegarde.');
    if (link.catalog_item_id && !ids.catalogItems.has(Number(link.catalog_item_id))) fail('Un lien référence un article absent de la sauvegarde.');
  }
  for (const payment of document.data.manualPayments) {
    if (!currencies.has(payment.currency) || !Number.isFinite(Number(payment.amount)) || Number(payment.amount) <= 0 || !['confirmed', 'void'].includes(payment.status)) fail('Encaissement invalide.');
    if (payment.payment_link_id && !ids.paymentLinks.has(Number(payment.payment_link_id))) fail('Un encaissement référence un lien absent de la sauvegarde.');
    if (payment.customer_id && !ids.customers.has(Number(payment.customer_id))) fail('Un encaissement référence un client absent de la sauvegarde.');
  }
  for (const row of document.data.manualPaymentHistory) if (!ids.manualPayments.has(Number(row.manual_payment_id))) fail('Historique d’encaissement invalide.');
  for (const row of document.data.paymentLinkHistory) if (!ids.paymentLinks.has(Number(row.payment_link_id))) fail('Historique de lien invalide.');
  for (const row of document.data.reminders) {
    if (!ids.paymentLinks.has(Number(row.payment_link_id)) || !['prepared', 'sent'].includes(row.status)) fail('Relance invalide.');
  }
  return document;
}

function safeExportRows(rows, includeSensitive) {
  return rows.map((row) => {
    const { user_id: _userId, ...safe } = row;
    if (typeof safe.payment_url === 'string') {
      try {
        const url = new URL(safe.payment_url);
        if (url.searchParams.has('token')) url.searchParams.set('token', '[masqué]');
        if (!includeSensitive && url.searchParams.has('phone')) url.searchParams.set('phone', '[masqué]');
        safe.payment_url = url.toString();
      } catch {
        safe.payment_url = '';
      }
    }
    if (!includeSensitive) {
      delete safe.note;
      delete safe.notes;
      delete safe.address;
      delete safe.phone_number;
      delete safe.email;
      delete safe.company;
      delete safe.full_name;
      delete safe.customer_name;
      delete safe.customer_phone;
      delete safe.customer_email;
    }
    return safe;
  });
}

function csvCell(value) {
  let text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows, type) {
  const fallbackColumns = {
    links: ['identifier', 'description', 'amount', 'currency', 'payment_method', 'status', 'created_at'],
    receipts: ['reference', 'amount', 'currency', 'method', 'status', 'paid_at'],
    customers: ['full_name', 'phone_number', 'email', 'company', 'tags', 'created_at'],
    catalog: ['name', 'sku', 'description', 'amount', 'currency', 'category', 'created_at'],
    transactions: ['tx_reference', 'identifier', 'amount', 'currency', 'payment_method', 'status', 'created_at', 'source'],
  };
  const columns = rows.length ? [...new Set(rows.flatMap((row) => Object.keys(row)))] : fallbackColumns[type];
  return `\uFEFF${[columns.map(csvCell).join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\r\n')}`;
}

function dateFilter(filters = {}) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const from = filters.from ? String(filters.from) : '';
  const to = filters.to ? String(filters.to) : '';
  const isValidDate = (value) => {
    if (!datePattern.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  if ((from && !isValidDate(from)) || (to && !isValidDate(to)) || (from && to && from > to)) fail('Période d’export invalide.');
  return { ...filters, from, to };
}

const DataToolsModel = {
  async exportRows(userId, type, filters = {}) {
    const normalizedFilters = dateFilter(filters);
    if (!['links', 'receipts', 'customers', 'catalog', 'transactions'].includes(type)) fail('Type d’export inconnu.');
    let rows;
    if (type === 'transactions') {
      rows = await FeatureModel.getTransactions(userId);
      if (normalizedFilters.from) rows = rows.filter((row) => String(row.created_at).slice(0, 10) >= normalizedFilters.from);
      if (normalizedFilters.to) rows = rows.filter((row) => String(row.created_at).slice(0, 10) <= normalizedFilters.to);
      if (normalizedFilters.currency) rows = rows.filter((row) => row.currency === normalizedFilters.currency);
      if (normalizedFilters.status) rows = rows.filter((row) => row.status === normalizedFilters.status || (normalizedFilters.status === 'confirmed' && row.status === 'confirmed'));
      if (normalizedFilters.customerId) rows = rows.filter((row) => Number(row.customer_id) === Number(normalizedFilters.customerId));
    } else {
      rows = await FeatureModel.getRawRows(userId, type, normalizedFilters);
    }
    return safeExportRows(rows, normalizedFilters.includeSensitive === 'true');
  },

  async previewExport(userId, type, filters) {
    const rows = await this.exportRows(userId, type, filters);
    return { type, count: rows.length, generatedAt: new Date().toISOString(), filters: dateFilter(filters) };
  },

  async createExport(userId, type, filters, format) {
    const rows = await this.exportRows(userId, type, filters);
    const manifest = { format: 'payflow-export', version: 1, type, generatedAt: new Date().toISOString(), filters: dateFilter(filters), count: rows.length };
    if (format === 'csv') return { contentType: 'text/csv; charset=utf-8', extension: 'csv', body: toCsv(rows, type) };
    if (format !== 'json') fail('Format d’export non pris en charge.');
    return { contentType: 'application/json; charset=utf-8', extension: 'json', body: JSON.stringify({ ...manifest, records: rows }, null, 2) };
  },

  async createBackup(userId, source = 'manual') {
    return runTransaction(async (tx) => {
      const integrity = await tx.get('PRAGMA integrity_check');
      if (!integrity.length || integrity.some((row) => Object.values(row)[0] !== 'ok')) fail('La base SQLite signale une erreur; aucune sauvegarde n’a été créée.', 500);
      const foreignKeys = await tx.get('PRAGMA foreign_key_check');
      if (foreignKeys.length) fail('La base contient des références incohérentes; aucune sauvegarde n’a été créée.', 500);
      const data = await FeatureModel.getAccountData(userId, tx.get);
      const document = makeDocument(data);
      const serialized = JSON.stringify(document);
      const sizeBytes = Buffer.byteLength(serialized, 'utf8');
      if (sizeBytes > 20 * 1024 * 1024) fail('La sauvegarde dépasse la taille maximale de 20 Mo; aucune copie n’a été créée.');
      const result = await tx.run(`INSERT INTO backup_snapshots (user_id, checksum, schema_version, size_bytes, source, payload_json)
        VALUES (?, ?, ?, ?, ?, ?)`, [userId, document.checksum, BACKUP_VERSION, sizeBytes, source, serialized]);
      return { id: result.id, checksum: document.checksum, schemaVersion: BACKUP_VERSION, sizeBytes, createdAt: document.generatedAt, document };
    });
  },

  async pruneAutomaticBackups(userId, retain = 30) {
    const keep = Math.max(1, Math.min(365, Number(retain) || 30));
    return runQuery(`DELETE FROM backup_snapshots
      WHERE user_id = ? AND source = 'automatic-daily'
      AND id NOT IN (
        SELECT id FROM backup_snapshots
        WHERE user_id = ? AND source = 'automatic-daily'
        ORDER BY id DESC LIMIT ?
      )`, [userId, userId, keep]);
  },

  async listBackups(userId) {
    return getQuery('SELECT id, checksum, schema_version, size_bytes, source, created_at FROM backup_snapshots WHERE user_id = ? ORDER BY id DESC LIMIT 100', [userId]);
  },

  async getBackup(userId, id) {
    const rows = await getQuery('SELECT payload_json FROM backup_snapshots WHERE user_id = ? AND id = ?', [userId, validId(id, 'Sauvegarde')]);
    if (!rows[0]) fail('Sauvegarde introuvable.', 404);
    return JSON.parse(rows[0].payload_json);
  },

  verifyBackup(document) {
    const valid = validateBackup(document);
    return {
      valid: true,
      checksum: valid.checksum,
      schemaVersion: valid.schemaVersion,
      generatedAt: valid.generatedAt,
      counts: Object.fromEntries(BACKUP_TABLES.map((table) => [table, valid.data[table].length])),
    };
  },

  async restoreBackup(userId, document) {
    const valid = validateBackup(document);
    return runTransaction(async (tx) => {
      const collisionRows = await tx.get(`SELECT identifier FROM payment_links WHERE user_id != ? AND identifier IN
        (${valid.data.paymentLinks.map(() => '?').join(',') || "''"})`, [userId, ...valid.data.paymentLinks.map((row) => row.identifier)]);
      if (collisionRows.length) fail('Un identifiant de lien est déjà utilisé par un autre compte. La base n’a pas été modifiée.', 409);

      const currentData = await FeatureModel.getAccountData(userId, tx.get);
      const safetyDocument = makeDocument(currentData);
      const safetyJson = JSON.stringify(safetyDocument);
      await tx.run(`INSERT INTO backup_snapshots (user_id, checksum, schema_version, size_bytes, source, payload_json)
        VALUES (?, ?, ?, ?, 'before-restore', ?)`, [userId, safetyDocument.checksum, BACKUP_VERSION, Buffer.byteLength(safetyJson, 'utf8'), safetyJson]);

      for (const table of ['payment_reminders', 'payment_link_history', 'manual_payment_history', 'manual_payments', 'payment_links', 'catalog_items', 'customer_profiles']) {
        await tx.run(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
      }

      const customerIds = new Map();
      for (const row of valid.data.customers) {
        const inserted = await tx.run(`INSERT INTO customer_profiles
          (user_id, full_name, phone_number, email, company, address, tags, notes, archived_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`, [userId,
          row.full_name || '', row.phone_number || '', row.email || '', row.company || '', row.address || '', row.tags || '', row.notes || '', row.archived_at || null, row.created_at || null, row.updated_at || null]);
        customerIds.set(Number(row.id), inserted.id);
      }

      const catalogIds = new Map();
      for (const row of valid.data.catalogItems) {
        const inserted = await tx.run(`INSERT INTO catalog_items
          (user_id, name, description, sku, amount, currency, category, archived_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`, [userId,
          row.name, row.description || '', row.sku || '', Number(row.amount), row.currency, row.category || '', row.archived_at || null, row.created_at || null, row.updated_at || null]);
        catalogIds.set(Number(row.id), inserted.id);
      }

      const linkIds = new Map();
      for (const row of valid.data.paymentLinks) {
        const inserted = await tx.run(`INSERT INTO payment_links
          (user_id, identifier, description, amount, display_amount, currency, payment_method, phone_number, payment_url,
           status, status_updated_at, expires_at, archived_at, customer_id, catalog_item_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`, [userId, row.identifier,
          row.description || '', Number(row.amount), Number(row.display_amount ?? row.amount), row.currency, row.payment_method || '',
          row.phone_number || '', row.payment_url || '', row.status, row.status_updated_at || null, row.expires_at || null,
          row.archived_at || null, row.customer_id ? customerIds.get(Number(row.customer_id)) : null,
          row.catalog_item_id ? catalogIds.get(Number(row.catalog_item_id)) : null, row.created_at || null]);
        linkIds.set(Number(row.id), inserted.id);
      }

      const manualIds = new Map();
      for (const row of valid.data.manualPayments) {
        const inserted = await tx.run(`INSERT INTO manual_payments
          (user_id, payment_link_id, customer_id, amount, currency, method, reference, paid_at, note, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`, [userId,
          row.payment_link_id ? linkIds.get(Number(row.payment_link_id)) : null,
          row.customer_id ? customerIds.get(Number(row.customer_id)) : null,
          Number(row.amount), row.currency, row.method || '', row.reference || '', row.paid_at, row.note || '', row.status,
          row.created_at || null, row.updated_at || null]);
        manualIds.set(Number(row.id), inserted.id);
      }

      for (const row of valid.data.manualPaymentHistory) {
        await tx.run(`INSERT INTO manual_payment_history (user_id, manual_payment_id, reason, old_values, new_values, changed_at)
          VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`, [userId, manualIds.get(Number(row.manual_payment_id)), row.reason || '',
          typeof row.old_values === 'string' ? row.old_values : JSON.stringify(row.old_values || {}),
          typeof row.new_values === 'string' ? row.new_values : JSON.stringify(row.new_values || {}), row.changed_at || null]);
      }
      for (const row of valid.data.paymentLinkHistory) {
        await tx.run(`INSERT INTO payment_link_history (user_id, payment_link_id, action, old_value, new_value, reason, created_at)
          VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`, [userId, linkIds.get(Number(row.payment_link_id)), row.action || 'status',
          typeof row.old_value === 'string' ? row.old_value : JSON.stringify(row.old_value ?? ''),
          typeof row.new_value === 'string' ? row.new_value : JSON.stringify(row.new_value ?? ''), row.reason || '', row.created_at || null]);
      }
      for (const row of valid.data.reminders) {
        await tx.run(`INSERT INTO payment_reminders (user_id, payment_link_id, message, channel, status, sent_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`, [userId,
          linkIds.get(Number(row.payment_link_id)), row.message || '', row.channel || '', row.status, row.sent_at || null,
          row.created_at || null, row.updated_at || null]);
      }

      const integrity = await tx.get('PRAGMA integrity_check');
      if (!integrity.length || integrity.some((row) => Object.values(row)[0] !== 'ok')) fail('La vérification SQLite a échoué; restauration annulée.', 500);
      const foreignKeys = await tx.get('PRAGMA foreign_key_check');
      if (foreignKeys.length) fail('La vérification des références a échoué; restauration annulée.', 500);
      return {
        restored: true,
        safetyBackupCreated: true,
        counts: Object.fromEntries(BACKUP_TABLES.map((table) => [table, valid.data[table].length])),
      };
    });
  },
};

module.exports = { DataToolsModel, BACKUP_FORMAT, BACKUP_VERSION };
