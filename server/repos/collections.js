const { query, queryOne, run } = require('../db');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

module.exports = {
  findById(id) { return queryOne('SELECT * FROM collections WHERE id = ?', [id]); },
  findBySlug(slug) { return queryOne('SELECT * FROM collections WHERE slug = ?', [slug]); },
  findAll() { return query('SELECT * FROM collections ORDER BY name'); },
  items(collectionId) {
    const prods = query(`SELECT p.* FROM products p JOIN collection_items ci ON ci.item_id = p.id WHERE ci.collection_id = ? AND ci.item_type = 'product'`, [collectionId]);
    const arts = query(`SELECT a.* FROM artworks a JOIN collection_items ci ON ci.item_id = a.id WHERE ci.collection_id = ? AND ci.item_type = 'artwork'`, [collectionId]);
    return { products: prods, artworks: arts };
  },
  create(d) {
    const slug = d.slug || slugify(d.name);
    return run('INSERT INTO collections (name,slug,description,cover_image_url,seo_title,seo_description) VALUES (?,?,?,?,?,?)',
      [d.name, slug, d.description||'', d.cover_image_url||'', d.seo_title||d.name, d.seo_description||d.description||'']);
  },
  update(id, d) {
    const sets = []; const params = [];
    for (const k of ['name','slug','description','cover_image_url','seo_title','seo_description']) {
      if (d[k] !== undefined) { sets.push(k + ' = ?'); params.push(d[k]); }
    }
    if (!sets.length) return null;
    params.push(id);
    return run(`UPDATE collections SET ${sets.join(', ')} WHERE id = ?`, params);
  },
  addItem(collectionId, itemId, itemType) { return run('INSERT INTO collection_items (collection_id,item_id,item_type) VALUES (?,?,?)', [collectionId, itemId, itemType]); },
  removeItem(collectionId, itemId, itemType) { return run('DELETE FROM collection_items WHERE collection_id = ? AND item_id = ? AND item_type = ?', [collectionId, itemId, itemType]); },
  clearItems(collectionId) { return run('DELETE FROM collection_items WHERE collection_id = ?', [collectionId]); },
  remove(id) { return run('DELETE FROM collections WHERE id = ?', [id]); },
  count() { return queryOne('SELECT COUNT(*) as n FROM collections').n; },
};
