const { query, queryOne, run } = require('../db');
const vault = require('../services/vault');

module.exports = {
  get(key) { const r = queryOne('SELECT value FROM settings WHERE key = ?', [key]); return r ? r.value : null; },
  getAll() { const rows = query('SELECT key,value FROM settings'); const o = {}; for (const r of rows) o[r.key] = r.value; return o; },
  set(key, value) {
    const existing = queryOne('SELECT id FROM settings WHERE key = ?', [key]);
    if (existing) { run("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?", [value, key]); }
    else { run('INSERT INTO settings (key,value) VALUES (?,?)', [key, value]); }
  },
  setMany(obj) { for (const [k, v] of Object.entries(obj)) this.set(k, v); },
  // Encrypted credential handling (never returned to the frontend in plaintext).
  setSecret(key, value) { this.set('enc.' + key, vault.encrypt(String(value))); },
  getSecret(key) { return vault.decrypt(this.get('enc.' + key)); },
  hasSecret(key) { return Boolean(this.get('enc.' + key)); },
};