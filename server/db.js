let db;
let useNativeSqlite3 = false;
const { DB_PATH } = require('./config');

try {
  const { DatabaseSync } = require('node:sqlite');
  try {
    db = new DatabaseSync(DB_PATH);
    console.log('Base SQLite connectée:', DB_PATH);
  } catch (err) {
    console.warn('[PayFlow] Base SQLite fichier indisponible, utilisation en mémoire:', err.message);
    db = new DatabaseSync(':memory:');
  }
} catch {
  useNativeSqlite3 = true;
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('Erreur SQLite:', err.message);
    else console.log('Base SQLite connectée:', DB_PATH);
  });
}

let queryQueue = Promise.resolve();

function normalizeParams(params = []) {
  return (Array.isArray(params) ? params : [params]).map((value) => {
    if (value === undefined) return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
  });
}

function normalizeError(err) {
  if (err && typeof err === 'object' && String(err.message || '').includes('constraint failed')) {
    err.code = 'SQLITE_CONSTRAINT';
  }
  return err;
}

function runRaw(sql, params = []) {
  if (useNativeSqlite3) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(normalizeError(err));
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
  return new Promise((resolve, reject) => {
    try {
      const bound = normalizeParams(params);
      const result = db.prepare(sql).run(...bound);
      resolve({ id: Number(result.lastInsertRowid || 0), changes: Number(result.changes || 0) });
    } catch (err) {
      reject(normalizeError(err));
    }
  });
}

function getRaw(sql, params = []) {
  if (useNativeSqlite3) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(normalizeError(err));
        else resolve(rows);
      });
    });
  }
  return new Promise((resolve, reject) => {
    try {
      const bound = normalizeParams(params);
      const rows = db.prepare(sql).all(...bound);
      resolve(rows.map((row) => ({ ...row })));
    } catch (err) {
      reject(normalizeError(err));
    }
  });
}

function enqueueQuery(operation) {
  const result = queryQueue.then(operation, operation);
  queryQueue = result.then(() => undefined, () => undefined);
  return result;
}

function runQuery(sql, params = []) {
  return enqueueQuery(() => runRaw(sql, params));
}

function getQuery(sql, params = []) {
  return enqueueQuery(() => getRaw(sql, params));
}

async function runTransaction(work) {
  const previous = queryQueue;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  queryQueue = previous.then(() => gate, () => gate);
  await previous;

  try {
    await runRaw('BEGIN IMMEDIATE');
    const result = await work({ run: runRaw, get: getRaw });
    await runRaw('COMMIT');
    return result;
  } catch (error) {
    await runRaw('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    release();
  }
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
      customer_id INTEGER,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'XOF',
      method TEXT NOT NULL,
      reference TEXT NOT NULL DEFAULT '',
      paid_at DATETIME NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS customer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phone_number TEXT NOT NULL DEFAULT '',
      full_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      archived_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery(`CREATE TABLE IF NOT EXISTS catalog_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sku TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'XOF',
      category TEXT NOT NULL DEFAULT '',
      archived_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    await runQuery(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await applyFeatureMigration();
  })();
}

async function applyFeatureMigration() {
  const migrations = await getQuery('SELECT version FROM schema_migrations WHERE version = 1');
  if (migrations.length) return;

  await runQuery('BEGIN IMMEDIATE');
  try {
    await ensureColumn('payment_links', 'customer_id', 'INTEGER');
    await ensureColumn('payment_links', 'catalog_item_id', 'INTEGER');
    await ensureColumn('payment_links', 'expires_at', 'DATETIME');
    await ensureColumn('payment_links', 'archived_at', 'DATETIME');
    await ensureColumn('manual_payments', 'customer_id', 'INTEGER');
    await ensureColumn('manual_payments', 'status', "TEXT NOT NULL DEFAULT 'confirmed'");
    await ensureColumn('manual_payments', 'updated_at', 'DATETIME');
    await ensureColumn('catalog_items', 'sku', "TEXT NOT NULL DEFAULT ''");
    await ensureColumn('catalog_items', 'category', "TEXT NOT NULL DEFAULT ''");
    await ensureColumn('catalog_items', 'archived_at', 'DATETIME');
    await ensureColumn('catalog_items', 'updated_at', 'DATETIME');

    await runQuery(`CREATE TABLE customer_profiles_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phone_number TEXT NOT NULL DEFAULT '',
      full_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      archived_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await runQuery(`INSERT INTO customer_profiles_new
      (id, user_id, phone_number, full_name, email, company, address, tags, notes, archived_at, created_at, updated_at)
      SELECT id, user_id, COALESCE(phone_number, ''), COALESCE(full_name, ''), COALESCE(email, ''),
        '', '', COALESCE(tags, ''), COALESCE(notes, ''), NULL, created_at, updated_at
      FROM customer_profiles`);
    await runQuery('DROP TABLE customer_profiles');
    await runQuery('ALTER TABLE customer_profiles_new RENAME TO customer_profiles');

    await runQuery(`CREATE TABLE IF NOT EXISTS manual_payment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      manual_payment_id INTEGER NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      old_values TEXT NOT NULL,
      new_values TEXT NOT NULL,
      changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await runQuery(`CREATE TABLE IF NOT EXISTS payment_link_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      payment_link_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT NOT NULL DEFAULT '',
      new_value TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await runQuery(`CREATE TABLE IF NOT EXISTS payment_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      payment_link_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'prepared',
      sent_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await runQuery(`CREATE TABLE IF NOT EXISTS backup_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      schema_version INTEGER NOT NULL,
      size_bytes INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      payload_json TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery('CREATE INDEX IF NOT EXISTS idx_customers_user_email ON customer_profiles(user_id, email)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_manual_payments_user_date ON manual_payments(user_id, paid_at DESC)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_manual_payments_user_link ON manual_payments(user_id, payment_link_id)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_payment_links_user_archive ON payment_links(user_id, archived_at, created_at DESC)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_payment_links_user_customer ON payment_links(user_id, customer_id)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_catalog_user_archive ON catalog_items(user_id, archived_at, name)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_reminders_user_link ON payment_reminders(user_id, payment_link_id, created_at DESC)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_backup_snapshots_user_date ON backup_snapshots(user_id, created_at DESC)');
    await runQuery("INSERT INTO schema_migrations (version, name) VALUES (1, 'approved-business-features')");
    await runQuery('COMMIT');
  } catch (error) {
    await runQuery('ROLLBACK');
    throw error;
  }
}

async function ensureColumn(table, column, type) {
  const columns = await getQuery(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    await runQuery(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

module.exports = { db, runQuery, getQuery, runTransaction, initDatabase };
