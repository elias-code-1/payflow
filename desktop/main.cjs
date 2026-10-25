const { app, BrowserWindow, shell } = require('electron');
const fs = require('fs');
const path = require('path');

let apiServer;

function uniqueDownloadPath(fileName) {
  const downloadDirectory = app.getPath('downloads');
  fs.mkdirSync(downloadDirectory, { recursive: true });
  const safeName = path.basename(fileName);
  const parsed = path.parse(safeName);
  let destination = path.join(downloadDirectory, safeName);
  let index = 1;
  while (fs.existsSync(destination)) {
    destination = path.join(downloadDirectory, `${parsed.name} (${index})${parsed.ext}`);
    index += 1;
  }
  return destination;
}

async function startLocalApi() {
  process.env.PAYFLOW_DB_PATH = path.join(app.getPath('userData'), 'payflow.sqlite');
  const { initDatabase } = require('../server/db');
  await initDatabase();
  require('../server/services/dailyBackup').startDailyBackupScheduler();
  const expressApp = require('../server/app');
  apiServer = expressApp.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    apiServer.once('listening', resolve);
    apiServer.once('error', reject);
  });
  return apiServer.address().port;
}

async function createWindow() {
  const port = await startLocalApi();
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    icon: path.join(__dirname, '../build/payflow-icon.png'),
    minWidth: 920,
    minHeight: 650,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.session.on('will-download', (_event, item) => {
    item.setSavePath(uniqueDownloadPath(item.getFilename()));
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  window.once('ready-to-show', () => window.show());
  await window.loadURL(`http://127.0.0.1:${port}/dashboard.html`);
}

app.whenReady().then(createWindow).catch((error) => {
  console.error('Impossible de démarrer PayFlow Desktop:', error);
  app.quit();
});

app.on('window-all-closed', () => {
  apiServer?.close();
  app.quit();
});
