const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function ensureFrontendBuild() {
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  const distDashboard = path.join(__dirname, 'dist', 'dashboard.html');
  if (fs.existsSync(distIndex) && fs.existsSync(distDashboard)) {
    return;
  }

  const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(viteBin)) {
    console.warn('[PayFlow] Dossier dist/ absent et binaire Vite introuvable. Lancez "npm run build" lors du déploiement.');
    return;
  }

  console.log('[PayFlow] Dossier dist/ absent : compilation automatique du frontend avec Vite…');
  execFileSync(process.execPath, [viteBin, 'build'], {
    cwd: __dirname,
    stdio: 'inherit',
  });
}

try {
  ensureFrontendBuild();
} catch (buildError) {
  console.error('[PayFlow] Échec de la compilation automatique du frontend:', buildError);
}

const { PORT, HOST } = require('./server/config');
const { initDatabase } = require('./server/db');
const { startDailyBackupScheduler } = require('./server/services/dailyBackup');

initDatabase()
  .then(() => {
    startDailyBackupScheduler();
    const app = require('./server/app');
    app.listen(PORT, HOST, () => {
      console.log(`Serveur lancé sur http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Impossible de préparer la base SQLite:', error);
    process.exitCode = 1;
  });
