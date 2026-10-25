const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.PAYFLOW_DB_PATH || path.join(__dirname, '..', 'database.sqlite');

function safeDownloadUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : '';
  } catch {
    return '';
  }
}

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  DB_PATH,
  BACKUP_DIR: process.env.PAYFLOW_BACKUP_DIR || path.join(path.dirname(DB_PATH), 'backups'),
  PAYGATE_API_TOKEN: process.env.PAYGATE_API_TOKEN || '',
  EXE_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_EXE_DOWNLOAD_URL || process.env.VITE_EXE_DOWNLOAD_URL),
  APK_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_APK_DOWNLOAD_URL || process.env.VITE_APK_DOWNLOAD_URL),
  LINUX_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_LINUX_DOWNLOAD_URL || process.env.VITE_LINUX_DOWNLOAD_URL),
};
