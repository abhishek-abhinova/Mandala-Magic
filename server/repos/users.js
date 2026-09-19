const bcrypt = require('bcryptjs');
const { query, queryOne, run } = require('../db');

module.exports = {
  findById(id) { return queryOne('SELECT * FROM users WHERE id = ?', [id]); },
  findByEmail(email) { return queryOne('SELECT * FROM users WHERE email = ?', [email]); },
  findAll({ search, role, page = 1, limit = 50 } = {}) {
    let where = []; let params = [];
    if (search) { where.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (role) { where.push('role = ?'); params.push(role); }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const total = queryOne(`SELECT COUNT(*) as n FROM users ${w}`, params).n;
    const items = query(`SELECT id,name,email,role,created_at FROM users ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
    return { items, total, page, limit };
  },
  create({ name, email, password, role = 'customer' }) {
    const hash = bcrypt.hashSync(password, 10);
    return run('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)', [name, email, hash, role]);
  },
  update(id, data) {
    const sets = []; const params = [];
    for (const [k, v] of Object.entries(data)) {
      if (k === 'password') { sets.push('password_hash = ?'); params.push(bcrypt.hashSync(v, 10)); }
      else if (['name','email','role','avatar_url'].includes(k)) { sets.push(k + ' = ?'); params.push(v); }
    }
    if (!sets.length) return null;
    sets.push("updated_at = datetime('now')");
    params.push(id);
    return run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
  },
  verifyPassword(user, password) { return bcrypt.compareSync(password, user.password_hash); },
  count() { return queryOne('SELECT COUNT(*) as n FROM users').n; },
  remove(id) { return run('DELETE FROM users WHERE id = ?', [id]); },
};
