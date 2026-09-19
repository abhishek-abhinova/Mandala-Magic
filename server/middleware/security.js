const crypto = require('crypto');

// Request-scoped helpers. In a sqlite-backed session the session id is a token;
// for state-changing requests we require proof the browser owns the session via
// the returned CSRF token. Login/logout are exempt (they rotate the session).

function issueCsrf(req) {
  const t = crypto.randomBytes(24).toString('hex');
  req.session.csrf = t;
  return t;
}

function csrf(req, res, next) {
  const token = req.headers['x-csrf-token'];
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  if (req.session && req.session.csrf && token === req.session.csrf) return next();
  res.status(403).json({ error: 'CSRF token missing or invalid' });
}

module.exports = { issueCsrf, csrf };