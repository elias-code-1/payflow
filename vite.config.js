const { defineConfig, loadEnv } = require("vite");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const PUBLIC_DOWNLOAD_ENV_KEYS = [
  "PAYFLOW_RELEASES_URL",
  "PAYFLOW_EXE_DOWNLOAD_URL",
  "PAYFLOW_EXE_PORTABLE_DOWNLOAD_URL",
  "PAYFLOW_APK_DOWNLOAD_URL",
  "PAYFLOW_IPA_DOWNLOAD_URL",
  "PAYFLOW_LINUX_DOWNLOAD_URL",
  "PAYFLOW_APPIMAGE_DOWNLOAD_URL",
  "PAYFLOW_DEB_DOWNLOAD_URL",
  "PAYFLOW_RPM_DOWNLOAD_URL",
  "PAYFLOW_SNAP_DOWNLOAD_URL",
  "PAYFLOW_FLATPAK_DOWNLOAD_URL",
  "PAYFLOW_PACMAN_DOWNLOAD_URL",
  "PAYFLOW_ALPINE_APK_DOWNLOAD_URL",
  "PAYFLOW_FREEBSD_DOWNLOAD_URL",
  "PAYFLOW_ARCHIVE_DOWNLOAD_URL",
  "PAYFLOW_7Z_DOWNLOAD_URL",
];

function readDotenvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    return dotenv.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

module.exports = defineConfig(({ mode }) => {
  const rootDir = __dirname;
  const exampleEnv = readDotenvFile(path.join(rootDir, ".env.example"));
  const loadedEnv = loadEnv(mode, rootDir, "");
  const defineMap = {};

  for (const key of PUBLIC_DOWNLOAD_ENV_KEYS) {
    const viteKey = key.replace(/^PAYFLOW_/, "VITE_");
    const resolved =
      (process.env[key] || "").trim() ||
      (process.env[viteKey] || "").trim() ||
      (loadedEnv[key] || "").trim() ||
      (loadedEnv[viteKey] || "").trim() ||
      (exampleEnv[key] || "").trim() ||
      "";
    defineMap[`import.meta.env.${key}`] = JSON.stringify(resolved);
    defineMap[`import.meta.env.${viteKey}`] = JSON.stringify(resolved);
  }

  return {
    define: defineMap,
    server: {
      host: "0.0.0.0",
      port: 3000,
      allowedHosts: true,
    },
    build: {
      rollupOptions: {
        input: {
          landing: path.resolve(__dirname, "index.html"),
          dashboard: path.resolve(__dirname, "dashboard.html"),
        },
      },
    },
  };
});
