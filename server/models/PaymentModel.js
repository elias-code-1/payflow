const { getQuery, runQuery, runTransaction } = require('../db');
const { FeatureModel } = require('./FeatureModel');

class PaymentModel {
  static async getStats(userId) {
    const [links, pendingLinks, customers, transactions] = await Promise.all([
      getQuery('SELECT COUNT(*) AS total FROM payment_links WHERE user_id = ?', [userId]),
      getQuery("SELECT COUNT(*) AS total FROM payment_links WHERE user_id = ? AND status = 'pending'", [userId]),
      getQuery("SELECT COUNT(*) AS total FROM customer_profiles WHERE user_id = ? AND archived_at IS NULL", [userId]),
      FeatureModel.getTransactions(userId),
    ]);

    const paidCount = transactions.filter((transaction) => transaction.status === 'confirmed' || Number(transaction.status) === 1).length;
    const revenueByCurrency = {};
    for (const transaction of transactions) {
      if (transaction.status !== 'confirmed' && Number(transaction.status) !== 1) continue;
      const currency = transaction.currency || 'XOF';
      revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + Number(transaction.amount || 0);
    }
    return {
      payments: paidCount,
      completed: paidCount,
      links: links[0]?.total || 0,
      pending: pendingLinks[0]?.total || 0,
      customers: customers[0]?.total || 0,
      revenue: Number(revenueByCurrency.XOF || 0),
      revenueByCurrency,
    };
  }

  static async getPayments(_userId) {
    return FeatureModel.getTransactions(_userId);
  }

  static async getPaymentLinks(userId) {
    return await getQuery(
      `SELECT pl.id, pl.identifier, pl.description, pl.amount,
        COALESCE(pl.display_amount, pl.amount) AS display_amount,
        CASE WHEN pl.display_amount IS NULL THEN 'XOF' ELSE COALESCE(pl.currency, 'XOF') END AS currency,
        pl.payment_method,
        pl.phone_number, pl.payment_url, pl.status, pl.status_updated_at, pl.created_at, pl.expires_at, pl.archived_at,
        pl.customer_id, pl.catalog_item_id, cp.full_name AS customer_name, ci.name AS catalog_item_name
       FROM payment_links pl
       LEFT JOIN customer_profiles cp ON cp.id = pl.customer_id AND cp.user_id = pl.user_id
       LEFT JOIN catalog_items ci ON ci.id = pl.catalog_item_id AND ci.user_id = pl.user_id
       WHERE pl.user_id = ? ORDER BY pl.id DESC LIMIT 2000`,
      [userId]
    );
  }

  static async updatePaymentLinkStatus(userId, paymentLinkId, status, reason = '') {
    const normalizedStatus = String(status || 'pending').toLowerCase();
    const allowedStatuses = ['pending', 'paid', 'cancelled'];
    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new Error('Statut de paiement invalide.');
    }

    return runTransaction(async (tx) => {
      const oldRows = await tx.get('SELECT status FROM payment_links WHERE user_id = ? AND id = ?', [userId, paymentLinkId]);
      if (!oldRows[0]) return null;
      if (oldRows[0].status === normalizedStatus) return normalizedStatus;
      const result = await tx.run(
        "UPDATE payment_links SET status = ?, status_updated_at = datetime('now') WHERE user_id = ? AND id = ?",
        [normalizedStatus, userId, paymentLinkId]
      );
      if (result.changes > 0) {
        await tx.run(`INSERT INTO payment_link_history (user_id, payment_link_id, action, old_value, new_value, reason)
          VALUES (?, ?, 'status', ?, ?, ?)`, [userId, paymentLinkId, oldRows[0].status, normalizedStatus, String(reason || '').trim().slice(0, 300)]);
      }
      return result.changes > 0 ? normalizedStatus : null;
    });
  }

  static async createPaymentLink({ userId, identifier, description, amount, displayAmount, currency, network, phoneNumber, paymentUrl, customerId, catalogItemId, expiresAt }) {
    return runTransaction(async (tx) => {
      let resolvedCustomerId = customerId || null;
      if (resolvedCustomerId) {
        const customer = await tx.get('SELECT id, phone_number, archived_at FROM customer_profiles WHERE user_id = ? AND id = ?', [userId, resolvedCustomerId]);
        if (!customer[0]) throw Object.assign(new Error('Client introuvable dans ce compte.'), { status: 404 });
        if (customer[0].archived_at) throw Object.assign(new Error('Réactivez la fiche client avant de créer un nouveau lien.'), { status: 400 });
        if (phoneNumber && customer[0].phone_number && phoneNumber !== customer[0].phone_number) throw Object.assign(new Error('Le téléphone ne correspond pas à la fiche client sélectionnée.'), { status: 400 });
      } else if (phoneNumber) {
        const customer = await tx.get(`SELECT id FROM customer_profiles WHERE user_id = ? AND phone_number = ? AND archived_at IS NULL ORDER BY id LIMIT 1`, [userId, phoneNumber]);
        if (customer[0]) resolvedCustomerId = customer[0].id;
        else {
          const insertedCustomer = await tx.run('INSERT INTO customer_profiles (user_id, phone_number) VALUES (?, ?)', [userId, phoneNumber]);
          resolvedCustomerId = insertedCustomer.id;
        }
      }
      if (catalogItemId) {
        const item = await tx.get('SELECT id, archived_at FROM catalog_items WHERE user_id = ? AND id = ?', [userId, catalogItemId]);
        if (!item[0]) throw Object.assign(new Error('Article introuvable dans ce compte.'), { status: 404 });
        if (item[0].archived_at) throw Object.assign(new Error('Un article archivé ne peut pas être utilisé dans un nouveau lien.'), { status: 400 });
      }
      const result = await tx.run(
        `INSERT INTO payment_links
          (user_id, identifier, description, amount, display_amount, currency, payment_method, phone_number, payment_url, customer_id, catalog_item_id, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, identifier, description, amount, displayAmount, currency, network, phoneNumber || '', paymentUrl, resolvedCustomerId, catalogItemId || null, expiresAt || null]
      );
      await tx.run(`INSERT INTO payment_link_history (user_id, payment_link_id, action, new_value)
        VALUES (?, ?, 'created', ?)`, [userId, result.id, identifier]);
      return result.id;
    });
  }

  static async getPaymentProviderToken(userId) {
    const settings = await getQuery(
      'SELECT value FROM user_settings WHERE user_id = ? AND key = ?',
      [userId, 'paygate_api_token']
    );
    return settings[0]?.value || '';
  }

  static async savePaymentProviderToken(userId, token) {
    await runQuery(
      `INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)
       ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
      [userId, 'paygate_api_token', token]
    );
  }

  static async hasPaymentProviderToken(userId) {
    return Boolean(await this.getPaymentProviderToken(userId));
  }

  static async getCustomers(userId) {
    return await getQuery(`
      SELECT phone_number, MAX(created_at) AS last_seen, COUNT(*) AS payment_count
      FROM payment_links
      WHERE user_id = ? AND phone_number IS NOT NULL AND phone_number != ''
      GROUP BY phone_number
      ORDER BY last_seen DESC
      LIMIT 200
    `, [userId]);
  }

  static async claimLegacyData(userId) {
    await runQuery('UPDATE payments SET user_id = ? WHERE user_id IS NULL', [userId]);
    await runQuery('UPDATE payment_links SET user_id = ? WHERE user_id IS NULL', [userId]);
  }

  static async getLeads(userId) {
    return await getQuery('SELECT * FROM leads WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [userId]);
  }

  static async createLead(userId, { fullName, email, company, project, message }) {
    await runQuery(
      'INSERT INTO leads (user_id, full_name, email, company, project, message) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, fullName, email, company || '', project, message]
    );
  }

  static async createNewsletter(userId, email) {
    await runQuery('INSERT OR IGNORE INTO newsletter (user_id, email) VALUES (?, ?)', [userId, email]);
  }
}

module.exports = PaymentModel;
