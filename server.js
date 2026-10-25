const { PORT, HOST } = require('./server/config');
const { initDatabase } = require('./server/db');

initDatabase()
  .then(() => {
    const app = require('./server/app');
    app.listen(PORT, HOST, () => {
      console.log(`Serveur lancé sur http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Impossible de préparer la base SQLite:', error);
    process.exitCode = 1;
  });
