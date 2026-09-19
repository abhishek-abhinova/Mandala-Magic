const { query, queryOne, run } = require('../db');

function genOrderNumber() {
  const d = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MM-${d.slice(-5)}-${r}`;
}

module.exports = {
  findById(id) { return queryOne('SELECT * FROM orders WHERE id = ?', [id]); },
  findByNumber(n) { return queryOne('SELECT * FROM orders WHERE order_number = ?', [n]); },
  findByYoycolId(yid) { return queryOne('SELECT * FROM orders WHERE yoycol_order_id = ?', [yid]); },
  findByUser(userId, { page = 1, limit = 20 } = {}) {
    const total = queryOne('SELECT COUNT(*) as n FROM orders WHERE user_id = ?', [userId]).n;
    const items = query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [userId, limit, (page - 1) * limit]);
    return { items, total, page, limit };
  },
  findAll({ status, search, page = 1, limit = 50 } = {}) {
    let where = []; let params = [];
    if (status) {
      if (status === 'attention') { where.push("fulfillment_status = 'manual_required'"); }
      else { where.push('status = ?'); params.push(status); }
    }
    if (search) { where.push('(order_number LIKE ? OR shipping_name LIKE ? OR shipping_email LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const total = queryOne(`SELECT COUNT(*) as n FROM orders ${w}`, params).n;
    const items = query(`SELECT * FROM orders ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
    return { items, total, page, limit };
  },
  items(orderId) { return query('SELECT * FROM order_items WHERE order_id = ?', [orderId]); },
  create(d) {
    const order_number = genOrderNumber();
    const info = run('INSERT INTO orders (user_id,order_number,status,payment_status,subtotal,shipping,tax,total,shipping_name,shipping_email,shipping_address,shipping_city,shipping_state,shipping_zip,shipping_country,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [d.user_id||null, order_number, 'placed', 'pending', d.subtotal||0, d.shipping||0, d.tax||0, d.total||0, d.shipping_name||'', d.shipping_email||'', d.shipping_address||'', d.shipping_city||'', d.shipping_state||'', d.shipping_zip||'', d.shipping_country||'', d.notes||'']);
    return { id: info.lastID, order_number };
  },
  addItem(d) { return run('INSERT INTO order_items (order_id,product_id,variant_id,title,size,quantity,price) VALUES (?,?,?,?,?,?,?)', [d.order_id, d.product_id||null, d.variant_id||null, d.title, d.size||'', d.quantity||1, d.price||0]); },
  updateStatus(id, status) { return run("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id]); },
  updatePayment(id, paymentStatus, transactionId) {
    run("UPDATE orders SET payment_status = ?, updated_at = datetime('now') WHERE id = ?", [paymentStatus, id]);
    if (transactionId) run('INSERT INTO payments (order_id,amount,status,transaction_id) VALUES (?,?,?,?)', [id, 0, paymentStatus, transactionId]);
  },
  updateFulfillment(id, { status, trackingNumber, carrier }) {
    const sets = ["updated_at = datetime('now')"]; const params = [];
    if (status !== undefined) { sets.push('fulfillment_status = ?'); params.push(status); }
    if (trackingNumber !== undefined) { sets.push('tracking_number = ?'); params.push(trackingNumber); }
    if (carrier !== undefined) { sets.push('carrier = ?'); params.push(carrier); }
    if (sets.length > 1) { params.push(id); return run(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, params); }
  },
  count() { return queryOne('SELECT COUNT(*) as n FROM orders').n; },
  revenue() { return queryOne("SELECT COALESCE(SUM(total),0) as n FROM orders WHERE payment_status = 'paid'").n; },
  recent(limit = 10) { return query('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?', [limit]); },
  stats() {
    return {
      total: queryOne('SELECT COUNT(*) as n FROM orders').n,
      paid: queryOne("SELECT COUNT(*) as n FROM orders WHERE payment_status = 'paid'").n,
      pending: queryOne("SELECT COUNT(*) as n FROM orders WHERE status IN ('placed','paid') AND payment_status != 'paid'").n,
      processing: queryOne("SELECT COUNT(*) as n FROM orders WHERE status IN ('processing','paid','submitted_yoycol','in_production')").n,
      shipped: queryOne("SELECT COUNT(*) as n FROM orders WHERE status IN ('shipped','delivered')").n,
      attention: queryOne("SELECT COUNT(*) as n FROM orders WHERE status = 'requires_attention' OR fulfillment_status = 'manual_required'").n,
      revenue: queryOne("SELECT COALESCE(SUM(total),0) as n FROM orders WHERE payment_status = 'paid'").n,
      avgOrderValue: queryOne("SELECT COALESCE(AVG(total),0) as n FROM orders WHERE payment_status = 'paid'").n,
    };
  },
};
