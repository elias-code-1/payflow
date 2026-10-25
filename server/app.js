const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Route API introuvable.' });
});

const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));

app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(distDir, 'dashboard.html'));
});

app.get('/dashboard.html', (_req, res) => {
  res.sendFile(path.join(distDir, 'dashboard.html'));
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

module.exports = app;
