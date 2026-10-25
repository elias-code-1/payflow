const { createHmac, timingSafeEqual, randomBytes } = require('crypto');

const COOKIE_NAME = 'payflow_session';
const SESSION_LIFETIME_SECONDS = 60 * 60 * 12;
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(48).toString('hex');

function sign(value) {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function createSession(userId) {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readSession(token) {
  if (!token || typeof token !== 'string') return null;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const providedSignature = Buffer.from(token.slice(separator + 1));
  const expectedSignature = Buffer.from(sign(payload));
  if (providedSignature.length !== expectedSignature.length || !timingSafeEqual(providedSignature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!Number.isSafeInteger(session.sub) || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

function authenticate(req, res, next) {
  let token;
  try {
    const cookies = Object.fromEntries(
      (req.headers.cookie || '')
        .split(';')
        .map((cookie) => cookie.trim())
        .filter(Boolean)
        .map((cookie) => {
          const separator = cookie.indexOf('=');
          return separator < 0 ? [cookie, ''] : [cookie.slice(0, separator), decodeURIComponent(cookie.slice(separator + 1))];
        })
    );
    token = cookies[COOKIE_NAME];
  } catch {
    return res.status(401).json({ message: 'Session locale invalide. Reconnectez-vous.' });
  }
  const session = readSession(token);
  if (!session) return res.status(401).json({ message: 'Connectez-vous pour continuer.' });
  req.auth = { userId: session.sub };
  return next();
}

function setSessionCookie(res, userId) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(createSession(userId))}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${SESSION_LIFETIME_SECONDS}${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0`);
}

module.exports = { authenticate, setSessionCookie, clearSessionCookie };
