const { getQuery, runQuery } = require('../db');

class UserModel {
  static async count() {
    const result = await getQuery('SELECT COUNT(*) AS total FROM users');
    return Number(result[0]?.total || 0);
  }

  static async findByEmail(email) {
    const users = await getQuery(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = ? COLLATE NOCASE',
      [email]
    );
    return users[0] || null;
  }

  static async findById(id) {
    const users = await getQuery(
      'SELECT id, email, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }

  static async create({ email, passwordHash }) {
    return await runQuery(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );
  }
}

module.exports = UserModel;
