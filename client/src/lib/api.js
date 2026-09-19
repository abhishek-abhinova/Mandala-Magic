/* Catalog loader — reads the real catalog from /api/public/* (port of assets/js/db.js). */

const CAT_MAP = { Mandala: 'mandala', 'Digital Landscape': 'landscape', Abstract: 'abstract' };
const TYPE_TAGS = {
  'Art Print': ['prints'],
  Canvas: ['canvas'],
  'T-Shirt': ['tshirts', 'apparel'],
  Hoodie: ['hoodies', 'apparel'],
  'Home Decor': ['decor'],
  Accessories: ['accessories', 'gifts']
};
const DEFAULT_PAL = ['#0b0620', '#241245', '#3b1f6e', '#7a3ff2', '#b45bff', '#28c7b0'];

function parsePal(raw) {
  try { const p = JSON.parse(raw || '[]'); return Array.isArray(p) && p.length ? p : DEFAULT_PAL; } catch (e) { return DEFAULT_PAL; }
}

function api(path) {
  return fetch(path).then(r => { if (!r.ok) throw new Error('API ' + r.status); return r.json(); });
}

function mapArtworks(rows) {
  return rows.map(a => {
    const style = CAT_MAP[a.category] || String(a.category || '').toLowerCase() || 'mandala';
    return {
      id: a.slug,
      title: a.title || '',
      date: a.artwork_date || '',
      intention: a.intention || '',
      note: a.artist_note || '',
      cat: style,
      style,
      featured: !!a.is_featured,
      best: !!a.is_featured,
      newest: !!a.is_daily_mandala,
      palette: parsePal(a.palette),
      image: a.image_url || ''
    };
  });
}

function mapProducts(rows, slugById) {
  const out = [];
  for (const p of rows) {
    const artId = slugById[p.artwork_id];
    if (!artId) continue;
    const variants = p.variants || [];
    const sizes = [], colors = [];
    for (const v of variants) {
      const s = String(v.size || '').trim();
      const c = String(v.color || '').trim();
      if (s && sizes.indexOf(s) === -1) sizes.push(s);
      if (c && colors.indexOf(c) === -1) colors.push(c);
    }
    const type = p.product_type || 'Art Print';
    const tags = ['all'];
    if (TYPE_TAGS[type]) tags.push.apply(tags, TYPE_TAGS[type]);
    if (p.is_featured) tags.push('featured');
    const base = Number(p.sale_price != null ? p.sale_price : p.price) || 0;
    out.push({
      id: p.slug,
      artId,
      type,
      price: base,
      sizes: sizes.length ? sizes : ['One Size'],
      colors,
      name: p.title || '',
      desc: p.description || '',
      tags
    });
  }
  return out;
}

function mapCollections(rows, findArt) {
  const out = [];
  for (const c of rows) {
    const cover = findArt(c.artId);
    const members = (c.members || []).filter(id => !!findArt(id));
    out.push({
      id: c.slug,
      name: c.name || '',
      artId: c.artId || (members[0] || ''),
      blurb: c.description || '',
      pal: cover ? [cover.palette[0] || '#3b1f6e', cover.palette[1] || '#120827'] : ['#3b1f6e', '#120827'],
      members
    });
  }
  return out;
}

export async function loadCatalog() {
  const [artRes, prodRes, colls, dailyRes] = await Promise.all([
    api('/api/public/artworks?limit=500'),
    api('/api/public/products?limit=500'),
    api('/api/public/collections'),
    api('/api/public/artworks/daily').catch(() => null)
  ]);

  const rawArts = artRes.items || [];
  const artworks = mapArtworks(rawArts);

  const byDate = artworks.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  byDate.slice(0, 6).forEach((a, i) => { if (i < 6) a.newest = a.newest || i === 0; });

  const slugById = {};
  for (const a of rawArts) slugById[a.id] = a.slug;

  const findArt = id => artworks.find(a => a.id === id);
  const products = mapProducts(prodRes.items || [], slugById);
  const collections = mapCollections(colls || [], findArt);

  const src = dailyRes || byDate[0] || null;
  const dailyArtwork = { artId: '', title: '', date: '', intention: '', note: '' };
  if (src && src.slug) {
    const d = new Date((src.artwork_date || '') + 'T00:00:00');
    const label = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    dailyArtwork.artId = src.slug;
    dailyArtwork.title = src.title || '';
    dailyArtwork.date = label;
    dailyArtwork.intention = src.intention || '';
    dailyArtwork.note = src.artist_note || '';
  }

  return { artworks, products, collections, findArt, dailyArtwork };
}

export async function loadHeroes() {
  if (typeof fetch !== 'function') return [];
  try {
    const r = await fetch('/api/public/heroes');
    const d = r.ok ? await r.json() : { items: [] };
    return (d.items || []).map(u => (u.charAt(0) === '/' ? u.slice(1) : u));
  } catch (e) { return []; }
}

/* Session + CSRF (used by the contact + store forms). */
export async function fetchSession() {
  try {
    const r = await fetch('/api/public/session');
    return r.ok ? await r.json() : {};
  } catch (e) { return {}; }
}