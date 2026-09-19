const { run } = require('../db');

// Audit trail for important admin actions.
function log(userId, action, entityType = '', entityId = null, data = {}) {
  try {
    run('INSERT INTO audit_logs (user_id,action,entity_type,entity_id,data) VALUES (?,?,?,?,?)',
      [userId || null, action, entityType, entityId || null, JSON.stringify(data)]);
  } catch (e) { console.error('audit log error', e.message); }
}

function recent(limit = 50) {
  const { query } = require('../db');
  return query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?', [limit]);
}

module.exports = { log, recent };