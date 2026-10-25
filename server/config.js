const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  PORT: process.env.PORT || 3001,
  HOST: process.env.HOST || '127.0.0.1',
  DB_PATH: process.env.PAYFLOW_DB_PATH || path.join(__dirname, '..', 'database.sqlite'),
  PAYGATE_API_TOKEN: process.env.PAYGATE_API_TOKEN || '',
};
