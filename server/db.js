const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('./config');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erreur SQLite:', err.message);
  } else {
    console.log('Base SQLite connectée:', DB_PATH);
  }
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function initDatabase() {
  return (async () => {
    await runQuery(`CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      full_name TEXT,
      email TEXT,
      company TEXT,
      project TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS newsletter (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      email TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tx_reference TEXT,
      identifier TEXT,
      status INTEGER,
      amount REAL,
      payment_method TEXT,
      phone_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS payment_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      identifier TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      display_amount REAL,
      currency TEXT NOT NULL DEFAULT 'XOF',
      payment_method TEXT NOT NULL,
      phone_number TEXT,
      payment_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      status_updated_at DATETIME,
      expires_at DATETIME,
      archived_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS manual_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      payment_link_id INTEGER,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'XOF',
      method TEXT NOT NULL,
      reference TEXT NOT NULL DEFAULT '',
      paid_at DATETIME NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS customer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phone_number TEXT NOT NULL,
      full_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, phone_number)
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS catalog_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'XOF',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (user_id, key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await runQuery('PRAGMA foreign_keys = ON');
    await ensureColumn('payments', 'user_id', 'INTEGER');
    await ensureColumn('payment_links', 'user_id', 'INTEGER');
    await ensureColumn('payment_links', 'display_amount', 'REAL');
    await ensureColumn('payment_links', 'status_updated_at', 'DATETIME');
    await ensureColumn('payment_links', 'expires_at', 'DATETIME');
    await ensureColumn('payment_links', 'archived_at', 'DATETIME');
    await ensureColumn('leads', 'user_id', 'INTEGER');
    await ensureColumn('newsletter', 'user_id', 'INTEGER');
  })();
}

async function ensureColumn(table, column, type) {
  const columns = await getQuery(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    await runQuery(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

module.exports = { db, runQuery, getQuery, initDatabase };
