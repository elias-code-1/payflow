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
  RELEASES_URL: safeDownloadUrl(process.env.PAYFLOW_RELEASES_URL || process.env.VITE_RELEASES_URL),
  EXE_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_EXE_DOWNLOAD_URL || process.env.VITE_EXE_DOWNLOAD_URL),
  EXE_PORTABLE_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_EXE_PORTABLE_DOWNLOAD_URL || process.env.VITE_EXE_PORTABLE_DOWNLOAD_URL),
  APK_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_APK_DOWNLOAD_URL || process.env.VITE_APK_DOWNLOAD_URL),
  IPA_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_IPA_DOWNLOAD_URL || process.env.VITE_IPA_DOWNLOAD_URL),
  LINUX_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_LINUX_DOWNLOAD_URL || process.env.VITE_LINUX_DOWNLOAD_URL),
  APPIMAGE_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_APPIMAGE_DOWNLOAD_URL || process.env.VITE_APPIMAGE_DOWNLOAD_URL || process.env.PAYFLOW_LINUX_DOWNLOAD_URL || process.env.VITE_LINUX_DOWNLOAD_URL),
  DEB_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_DEB_DOWNLOAD_URL || process.env.VITE_DEB_DOWNLOAD_URL),
  RPM_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_RPM_DOWNLOAD_URL || process.env.VITE_RPM_DOWNLOAD_URL),
  SNAP_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_SNAP_DOWNLOAD_URL || process.env.VITE_SNAP_DOWNLOAD_URL),
  FLATPAK_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_FLATPAK_DOWNLOAD_URL || process.env.VITE_FLATPAK_DOWNLOAD_URL),
  PACMAN_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_PACMAN_DOWNLOAD_URL || process.env.VITE_PACMAN_DOWNLOAD_URL),
  ALPINE_APK_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_ALPINE_APK_DOWNLOAD_URL || process.env.VITE_ALPINE_APK_DOWNLOAD_URL),
  FREEBSD_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_FREEBSD_DOWNLOAD_URL || process.env.VITE_FREEBSD_DOWNLOAD_URL),
  ARCHIVE_DOWNLOAD_URL: safeDownloadUrl(process.env.PAYFLOW_ARCHIVE_DOWNLOAD_URL || process.env.VITE_ARCHIVE_DOWNLOAD_URL),
};
