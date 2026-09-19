const crypto = require('crypto');
const config = require('../config');

// Small encrypted-storage helper for sensitive integration credentials.
// Uses AES-256-GCM with a key derived from SESSION_SECRET so secrets are
// never stored or returned in plaintext. Values are prefixed `enc:v1:`.

const secret = config.session.secret || 'mm-dev-secret-change-me';
const KEY = crypto.createHash('sha256').update(String(secret)).digest();

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['enc:v1', iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

function decrypt(token) {
  try {
    if (typeof token !== 'string' || !token.startsWith('enc:v1:')) return token || '';
    const parts = token.split(':');
    if (parts.length !== 4) return '';
    const iv = Buffer.from(parts[1], 'base64');
    const tag = Buffer.from(parts[2], 'base64');
    const data = Buffer.from(parts[3], 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch (e) {
    return '';
  }
}

module.exports = { encrypt, decrypt };