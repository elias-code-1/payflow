const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const UserModel = require('../models/UserModel');
const PaymentModel = require('../models/PaymentModel');
const { setSessionCookie, clearSessionCookie } = require('../middleware/authenticate');
const { createDailyBackupForAccount } = require('../services/dailyBackup');

const scrypt = promisify(scryptCallback);
const PASSWORD_COST = 64;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, PASSWORD_COST);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, passwordHash) {
  const [saltHex, keyHex] = passwordHash.split(':');
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function safeUser(user) {
  return { id: user.id, email: user.email, created_at: user.created_at };
}

async function register(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Saisissez une adresse e-mail valide.' });
  }
  if (password.length < 10 || password.length > 200) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir entre 10 et 200 caractères.' });
  }

  try {
    const firstAccount = (await UserModel.count()) === 0;
    if (await UserModel.findByEmail(email)) {
      return res.status(409).json({ message: 'Un compte utilise déjà cette adresse e-mail.' });
    }
    const result = await UserModel.create({ email, passwordHash: await hashPassword(password) });
    if (firstAccount) {
      await PaymentModel.claimLegacyData(result.id);
      const legacyToken = process.env.PAYGATE_API_TOKEN;
      if (legacyToken) await PaymentModel.savePaymentProviderToken(result.id, legacyToken);
    }
    const user = await UserModel.findById(result.id);
    setSessionCookie(res, user.id);
    void createDailyBackupForAccount(user.id);
    return res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    console.error('Account registration error:', error);
    return res.status(500).json({ message: 'Impossible de créer le compte local.' });
  }
}

async function login(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  try {
    const user = await UserModel.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect.' });
    }
    setSessionCookie(res, user.id);
    return res.json({ user: safeUser(user) });
  } catch (error) {
    console.error('Account login error:', error);
    return res.status(500).json({ message: 'Impossible de se connecter au compte local.' });
  }
}

async function session(req, res) {
  try {
    const user = await UserModel.findById(req.auth.userId);
    if (!user) {
      clearSessionCookie(res);
      return res.status(401).json({ message: 'Cette session n’est plus valide.' });
    }
    return res.json({ user: safeUser(user) });
  } catch (error) {
    console.error('Session lookup error:', error);
    return res.status(500).json({ message: 'Impossible de vérifier la session.' });
  }
}

function logout(req, res) {
  clearSessionCookie(res);
  return res.json({ ok: true });
}

module.exports = { register, login, session, logout };
