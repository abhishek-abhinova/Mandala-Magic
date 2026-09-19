const { query, queryOne, run } = require('../db');

module.exports = {
  getCart(sessionId, userId) {
    if (userId) return query('SELECT ci.*, p.title, p.slug, p.price, p.sale_price, p.image_url FROM cart_items ci LEFT JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ? ORDER BY ci.created_at', [userId]);
    return query('SELECT ci.*, p.title, p.slug, p.price, p.sale_price, p.image_url FROM cart_items ci LEFT JOIN products p ON ci.product_id = p.id WHERE ci.session_id = ? AND ci.user_id IS NULL ORDER BY ci.created_at', [sessionId]);
  },
  addItem(sessionId, userId, productId, variantId, quantity = 1) {
    const where = userId ? 'user_id = ?' : 'session_id = ? AND user_id IS NULL';
    const params = userId ? [userId] : [sessionId];
    const existing = queryOne(`SELECT * FROM cart_items WHERE ${where} AND product_id = ? AND COALESCE(variant_id,0) = COALESCE(?,0)`, [...params, productId, variantId||null]);
    if (existing) {
      run('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing.id]);
    } else {
      run('INSERT INTO cart_items (session_id,user_id,product_id,variant_id,quantity) VALUES (?,?,?,?,?)', [sessionId, userId||null, productId, variantId||null, quantity]);
    }
  },
  updateQty(id, quantity) {
    if (quantity <= 0) return run('DELETE FROM cart_items WHERE id = ?', [id]);
    return run('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);
  },
  removeItem(id) { return run('DELETE FROM cart_items WHERE id = ?', [id]); },
  clear(sessionId, userId) {
    if (userId) return run('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    return run('DELETE FROM cart_items WHERE session_id = ? AND user_id IS NULL', [sessionId]);
  },
  count(sessionId, userId) {
    if (userId) return queryOne('SELECT COALESCE(SUM(quantity),0) as n FROM cart_items WHERE user_id = ?', [userId]).n;
    return queryOne('SELECT COALESCE(SUM(quantity),0) as n FROM cart_items WHERE session_id = ? AND user_id IS NULL', [sessionId]).n;
  },
};
