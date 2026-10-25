const { getQuery, runQuery } = require('../db');

class PaymentModel {
  static async getStats(userId) {
    const [payments, completedPayments, paidLinks, links, customers, paymentRevenue, linkRevenue] = await Promise.all([
      getQuery('SELECT COUNT(*) AS total FROM payments WHERE user_id = ?', [userId]),
      getQuery('SELECT COUNT(*) AS total FROM payments WHERE user_id = ? AND status = 1', [userId]),
      getQuery(`
        SELECT COUNT(*) AS total FROM payment_links AS link
        WHERE link.user_id = ? AND link.status = 'paid'
          AND NOT EXISTS (
            SELECT 1 FROM payments
            WHERE payments.user_id = link.user_id
              AND payments.identifier = link.identifier
              AND payments.status = 1
          )
      `, [userId]),
      getQuery('SELECT COUNT(*) AS total FROM payment_links WHERE user_id = ?', [userId]),
      getQuery(`
        SELECT COUNT(DISTINCT phone_number) AS total FROM (
          SELECT phone_number FROM payments WHERE user_id = ? AND phone_number IS NOT NULL AND phone_number != ''
          UNION
          SELECT phone_number FROM payment_links WHERE user_id = ? AND phone_number IS NOT NULL AND phone_number != ''
        )
      `, [userId, userId]),
      getQuery('SELECT COALESCE(SUM(amount), 0) AS revenue FROM payments WHERE user_id = ? AND status = 1', [userId]),
      getQuery(`
        SELECT COALESCE(SUM(link.amount), 0) AS revenue FROM payment_links AS link
        WHERE link.user_id = ? AND link.status = 'paid'
          AND NOT EXISTS (
            SELECT 1 FROM payments
            WHERE payments.user_id = link.user_id
              AND payments.identifier = link.identifier
              AND payments.status = 1
          )
      `, [userId]),
    ]);

    return {
      payments: payments[0]?.total || 0,
      completed: (completedPayments[0]?.total || 0) + (paidLinks[0]?.total || 0),
      links: links[0]?.total || 0,
      customers: customers[0]?.total || 0,
      revenue: Number(paymentRevenue[0]?.revenue || 0) + Number(linkRevenue[0]?.revenue || 0),
    };
  }

  static async getPayments(userId) {
    return await getQuery(
      'SELECT id, tx_reference, identifier, status, amount, payment_method, phone_number, created_at FROM payments WHERE user_id = ? ORDER BY id DESC LIMIT 500',
      [userId]
    );
  }

  static async getPaymentLinks(userId) {
    return await getQuery(
      'SELECT id, identifier, description, amount, display_amount, currency, payment_method, phone_number, payment_url, status, status_updated_at, created_at FROM payment_links WHERE user_id = ? ORDER BY id DESC LIMIT 500',
      [userId]
    );
  }

  static async updatePaymentLinkStatus(userId, paymentLinkId, status) {
    const normalizedStatus = String(status || 'pending').toLowerCase();
    const allowedStatuses = ['pending', 'paid', 'cancelled'];
    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new Error('Statut de paiement invalide.');
    }

    const result = await runQuery(
      "UPDATE payment_links SET status = ?, status_updated_at = datetime('now') WHERE user_id = ? AND id = ?",
      [normalizedStatus, userId, paymentLinkId]
    );

    return result.changes > 0 ? normalizedStatus : null;
  }

  static async createPaymentLink({ userId, identifier, description, amount, displayAmount, currency, network, phoneNumber, paymentUrl }) {
    await runQuery(
      `INSERT INTO payment_links (user_id, identifier, description, amount, display_amount, currency, payment_method, phone_number, payment_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, identifier, description, amount, displayAmount, currency, network, phoneNumber || '', paymentUrl]
    );
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
      FROM (
        SELECT phone_number, created_at FROM payments WHERE user_id = ? AND phone_number IS NOT NULL AND phone_number != ''
        UNION ALL
        SELECT phone_number, created_at FROM payment_links WHERE user_id = ? AND phone_number IS NOT NULL AND phone_number != ''
      )
      GROUP BY phone_number
      ORDER BY last_seen DESC
      LIMIT 200
    `, [userId, userId]);
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
