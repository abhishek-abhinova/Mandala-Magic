const { getDb, run } = require('./db');

// Seeds the database from the frontend catalog (assets/js/data.js), generates a
// deterministic SVG preview for every artwork, and creates the admin account.
// Runs only when tables are empty, so it never overwrites live data.

const SVG_DIR = require('path').join(__dirname, '..', 'assets', 'img', 'art');

function load() {
  const fs = require('fs');
  const path = require('path');
  const vm = require('vm');
  const src = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'data.js'), 'utf8');
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.MM;
}

// ---- Procedural SVG artwork generator (matches brand: mandala / landscape / abstract) ----
function polyRound(cx, cy, r, n, rot = 0, r2 = 1) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (Math.PI * 2 * i) / n;
    const rr = i % 2 === 0 ? r : r * r2;
    pts.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1));
  }
  return pts.join(' ');
}

function mandalaSVG(pal, title) {
  const n = 12, cx = 400, cy = 400, R = 345;
  let petals = '';
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    petals += `<ellipse cx="${cx}" cy="${cy}" rx="46" ry="${R}" transform="rotate(${(180 * a) / Math.PI} ${cx} ${cy})" fill="${pal[2]}" opacity="0.30"/><circle cx="${x}" cy="${y}" r="14" fill="${pal[4]}" opacity="0.85"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><radialGradient id="g" cx="50%" cy="42%" r="75%"><stop offset="0%" stop-color="${pal[0]}"/><stop offset="100%" stop-color="#05030f"/></radialGradient></defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <g transform="rotate(-6 400 400)">${petals}</g>
  <g stroke="${pal[4]}" fill="none" opacity="0.7">
    <circle cx="400" cy="400" r="300" stroke-width="1"/>
    <circle cx="400" cy="400" r="300" stroke-dasharray="120 12" stroke-width="3" opacity="0.5"/>
    <ellipse cx="400" cy="400" rx="150" ry="150" fill="${pal[3]}" opacity="0.22" stroke="none"/>
    <circle cx="400" cy="400" r="150" stroke-width="1.5"/>
    <circle cx="400" cy="400" r="92" stroke-dasharray="40 14" stroke-width="2"/>
    <polygon points="${polyRound(400, 400, 258, 12, 0.52, 0.35)}" stroke-width="1.4" opacity="0.8"/>
    <polygon points="${polyRound(400, 400, 92, n, 0, 0.6)}"/>
    <circle cx="400" cy="400" r="6" fill="${pal[4]}"/>
  </g>
  <circle cx="400" cy="400" r="346" fill="none" stroke="${pal[4]}" stroke-width="2" opacity="0.5"/>
  <circle cx="400" cy="400" r="356" fill="none" stroke="${pal[3]}" stroke-width="1" opacity="0.4" stroke-dasharray="5 9"/>
  <text x="400" y="770" text-anchor="middle" font-family="Arial" font-size="15" letter-spacing="6" fill="${pal[5]}" opacity="0.55" text-transform="uppercase">${title}</text>
  </svg>`;
}

function landscapeSVG(pal) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${pal[1]}"/><stop offset="60%" stop-color="${pal[2]}"/><stop offset="100%" stop-color="${pal[3]}"/></linearGradient>
  <radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${pal[5]}"/><stop offset="70%" stop-color="${pal[4]}"/><stop offset="100%" stop-color="${pal[4]}" stop-opacity="0"/></radialGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${pal[3]}"/><stop offset="100%" stop-color="${pal[0]}"/></linearGradient></defs>
  <rect width="800" height="800" fill="url(#sky)"/>
  <circle cx="400" cy="430" r="230" fill="url(#sun)"/>
  <circle cx="400" cy="430" r="92" fill="${pal[5]}" opacity="0.9"/>
  <g fill="url(#ground)" opacity="0.95">
    <path d="M0 640 L120 520 240 600 380 470 520 610 660 520 800 600 L800 800 L0 800 Z"/>
  </g>
  <g fill="${pal[0]}" opacity="0.85">
    <path d="M0 690 L170 570 330 660 470 550 640 640 800 585 L800 800 L0 800 Z"/>
  </g>
  <g fill="${pal[0]}">
    <path d="M0 745 L210 655 420 730 620 645 800 700 L800 800 L0 800 Z"/>
  </g>
  <g stroke="${pal[5]}" opacity="0.5" fill="none">
    <circle cx="180" cy="180" r="1.6"/><circle cx="560" cy="120" r="1.2"/><circle cx="660" cy="240" r="1.5"/>
    <circle cx="120" cy="300" r="1.1"/><circle cx="630" cy="330" r="1.3"/><circle cx="250" cy="100" r="1"/>
  </g></svg>`;
}

function abstractSVG(pal) {
  let waves = '';
  for (let i = 0; i < 10; i++) {
    const y = 300 + i * 26, op = 0.9 - i * 0.07;
    waves += `<path d="M0 ${y} C 160 ${y - 60}, 240 ${y + 60}, 400 ${y} S 640 ${y - 60}, 800 ${y}" fill="none" stroke="${pal[2 + (i % 4)]}" stroke-width="3" opacity="${op}" stroke-linecap="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><radialGradient id="g" cx="50%" cy="45%" r="80%"><stop offset="0%" stop-color="${pal[1]}"/><stop offset="100%" stop-color="${pal[0]}"/></radialGradient></defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <g opacity="0.9"><circle cx="400" cy="390" r="${230}" fill="none" stroke="${pal[3]}" stroke-width="1" stroke-dasharray="3 10" opacity="0.6"/>${waves}</g>
  <circle cx="400" cy="120" r="34" fill="${pal[4]}" opacity="0.5"/>
  <circle cx="210" cy="640" r="60" fill="${pal[3]}" opacity="0.18"/>
  <circle cx="600" cy="620" r="84" fill="${pal[2]}" opacity="0.16"/></svg>`;
}

function artSVG(style, pal, title) {
  if (style === 'landscape') return landscapeSVG(pal);
  if (style === 'abstract') return abstractSVG(pal);
  return mandalaSVG(pal, title);
}

function writeArtworkSvg(art, slug) {
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(SVG_DIR, { recursive: true });
  const file = path.join(SVG_DIR, slug + '.svg');
  const svg = artSVG(art.style, art.palette, art.title);
  fs.writeFileSync(file, svg);
  return '/assets/img/art/' + slug + '.svg';
}

function seedIfEmpty() {
  const db = getDb();
  const n = db.prepare('SELECT COUNT(*) as n FROM artworks').get().n;
  if (n > 0) { console.log('Seed skipped (database already populated).'); return; }

  console.log('Seeding demo data…');
  const MM = load();
  const catMap = { mandala: 'Mandala', landscape: 'Digital Landscape', abstract: 'Abstract' };

  const insertArt = db.prepare(`INSERT INTO artworks (title,slug,description,intention,artist_note,image_url,thumbnail_url,artwork_date,category,is_featured,is_daily_mandala,status,palette) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertProd = db.prepare(`INSERT INTO products (title,slug,description,price,sale_price,artwork_id,category,product_type,status,is_featured,image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const insertVariant = db.prepare(`INSERT INTO product_variants (product_id,size,color,price,stock) VALUES (?,?,?,?,?)`);

  const artIdMap = {};
  const seenProd = new Set();
  const txn = db.transaction(() => {
    MM.artworks.forEach((a, i) => {
      const pal = a.palette || ['#0b0620', '#241245', '#3b1f6e', '#7a3ff2', '#b45bff', '#28c7b0'];
      const url = writeArtworkSvg({ style: a.style || a.cat, palette: pal, title: a.title }, a.slug || a.id);
      const info = insertArt.run(a.title, a.slug || a.id, '', a.intention || '', a.note || '', url, url, a.date || '', catMap[a.cat] || a.cat || 'Mandala', a.featured ? 1 : 0, i === 0 ? 1 : 0, 'published', JSON.stringify(pal));
      artIdMap[a.id] = info.lastInsertRowid;
    });

    MM.products.forEach(p => {
      const art = MM.artworks.find(x => x.id === p.artId);
      const artDbId = artIdMap[p.artId];
      if (seenProd.has(p.id)) return; // frontend treats duplicate ids as one product (first match wins)
      seenProd.add(p.id);
      const imgUrl = '/assets/img/art/' + (art.slug || art.id) + '.svg';
      const info = insertProd.run(
        p.name || (art.title + ' ' + p.type),
        p.id,
        p.desc || `${art.title} — a ${p.type.toLowerCase()} designed from Orchid Mandala's original artwork. Made to order and printed through our print-on-demand partner.`,
        p.price, null, artDbId, p.type, p.type, 'published', art.best ? 1 : 0, imgUrl
      );
      (p.sizes || ['One Size']).forEach(size => insertVariant.run(info.lastInsertRowid, size, (p.colors || [])[0] || '', null, -1));
    });

    // Keep the sanitized product↔artwork junction populated on fresh installs.
    run('INSERT OR IGNORE INTO product_artwork_links (product_id, artwork_id) SELECT id, artwork_id FROM products WHERE artwork_id IS NOT NULL AND artwork_id != 0');

    const cols = [['Sacred Geometry', 'sacred-geometry', 'Ancient patterns, mathematical grace.'], ['Cosmic Dreams', 'cosmic-dreams', 'Galaxies, starlight and the worlds within.'], ['Nature & Landscapes', 'nature-landscapes', 'Digital landscapes drawn from wild places.']];
    const colIds = {};
    for (const [name, slug, desc] of cols) {
      const info = run('INSERT INTO collections (name,slug,description) VALUES (?,?,?)', [name, slug, desc]);
      colIds[slug] = info.lastID;
    }

    // Collections are populated from the real artwork catalog (by category),
    // so the storefront's collection pages always reflect the artworks in the DB.
    const colCat = { 'sacred-geometry': 'Mandala', 'cosmic-dreams': 'Abstract', 'nature-landscapes': 'Digital Landscape' };
    for (const [slug, cat] of Object.entries(colCat)) {
      const arts = db.prepare('SELECT id FROM artworks WHERE category = ?').all(cat);
      const insItem = db.prepare('INSERT INTO collection_items (collection_id,item_id,item_type) VALUES (?,?,?)');
      for (const a of arts) insItem.run(colIds[slug], a.id, 'artwork');
    }
  });
  txn();

  const bcrypt = require('bcryptjs');
  const configMatch = require('./config');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mandalamagicbyom.com';
  const adminPass = process.env.ADMIN_PASSWORD || (!configMatch.isDev ? 'changeme' : 'admin123');
  run('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)', ['Orchid Mandala', adminEmail, bcrypt.hashSync(adminPass, 10), 'admin']);
  run('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)', ['Stargazer Demo', 'customer@example.com', bcrypt.hashSync('customer123', 10), 'customer']);

  console.log('Seed complete. Admin login → ' + adminEmail + ' / ' + adminPass);
  console.log('SVG artwork previews written to assets/img/art/ (' + MM.artworks.length + ' works).');
}

module.exports = { seedIfEmpty, load };

if (require.main === module) { seedIfEmpty(); }