const { query, queryOne, run } = require('../db');

module.exports = {
  items(userId) {
    return query('SELECT w.*, p.title, p.slug, p.price, p.sale_price, p.image_url FROM wishlists w LEFT JOIN products p ON w.item_id = p.id WHERE w.user_id = ? AND w.item_type = ? ORDER BY w.created_at DESC', [userId, 'product']);
  },
  add(userId, itemId, itemType = 'product') {
    const exists = queryOne('SELECT id FROM wishlists WHERE user_id = ? AND item_id = ? AND item_type = ?', [userId, itemId, itemType]);
    if (exists) return null;
    return run('INSERT INTO wishlists (user_id,item_id,item_type) VALUES (?,?,?)', [userId, itemId, itemType]);
  },
  remove(userId, itemId, itemType = 'product') {
    return run('DELETE FROM wishlists WHERE user_id = ? AND item_id = ? AND item_type = ?', [userId, itemId, itemType]);
  },
  has(userId, itemId, itemType = 'product') {
    return !!queryOne('SELECT id FROM wishlists WHERE user_id = ? AND item_id = ? AND item_type = ?', [userId, itemId, itemType]);
  },
};
