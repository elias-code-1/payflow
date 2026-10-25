const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT_DIR = path.join(__dirname, '..');
const ENV_FILE_PATH = path.join(ROOT_DIR, '.env');
const ENV_EXAMPLE_PATH = path.join(ROOT_DIR, '.env.example');

dotenv.config({ path: ENV_FILE_PATH });

const DB_PATH = process.env.PAYFLOW_DB_PATH || path.join(ROOT_DIR, 'database.sqlite');

function readParsedEnv(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    return dotenv.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

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

function resolveEnvUrl(keys, fileEnv, exampleEnv) {
  for (const key of keys) {
    const fromProcess = safeDownloadUrl(process.env[key]);
    if (fromProcess) return fromProcess;
  }
  for (const key of keys) {
    const fromDotEnv = safeDownloadUrl(fileEnv[key]);
    if (fromDotEnv) return fromDotEnv;
  }
  for (const key of keys) {
    const fromExample = safeDownloadUrl(exampleEnv[key]);
    if (fromExample) return fromExample;
  }
  return '';
}

function getDownloadLinks() {
  const fileEnv = readParsedEnv(ENV_FILE_PATH);
  const exampleEnv = readParsedEnv(ENV_EXAMPLE_PATH);

  const linuxUrl = resolveEnvUrl(['PAYFLOW_LINUX_DOWNLOAD_URL', 'VITE_LINUX_DOWNLOAD_URL'], fileEnv, exampleEnv);
  const appImageUrl =
    resolveEnvUrl(['PAYFLOW_APPIMAGE_DOWNLOAD_URL', 'VITE_APPIMAGE_DOWNLOAD_URL'], fileEnv, exampleEnv) || linuxUrl;
  const archiveUrl = resolveEnvUrl(['PAYFLOW_ARCHIVE_DOWNLOAD_URL', 'VITE_ARCHIVE_DOWNLOAD_URL'], fileEnv, exampleEnv);

  return {
    releasesUrl: resolveEnvUrl(['PAYFLOW_RELEASES_URL', 'VITE_RELEASES_URL'], fileEnv, exampleEnv),
    exeUrl: resolveEnvUrl(['PAYFLOW_EXE_DOWNLOAD_URL', 'VITE_EXE_DOWNLOAD_URL'], fileEnv, exampleEnv),
    exePortableUrl: resolveEnvUrl(
      ['PAYFLOW_EXE_PORTABLE_DOWNLOAD_URL', 'VITE_EXE_PORTABLE_DOWNLOAD_URL'],
      fileEnv,
      exampleEnv,
    ),
    apkUrl: resolveEnvUrl(['PAYFLOW_APK_DOWNLOAD_URL', 'VITE_APK_DOWNLOAD_URL'], fileEnv, exampleEnv),
    ipaUrl: resolveEnvUrl(['PAYFLOW_IPA_DOWNLOAD_URL', 'VITE_IPA_DOWNLOAD_URL'], fileEnv, exampleEnv),
    linuxUrl: linuxUrl || appImageUrl,
    appImageUrl,
    debUrl: resolveEnvUrl(['PAYFLOW_DEB_DOWNLOAD_URL', 'VITE_DEB_DOWNLOAD_URL'], fileEnv, exampleEnv),
    rpmUrl: resolveEnvUrl(['PAYFLOW_RPM_DOWNLOAD_URL', 'VITE_RPM_DOWNLOAD_URL'], fileEnv, exampleEnv),
    snapUrl: resolveEnvUrl(['PAYFLOW_SNAP_DOWNLOAD_URL', 'VITE_SNAP_DOWNLOAD_URL'], fileEnv, exampleEnv),
    flatpakUrl: resolveEnvUrl(['PAYFLOW_FLATPAK_DOWNLOAD_URL', 'VITE_FLATPAK_DOWNLOAD_URL'], fileEnv, exampleEnv),
    pacmanUrl: resolveEnvUrl(['PAYFLOW_PACMAN_DOWNLOAD_URL', 'VITE_PACMAN_DOWNLOAD_URL'], fileEnv, exampleEnv),
    alpineApkUrl: resolveEnvUrl(
      ['PAYFLOW_ALPINE_APK_DOWNLOAD_URL', 'VITE_ALPINE_APK_DOWNLOAD_URL'],
      fileEnv,
      exampleEnv,
    ),
    freebsdUrl: resolveEnvUrl(['PAYFLOW_FREEBSD_DOWNLOAD_URL', 'VITE_FREEBSD_DOWNLOAD_URL'], fileEnv, exampleEnv),
    archiveUrl,
    sevenZUrl:
      resolveEnvUrl(['PAYFLOW_7Z_DOWNLOAD_URL', 'VITE_7Z_DOWNLOAD_URL'], fileEnv, exampleEnv) || archiveUrl,
  };
}

const initialLinks = getDownloadLinks();

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  DB_PATH,
  BACKUP_DIR: process.env.PAYFLOW_BACKUP_DIR || path.join(path.dirname(DB_PATH), 'backups'),
  PAYGATE_API_TOKEN: process.env.PAYGATE_API_TOKEN || '',
  getDownloadLinks,
  RELEASES_URL: initialLinks.releasesUrl,
  EXE_DOWNLOAD_URL: initialLinks.exeUrl,
  EXE_PORTABLE_DOWNLOAD_URL: initialLinks.exePortableUrl,
  APK_DOWNLOAD_URL: initialLinks.apkUrl,
  IPA_DOWNLOAD_URL: initialLinks.ipaUrl,
  LINUX_DOWNLOAD_URL: initialLinks.linuxUrl,
  APPIMAGE_DOWNLOAD_URL: initialLinks.appImageUrl,
  DEB_DOWNLOAD_URL: initialLinks.debUrl,
  RPM_DOWNLOAD_URL: initialLinks.rpmUrl,
  SNAP_DOWNLOAD_URL: initialLinks.snapUrl,
  FLATPAK_DOWNLOAD_URL: initialLinks.flatpakUrl,
  PACMAN_DOWNLOAD_URL: initialLinks.pacmanUrl,
  ALPINE_APK_DOWNLOAD_URL: initialLinks.alpineApkUrl,
  FREEBSD_DOWNLOAD_URL: initialLinks.freebsdUrl,
  ARCHIVE_DOWNLOAD_URL: initialLinks.archiveUrl,
  SEVENZ_DOWNLOAD_URL: initialLinks.sevenZUrl,
};
