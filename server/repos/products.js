const { query, queryOne, run, transaction } = require('../db');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

module.exports = {
  findById(id) { return queryOne('SELECT * FROM products WHERE id = ?', [id]); },
  findBySlug(slug) { return queryOne('SELECT * FROM products WHERE slug = ?', [slug]); },
  findByArtwork(artworkId, { page = 1, limit = 50 } = {}) {
    const total = queryOne('SELECT COUNT(*) as n FROM product_artwork_links WHERE artwork_id = ?', [artworkId]).n;
    const items = query(`SELECT p.* FROM product_artwork_links l JOIN products p ON p.id = l.product_id WHERE l.artwork_id = ? ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`,
      [artworkId, limit, (page - 1) * limit]);
    return { items, total, page, limit };
  },
  artworks(productId) {
    return query(`SELECT a.* FROM product_artwork_links l JOIN artworks a ON a.id = l.artwork_id WHERE l.product_id = ?`, [productId]);
  },
  linkArtworks(productId, artworkIds) {
    transaction(() => {
      run('DELETE FROM product_artwork_links WHERE product_id = ?', [productId]);
      for (const aid of [...new Set((artworkIds || []).filter(Boolean).map(Number))]) {
        run('INSERT OR IGNORE INTO product_artwork_links (product_id, artwork_id) VALUES (?,?)', [productId, aid]);
      }
    });
  },
  linkArtwork(productId, artworkId) {
    if (!artworkId) return;
    run('INSERT OR IGNORE INTO product_artwork_links (product_id, artwork_id) VALUES (?,?)', [productId, artworkId]);
  },
  findAll({ search, category, type, status, workflow, artworkId, page = 1, limit = 50 } = {}) {
    let where = []; let params = [];
    if (search) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (category) { where.push('category = ?'); params.push(category); }
    if (type) { where.push('product_type = ?'); params.push(type); }
    if (status) { where.push('status = ?'); params.push(status); }
    if (workflow) { where.push('workflow_status = ?'); params.push(workflow); }
    if (artworkId) {
      where.push('id IN (SELECT product_id FROM product_artwork_links WHERE artwork_id = ?)');
      params.push(artworkId);
    }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const total = queryOne(`SELECT COUNT(*) as n FROM products ${w}`, params).n;
    const items = query(`SELECT p.*,
      (SELECT COUNT(*) FROM product_artwork_links l WHERE l.product_id = p.id) as artwork_count,
      (SELECT a.title FROM product_artwork_links l2 JOIN artworks a ON a.id = l2.artwork_id WHERE l2.product_id = p.id LIMIT 1) as artwork_title
      FROM products p ${w.replace(/^WHERE /, 'WHERE ')} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]);
    return { items, total, page, limit };
  },
  create(d) {
    const slug = d.slug || slugify(d.title) + '-' + Math.random().toString(36).slice(2, 6);
    const iconf = run('INSERT INTO products (title,slug,description,price,sale_price,artwork_id,category,product_type,status,workflow_status,is_featured,yoycol_product_id,yoycol_mapping_id,base_cost,base_currency,image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [d.title, slug, d.description||'', d.price||0, d.sale_price||null, d.artwork_id||null, d.category||'', d.product_type||'', d.status||'draft', d.workflow_status||'draft', d.is_featured?1:0, d.yoycol_product_id||'', d.yoycol_mapping_id||null, d.base_cost||0, d.base_currency||'USD', d.image_url||'']);
    const id = iconf.lastID;
    if (d.artworkId || d.artwork_id) this.linkArtwork(id, d.artworkId || d.artwork_id);
    return { id };
  },
  duplicate(id) {
    const src = queryOne('SELECT * FROM products WHERE id = ?', [id]);
    if (!src) return null;
    let newId = null;
    transaction(() => {
      const info = run('INSERT INTO products (title,slug,description,price,sale_price,artwork_id,category,product_type,status,workflow_status,is_featured,yoycol_product_id,yoycol_mapping_id,base_cost,base_currency,image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [src.title + ' (copy)', slugify(src.title + ' copy') + '-' + Math.random().toString(36).slice(2, 6), src.description||'', src.price||0, src.sale_price||null, src.artwork_id||null, src.category||'', src.product_type||'', 'draft', src.workflow_status||'draft', 0, '', null, src.base_cost||0, src.base_currency||'USD', src.image_url||'']);
      newId = info.lastID;
      for (const v of query('SELECT * FROM product_variants WHERE product_id = ?', [id])) {
        run('INSERT INTO product_variants (product_id,size,color,price,stock,external_variant_id,yoycol_sku_code,yoycol_design_code) VALUES (?,?,?,?,?,?,?,?)',
          [newId, v.size, v.color, v.price, v.stock, '', v.yoycol_sku_code||'', v.yoycol_design_code||'']);
      }
      for (const a of query('SELECT artwork_id FROM product_artwork_links WHERE product_id = ?', [id])) {
        run('INSERT OR IGNORE INTO product_artwork_links (product_id, artwork_id) VALUES (?,?)', [newId, a.artwork_id]);
      }
    });
    return queryOne('SELECT * FROM products WHERE id = ?', [newId]);
  },
  update(id, d) {
    const sets = []; const params = [];
    const allowed = ['title','slug','description','price','sale_price','artwork_id','category','product_type','status','workflow_status','is_featured','yoycol_product_id','yoycol_mapping_id','base_cost','base_currency','image_url'];
    for (const k of allowed) {
      if (d[k] !== undefined) { sets.push(k + ' = ?'); params.push(d[k]); }
    }
    if (!sets.length) return null;
    sets.push("updated_at = datetime('now')");
    const relink = d.artwork_id !== undefined;
    const r = run(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, params);
    if (relink) {
      if (d.artwork_id) this.linkArtwork(id, d.artwork_id);
      else run('DELETE FROM product_artwork_links WHERE product_id = ?', [id]);
    }
    return r;
  },
  remove(id) { return run('DELETE FROM products WHERE id = ?', [id]); },
  count() { return queryOne('SELECT COUNT(*) as n FROM products').n; },
  featured(limit = 8) { return query("SELECT * FROM products WHERE is_featured = 1 AND status = 'published' ORDER BY created_at DESC LIMIT ?", [limit]); },
  published(limit = 100) { return query("SELECT * FROM products WHERE status = 'published' ORDER BY created_at DESC LIMIT ?", [limit]); },
  variants(productId) { return query('SELECT * FROM product_variants WHERE product_id = ?', [productId]); },
  variantsFor(productIds) {
    if (!productIds || !productIds.length) return [];
    const marks = productIds.map(() => '?').join(',');
    return query(`SELECT * FROM product_variants WHERE product_id IN (${marks}) ORDER BY product_id, id`, productIds);
  },
  addVariant(d) { return run('INSERT INTO product_variants (product_id,size,color,price,stock,external_variant_id,yoycol_sku_code,yoycol_design_code) VALUES (?,?,?,?,?,?,?,?)', [d.product_id, d.size||'One Size', d.color||'', d.price||null, d.stock||-1, d.external_variant_id||'', d.yoycol_sku_code||'', d.yoycol_design_code||'']); },
  removeVariants(productId) { return run('DELETE FROM product_variants WHERE product_id = ?', [productId]); },
  setVariants(productId, variants) {
    transaction(() => {
      run('DELETE FROM product_variants WHERE product_id = ?', [productId]);
      for (const v of (variants || [])) {
        this.addVariant({ ...v, product_id: productId });
      }
    });
  },
};