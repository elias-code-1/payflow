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
