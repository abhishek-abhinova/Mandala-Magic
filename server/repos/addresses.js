const { query, queryOne, run } = require('../db');

module.exports = {
  list(userId) { return query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]); },
  create(d) {
    const info = run('INSERT INTO addresses (user_id,label,name,address_line1,address_line2,city,state,zip,country,is_default) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [d.user_id, d.label||'Home', d.name||'', d.address_line1||'', d.address_line2||'', d.city||'', d.state||'', d.zip||'', d.country||'', d.is_default?1:0]);
    if (d.is_default) this.setDefault(d.user_id, info.lastID);
    return info;
  },
  setDefault(userId, id) {
    run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    run('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, userId]);
  },
  remove(userId, id) { return run('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]); },
};