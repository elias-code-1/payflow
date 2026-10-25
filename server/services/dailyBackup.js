'use strict';

const fs = require('fs/promises');
const path = require('path');
const { getQuery } = require('../db');
const { BACKUP_DIR } = require('../config');
const { DataToolsModel } = require('../models/DataToolsModel');

const RETENTION_DAYS = 30;
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
let scheduler;
let running = false;
const activeAccounts = new Set();

function dailyFilename(date = new Date()) {
  return `payflow-daily-${date.toISOString().slice(0, 10)}.json`;
}

function accountBackupDirectory(userId) {
  const id = Number(userId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Identifiant de compte invalide.');
  return path.join(BACKUP_DIR, `account-${id}`);
}

async function setPrivateMode(target, mode) {
  try { await fs.chmod(target, mode); }
  catch { /* Les permissions POSIX ne s’appliquent pas de la même façon sous Windows. */ }
}

async function writeAccountBackupFile(userId, filename, document) {
  if (!/^payflow-(daily-\d{4}-\d{2}-\d{2}|manual-\d+-\d+)\.json$/.test(filename)) {
    throw new Error('Nom de fichier de sauvegarde invalide.');
  }
  const directory = accountBackupDirectory(userId);
  await fs.mkdir(BACKUP_DIR, { recursive: true, mode: 0o700 });
  await setPrivateMode(BACKUP_DIR, 0o700);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  await setPrivateMode(directory, 0o700);

  const destination = path.join(directory, filename);
  const temporary = path.join(directory, `.${filename}.${process.pid}.${Date.now()}.tmp`);
  try {
    await fs.writeFile(temporary, JSON.stringify(document), { encoding: 'utf8', mode: 0o600 });
    await setPrivateMode(temporary, 0o600);
    await fs.rm(destination, { force: true });
    await fs.rename(temporary, destination);
  } catch (error) {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
  return filename;
}

async function saveManualBackupFile(userId, backup) {
  const filename = `payflow-manual-${Number(backup.id)}-${Date.now()}.json`;
  await writeAccountBackupFile(userId, filename, backup.document);
  return filename;
}

async function hasValidDailyFile(filePath) {
  try {
    const document = JSON.parse(await fs.readFile(filePath, 'utf8'));
    DataToolsModel.verifyBackup(document);
    return true;
  } catch { return false; }
}

async function pruneAccountFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /^payflow-daily-\d{4}-\d{2}-\d{2}\.json$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  await Promise.all(files.slice(RETENTION_DAYS).map((name) => fs.rm(path.join(directory, name), { force: true })));
}

async function createAccountBackup(userId) {
  const accountId = Number(userId);
  if (activeAccounts.has(accountId)) return false;
  activeAccounts.add(accountId);
  try {
    const directory = accountBackupDirectory(accountId);
    const filename = dailyFilename();
    const destination = path.join(directory, filename);
    if (await hasValidDailyFile(destination)) {
      await DataToolsModel.pruneAutomaticBackups(accountId, RETENTION_DAYS);
      await pruneAccountFiles(directory);
      return false;
    }

    const { document } = await DataToolsModel.createBackup(accountId, 'automatic-daily');
    await writeAccountBackupFile(accountId, filename, document);
    await DataToolsModel.pruneAutomaticBackups(accountId, RETENTION_DAYS);
    await pruneAccountFiles(directory);
    return true;
  } finally {
    activeAccounts.delete(accountId);
  }
}

async function createDailyBackupForAccount(userId) {
  try { return await createAccountBackup(userId); }
  catch (error) {
    console.error(`[daily-backup] Account ${Number(userId)} backup failed:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function runDailyBackups() {
  if (running || process.env.PAYFLOW_AUTO_BACKUPS === 'false') return;
  running = true;
  try {
    const users = await getQuery('SELECT id FROM users ORDER BY id');
    for (const user of users) await createDailyBackupForAccount(user.id);
  } catch (error) {
    console.error('[daily-backup] Could not list accounts for backup:', error instanceof Error ? error.message : error);
  } finally {
    running = false;
  }
}

function startDailyBackupScheduler() {
  if (scheduler || process.env.PAYFLOW_AUTO_BACKUPS === 'false') return scheduler;
  void runDailyBackups();
  scheduler = setInterval(() => { void runDailyBackups(); }, CHECK_INTERVAL_MS);
  scheduler.unref?.();
  return scheduler;
}

async function getLatestDailyBackup(userId) {
  const directory = accountBackupDirectory(userId);
  let entries;
  try { entries = await fs.readdir(directory, { withFileTypes: true }); }
  catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw error;
  }

  const files = entries
    .filter((entry) => entry.isFile() && /^payflow-daily-\d{4}-\d{2}-\d{2}\.json$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  for (const filename of files) {
    try {
      const document = JSON.parse(await fs.readFile(path.join(directory, filename), 'utf8'));
      DataToolsModel.verifyBackup(document);
      return document;
    } catch (error) {
      console.error(`[daily-backup] Skipping an invalid automatic backup for account ${Number(userId)}:`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

module.exports = { startDailyBackupScheduler, runDailyBackups, createDailyBackupForAccount, saveManualBackupFile, getLatestDailyBackup, RETENTION_DAYS };
