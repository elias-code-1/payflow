const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.PAYFLOW_DB_PATH || path.join(__dirname, '..', 'database.sqlite');

module.exports = {
  PORT: process.env.PORT || 3001,
  HOST: process.env.HOST || '127.0.0.1',
  DB_PATH,
  BACKUP_DIR: process.env.PAYFLOW_BACKUP_DIR || path.join(path.dirname(DB_PATH), 'backups'),
  PAYGATE_API_TOKEN: process.env.PAYGATE_API_TOKEN || '',
};
