/* ============================================================
   MANDALA MAGIC BY OM — Live Catalog Loader
   Reads the real catalog from the database via /api/public/*.
   (No demo content — storefront always reflects the DB.)
   ============================================================ */
window.MM = window.MM || {};
const MM = window.MM;

MM.config = {
  brand: 'Mandala Magic by OM',
  artist: 'Orchid Mandala',
  tagline: 'Art created with intention.',
  years: '27 Years',
  currency: '$',
  dailyArtwork: { artId: '', title: '', date: '', intention: '', note: '' }
};

MM.c = {
  gold: '#d4af37',
  goldLight: '#e8c877',
  goldPale: '#f7e6b5',
  white: '#f7f3ff'
};

/* ---------------- Seeded randomness (deterministic art) ---------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function clampi(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* ---------------- SVG artwork generators (palette preview art) ---------------- */
function svArtHalo(id, colors, style) {
  const cx = 400, cy = 400;
  let gid = 'g' + id.replace(/[^a-z0-9]/gi, '');
  let rnd = mulberry32(id.split('').reduce((a, c) => a + c.charCodeAt(0), 7));

  let defs = `
  <defs>
    <radialGradient id="bg${gid}" cx="50%" cy="42%" r="78%">
      <stop offset="0%" stop-color="${colors[0]}"/>
      <stop offset="46%" stop-color="${colors[1]}"/>
      <stop offset="100%" stop-color="${colors[2]}"/>
    </radialGradient>
    <radialGradient id="gl${gid}" cx="50%" cy="46%" r="55%">
      <stop offset="0%" stop-color="${colors[3]}" stop-opacity="0.55"/>
      <stop offset="70%" stop-color="${colors[4]}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${colors[4]}" stop-opacity="0"/>
    </radialGradient>
    <filter id="bl${gid}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
    <filter id="gl22${gid}" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>`;

  let parts = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" class="art-svg" preserveAspectRatio="xMidYMid slice">`, defs,
  `<rect width="800" height="800" fill="url(#bg${gid})"/>`,
  `<circle cx="400" cy="400" r="420" fill="url(#gl${gid})"/>`];

  if (style === 'mandala') {
    parts.push(svMandalaBody(gid, colors, rnd, id));
  } else if (style === 'landscape') {
    parts.push(svLandscapeBody(gid, colors, rnd, id));
  } else {
    parts.push(svAbstractBody(gid, colors, rnd, id));
  }

  parts.push(`<circle cx="400" cy="400" r="398" fill="none" stroke="${MM.c.gold}" stroke-opacity="0.18" stroke-width="2"/>`);
  parts.push(`</svg>`);
  return parts.join('\n');
}

function svMandalaBody(gid, colors, rnd, id) {
  const cx = 400, cy = 400, gold = MM.c.gold, goldL = MM.c.goldLight;
  let L = [];

  function petalStroke(x, y, r, w, h, c, o, sw) {
    return `<path stroke="${c}" stroke-width="${sw}" fill="none" opacity="${o}" d="M ${x},${y - r} C ${x - w},${y - r + h * 0.25} ${x - w * 1.25},${y - r + h * 0.62} ${x},${y - r - h * 0.75} C ${x + w * 1.25},${y - r + h * 0.62} ${x + w},${y - r + h * 0.25} ${x},${y - r}"/>`;
  }

  // halo
  for (let i = 0; i < 3; i++) {
    let rr = 300 + i * 30;
    L.push(`<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${gold}" stroke-opacity="${0.08 + i * 0.03}" stroke-width="${i === 0 ? 1.2 : 0.7}"/>`);
  }

  // outer glow rays
  let rays = 36;
  for (let k = 0; k < rays; k++) {
    let a = (k / rays) * Math.PI * 2;
    let x1 = cx + Math.cos(a) * 318, y1 = cy + Math.sin(a) * 318;
    let x2 = cx + Math.cos(a) * 352, y2 = cy + Math.sin(a) * 352;
    L.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${gold}" stroke-opacity="${0.16 + rnd() * 0.2}" stroke-width="${0.6 + rnd() * 1}"/>`);
  }

  // layered petals
  let rings = [
    { n: 6, r: 78, w: 34, h: 74, c: colors[3], o: 0.95, rot: 0 },
    { n: 6, r: 96, w: 26, h: 60, c: colors[4], o: 0.9, rot: 30 },
    { n: 12, r: 138, w: 24, h: 88, c: colors[5], o: 0.85, rot: 15 },
    { n: 12, r: 172, w: 15, h: 46, c: goldL, o: 0.7, rot: 0 },
    { n: 24, r: 214, w: 20, h: 92, c: colors[2], o: 0.6, rot: 7.5 },
    { n: 24, r: 252, w: 9, h: 38, c: gold, o: 0.55, rot: 3.75 },
    { n: 12, r: 292, w: 30, h: 92, c: colors[1], o: 0.4, rot: 22.5 }
  ];

  for (let ri = 0; ri < rings.length; ri++) {
    let rg = rings[ri];
    for (let k = 0; k < rg.n; k++) {
      let a0 = (k / rg.n) * 360 + rg.rot + ri * 1.7;
      if (ri % 2 === 0) {
        L.push(`<g transform="rotate(${a0.toFixed(2)} ${cx} ${cy})">${petalStroke(cx, cy, rg.r, rg.w, rg.h, rg.c, rg.o, ri < 3 ? 3 : 2)}</g>`);
      } else {
        let w = rg.w * (0.7 + rnd() * 0.6);
        let p = `<path fill="${rg.c}" opacity="${rg.o}" d="M ${cx},${cy - rg.r} C ${cx - w},${cy - rg.r + rg.h * 0.28} ${cx - w},${cy - rg.r + rg.h * 0.72} ${cx},${cy - rg.r - rg.h} C ${cx + w},${cy - rg.r + rg.h * 0.72} ${cx + w},${cy - rg.r + rg.h * 0.28} ${cx},${cy - rg.r}"/>`;
        L.push(`<g transform="rotate(${a0.toFixed(2)} ${cx} ${cy})">${p}</g>`);
      }
    }
  }

  // dot ring
  let dotR = 316, dotN = 60;
  for (let k = 0; k < dotN; k++) {
    let a = (k / dotN) * Math.PI * 2 + 0.08;
    let x = cx + Math.cos(a) * dotR, y = cy + Math.sin(a) * dotR;
    L.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rnd() > 0.5 ? 2.6 : 1.5}" fill="${gold}" opacity="${0.3 + rnd() * 0.4}"/>`);
  }

  // star sparkles
  let stars = 26;
  for (let k = 0; k < stars; k++) {
    let a = rnd() * Math.PI * 2, r = 40 + rnd() * 340, s = 1 + rnd() * 2.4;
    let x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    L.push(`<path d="M${x},${y - s} L${x + s * 0.32},${y - s * 0.32} L${x + s},${y} L${x + s * 0.32},${y + s * 0.32} L${x},${y + s} L${x - s * 0.32},${y + s * 0.32} L${x - s},${y} L${x - s * 0.32},${y - s * 0.32} Z" fill="${goldL}" opacity="${0.25 + rnd() * 0.5}"/>`);
  }

  // central gem
  L.push(`<circle cx="${cx}" cy="${cy}" r="52" fill="${colors[4]}" opacity="0.9"/>`);
  L.push(`<circle cx="${cx}" cy="${cy}" r="52" fill="url(#gl${gid})"/>`);
  L.push(`<circle cx="${cx}" cy="${cy}" r="34" fill="${gold}" opacity="0.85"/>`);
  L.push(`<circle cx="${cx}" cy="${cy}" r="17" fill="${colors[0]}" opacity="0.9"/>`);
  L.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="${goldL}"/>`);
  L.push(`<circle cx="${cx}" cy="${cy}" r="40" fill="none" stroke="${gold}" stroke-opacity="0.6" stroke-width="1.5"/>`);

  return L.join('\n');
}

function svLandscapeBody(gid, colors, rnd, id) {
  const gold = MM.c.gold, goldL = MM.c.goldLight;
  let L = [];
  let horizon = 500;

  // sun / moon
  let sunY = 320, sunR = 74;
  L.push(`<circle cx="400" cy="${sunY}" r="${sunR}" fill="${goldL}" opacity="0.95"/>`);
  L.push(`<circle cx="400" cy="${sunY}" r="${sunR + 34}" fill="${gold}" opacity="0.25" filter="url(#bl${gid})"/>`);
  L.push(`<circle cx="400" cy="${sunY}" r="${sunR + 76}" fill="url(#gl${gid})" filter="url(#bl${gid})"/>`);

  // stars
  for (let k = 0; k < 40; k++) {
    let x = 20 + rnd() * 760, y = 30 + rnd() * horizon * 0.7, s = 0.8 + rnd() * 2.2;
    L.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="${goldL}" opacity="${0.18 + rnd() * 0.5}"/>`);
  }

  // mountains (layered)
  let layers = [
    { base: 432, amp: 90, color: colors[1], o: 0.5 },
    { base: 480, amp: 70, color: colors[5], o: 0.6 },
    { base: 516, amp: 46, color: colors[4], o: 0.72 },
    { base: 546, amp: 30, color: colors[2], o: 0.9 }
  ];
  for (let li = 0; li < layers.length; li++) {
    let lg = layers[li];
    let pts = [];
    let n = 8;
    for (let i = 0; i <= n; i++) {
      let x = (i / n) * 800;
      let y = lg.base - Math.abs(Math.sin(i * 1.9)) * lg.amp - rnd() * 14;
      pts.push(`${x},${y}`);
    }
    let d = `M 0,${horizon} ` + pts.map(p => 'L ' + p).join(' ') + ` L 800,${horizon} Z`;
    L.push(`<path d="${d}" fill="${lg.color}" opacity="${lg.o}"/>`);

    // gold ridge line on second layer
    if (li === 1) {
      L.push(`<path d="M0,${horizon} ${pts.map(p => 'L' + p).join(' ')}" fill="none" stroke="${gold}" stroke-opacity="0.4" stroke-width="1.4"/>`);
    }
  }

  // water reflection
  L.push(`<rect x="0" y="${horizon}" width="800" height="${800 - horizon}" fill="${colors[0]}" opacity="0.75"/>`);
  for (let k = 0; k < 26; k++) {
    let y = horizon + 10 + rnd() * (800 - horizon - 20);
    let w = 40 + rnd() * 220, x = (rnd() * 760) + 20;
    L.push(`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + w).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${gold}" opacity="${0.12 + rnd() * 0.25}" stroke-width="${0.7 + rnd() * 1.1}"/>`);
  }
  return L.join('\n');
}

function svAbstractBody(gid, colors, rnd, id) {
  const gold = MM.c.gold, goldL = MM.c.goldLight;
  let L = [];
  // fluid blobs
  let blobs = [
    { x: 400, y: 400, s: 240, c: colors[3], o: 0.5 },
    { x: 250, y: 300, s: 170, c: colors[4], o: 0.42 },
    { x: 560, y: 330, s: 150, c: colors[5], o: 0.4 },
    { x: 390, y: 540, s: 190, c: colors[2], o: 0.34 }
  ];
  for (let b of blobs) {
    let path = `M ${b.x},${b.y - b.s} C ${b.x + b.s * 1.1},${b.y - b.s * 0.8} ${b.x + b.s * 1.3},${b.y + b.s * 0.2} ${b.x + b.s * 0.4},${b.y + b.s} C ${b.x - b.s * 0.4},${b.y + b.s * 1.1} ${b.x - b.s * 1.2},${b.y + b.s * 0.5} ${b.x - b.s},${b.y - b.s * 0.3} C ${b.x - b.s * 0.9},${b.y - b.s * 0.9} ${b.x - b.s * 0.5},${b.y - b.s * 1.05} ${b.x},${b.y - b.s} Z`;
    L.push(`<path d="${path}" fill="${b.c}" opacity="${b.o}" filter="url(#bl${gid})"/>`);
  }
  // arcs
  for (let k = 0; k < 5; k++) {
    let r = 70 + k * 46;
    L.push(`<circle cx="400" cy="400" r="${r}" fill="none" stroke="${gold}" stroke-opacity="${0.28 - k * 0.04}" stroke-width="1.6" stroke-dasharray="${(14 + k * 5)},${(10 + k * 3)}"/>`);
  }
  // particles
  for (let k = 0; k < 46; k++) {
    let a = rnd() * Math.PI * 2, r = 40 + rnd() * 360, s = 1 + rnd() * 3;
    let x = 400 + Math.cos(a) * r, y = 400 + Math.sin(a) * r;
    L.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="${goldL}" opacity="${0.2 + rnd() * 0.5}"/>`);
  }
  // thin gold threads
  for (let k = 0; k < 3; k++) {
    let x0 = 100 + k * 260, y = 180 + k * 180;
    L.push(`<path d="M ${x0},${y} Q ${x0 + 130},${y - 80} ${x0 + 260},${y} T ${x0 + 520},${y - 20}" fill="none" stroke="${gold}" stroke-opacity="0.5" stroke-width="1.4"/>`);
  }
  return L.join('\n');
}

/* ---------------- Helpers ---------------- */
MM.findArt = id => MM.artworks.find(a => a.id === id);
MM.findProduct = id => MM.products.find(p => p.id === id);

MM.artPrice = price => MM.config.currency + Number(price).toFixed(2);

/* Renders the artwork media: an <img> when the DB holds a real uploaded
   image, otherwise the deterministic palette preview SVG. */
MM.artworkSVG = function (id) {
  const art = MM.findArt(id);
  if (!art) return '';
  if (art.image && art.image.indexOf('/assets/img/art/') === -1) {
    return `<img class="art-svg" src="${art.image}" alt="${MM.escAttr(art.title || '')}" loading="lazy">`;
  }
  return svArtHalo(id, art.palette || [], art.style || art.cat);
};

MM.escAttr = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
};

MM.arrowSVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

MM.quoteSVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6.5 7C4.6 8.6 3 10.9 3 13.6V19h6v-6H6c0-1.9.9-3.2 2.2-4.2L6.5 7zm11 0c-1.9 1.6-3.5 3.9-3.5 6.6V19h6v-6h-3c0-1.9.9-3.2 2.2-4.2L17.5 7z"/></svg>`;

/* ---------------- Data shapes (declare empty before hydration) ---------------- */
MM.artworks = [];
MM.products = [];
MM.collections = [];
MM.testimonials = [];

/* ---------------- DB → frontend mapping ---------------- */
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
    if (!artId) continue; // a product must be linked to an artwork to render
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

function mapCollections(rows) {
  const out = [];
  for (const c of rows) {
    const cover = MM.findArt(c.artId);
    const members = (c.members || []).filter(id => !!MM.findArt(id));
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

function setDaily(a) {
  if (!a || !a.slug) return;
  const d = new Date((a.artwork_date || '') + 'T00:00:00');
  const label = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  MM.config.dailyArtwork = {
    artId: a.slug,
    title: a.title || '',
    date: label,
    intention: a.intention || '',
    note: a.artist_note || ''
  };
}

async function loadCatalog() {
  const [artRes, prodRes, colls, dailyRes] = await Promise.all([
    api('/api/public/artworks?limit=500'),
    api('/api/public/products?limit=500'),
    api('/api/public/collections'),
    api('/api/public/artworks/daily').catch(() => null)
  ]);

  const rawArts = artRes.items || [];
  const artworks = mapArtworks(rawArts);
  MM.artworks = artworks;

  // "newest" = the most recently published works (today's mandala first).
  const byDate = artworks.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  byDate.slice(0, 6).forEach((a, i) => { if (i < 6) a.newest = a.newest || i === 0; });

  // products.artwork_id is the DB integer id — map it to the artwork slug.
  const slugById = {};
  for (const a of rawArts) slugById[a.id] = a.slug;

  MM.products = mapProducts(prodRes.items || [], slugById);
  MM.collections = mapCollections(colls || []);
  MM.testimonials = []; // no testimonials in the DB yet — section stays hidden

  setDaily(dailyRes || byDate[0] || null);
  return { artworks: MM.artworks, products: MM.products, collections: MM.collections };
}

MM.dataReady = loadCatalog().catch(err => {
  console.error('Catalog load failed — storefront will render empty until the server is reachable.', err);
  return { artworks: [], products: [], collections: [] };
});