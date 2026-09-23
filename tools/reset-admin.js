/* ============================================================
   Reset / create the admin studio account.
   Usage:
     node tools/reset-admin.js
     ADMIN_EMAIL=x@y ADMIN_PASSWORD=secret node tools/reset-admin.js
   Updates the existing admin (or creates one) and prints the
   working credentials so the studio owner always has a way in.
   ============================================================ */
const bcrypt = require('bcryptjs');
const { getDb } = require('../server/db');

const email = (process.env.ADMIN_EMAIL || 'support@mandalamagic.shop').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'admin123';
const name = process.env.ADMIN_NAME || 'Orchid Mandala';

const db = getDb();
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existing) {
  db.prepare("UPDATE users SET password_hash = ?, role = 'admin', name = ?, updated_at = datetime('now') WHERE id = ?")
    .run(bcrypt.hashSync(password, 10), name, existing.id);
  console.log('Admin password reset for ' + email);
} else {
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .run(name, email, bcrypt.hashSync(password, 10));
  console.log('Admin account created: ' + email);
}

console.log('Admin login → ' + email + ' / ' + password);
console.log('Open http://localhost:4173/admin and sign in. Change the password in Settings after first login.');