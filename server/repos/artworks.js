const { query, queryOne, run } = require('../db');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

module.exports = {
  findById(id) { return queryOne('SELECT * FROM artworks WHERE id = ?', [id]); },
  findBySlug(slug) { return queryOne('SELECT * FROM artworks WHERE slug = ?', [slug]); },
  findAll({ search, category, status, featured, daily, page = 1, limit = 50 } = {}) {
    let where = []; let params = [];
    if (search) { where.push('(title LIKE ? OR description LIKE ? OR intention LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (category) { where.push('category = ?'); params.push(category); }
    if (status) { where.push('status = ?'); params.push(status); }
    if (featured !== undefined) { where.push('is_featured = ?'); params.push(featured ? 1 : 0); }
    if (daily !== undefined) { where.push('is_daily_mandala = ?'); params.push(daily ? 1 : 0); }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const total = queryOne(`SELECT COUNT(*) as n FROM artworks ${w}`, params).n;
    const items = query(`SELECT * FROM artworks ${w} ORDER BY artwork_date DESC, created_at DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
    return { items, total, page, limit };
  },
  create(d) {
    const slug = d.slug || slugify(d.title);
    const cols = ['title','slug','description','intention','artist_note','image_url','thumbnail_url','production_file','category','artwork_date','is_featured','is_daily_mandala','status','palette'];
    const vals = cols.map(c => d[c] !== undefined ? d[c] : (c === 'palette' ? '[]' : ''));
    return run(`INSERT INTO artworks (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, vals);
  },
  update(id, d) {
    const sets = []; const params = [];
    const allowed = ['title','slug','description','intention','artist_note','image_url','thumbnail_url','production_file','category','artwork_date','is_featured','is_daily_mandala','status','palette'];
    for (const k of allowed) {
      if (d[k] !== undefined) { sets.push(k + ' = ?'); params.push(d[k]); }
    }
    if (d.status === 'published') sets.push("published_at = COALESCE(published_at, datetime('now'))");
    if (!sets.length) return null;
    sets.push("updated_at = datetime('now')");
    params.push(id);
    return run(`UPDATE artworks SET ${sets.join(', ')} WHERE id = ?`, params);
  },
  incrementViews(id) { run('UPDATE artworks SET views = views + 1 WHERE id = ?', [id]); },
  remove(id) { return run('DELETE FROM artworks WHERE id = ?', [id]); },
  count() { return queryOne('SELECT COUNT(*) as n FROM artworks').n; },
  dailyMandala() { return queryOne("SELECT * FROM artworks WHERE is_daily_mandala = 1 AND status = 'published' ORDER BY artwork_date DESC LIMIT 1"); },
  productCount(artworkId) { return queryOne('SELECT COUNT(*) as n FROM product_artwork_links WHERE artwork_id = ?', [artworkId]).n; },
  linkedProducts(artworkId, { status } = {}) {
    return query(`SELECT p.* FROM product_artwork_links l JOIN products p ON p.id = l.product_id
      WHERE l.artwork_id = ?${status ? " AND p.status = '" + status + "'" : ''}`, [artworkId]);
  },
  setDaily(artworkId) {
    const { run } = require('../db');
    run("UPDATE artworks SET is_daily_mandala = 0, updated_at = datetime('now') WHERE is_daily_mandala = 1");
    run("UPDATE artworks SET is_daily_mandala = 1, artwork_date = date('now'), updated_at = datetime('now') WHERE id = ?", [artworkId]);
  },
  webDaily() { return queryOne("SELECT * FROM artworks WHERE is_daily_mandala = 1 ORDER BY artwork_date DESC LIMIT 1"); },
  unpublishedCount() { return queryOne("SELECT COUNT(*) as n FROM artworks WHERE status != 'published'").n; },
};
