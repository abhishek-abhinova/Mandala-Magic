/* ============================================================
   MANDALA MAGIC BY OM — Content Model & Generative Artwork
   Demo content. Orchid can replace artworks/products with her
   real Yoycol catalog later by editing this file.
   ============================================================ */
window.MM = window.MM || {};
const MM = window.MM;

MM.config = {
  brand: 'Mandala Magic by OM',
  artist: 'Orchid Mandala',
  tagline: 'Art created with intention.',
  years: '27 Years',
  currency: '$',
  dailyArtwork: { artId: 'cosmic-bloom', title: 'Cosmic Bloom', date: 'September 12, 2026', intention: 'Open your heart to the boundless magic already living inside you.', note: "This morning's mandala bloomed slowly — petal by petal, breath by breath. It became my prayer to stay curious, to remain soft even in the dark." }
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

/* ---------------- SVG artwork generators ---------------- */
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
    let d = `M 0,${horizon}`;
    let pts = [];
    let n = 8;
    for (let i = 0; i <= n; i++) {
      let x = (i / n) * 800;
      let y = lg.base - Math.abs(Math.sin(i * 1.9)) * lg.amp - rnd() * 14;
      pts.push(`${x},${y}`);
    }
    d = `M 0,${horizon} L ` + pts.map(p => 'L ' + p).join(' ') + ` L 800,${horizon} Z`;
    L.push(`<path d="${d}" fill="${lg.color}" opacity="${lg.o}"/>`);

    // gold ridge line on second layer
    if (li === 1) {
      let ridge = pts.map(p => p).join(' ');
      let gp = 'M ' + ridge.replace(/L/g, 'L').replace(/^/, '');
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

/* ---------------- Artwork catalog ---------------- */
/* style: mandala | landscape | abstract   category: mandala | landscape | abstract */
MM.artworks = [
  { id: 'cosmic-bloom', title: 'Cosmic Bloom', date: '2026-09-12', intention: 'Open your heart to the magic already living inside you.', note: "This mandala bloomed slowly, petal by petal — a prayer to stay curious and soft even in the dark.", cat: 'mandala', style: 'mandala', featured: true, newest: true, best: true, palette: ['#0b0620', '#241245', '#3b1f6e', '#7a3ff2', '#b45bff', '#28c7b0'] },
  { id: 'sacred-sunrise', title: 'Sacred Sunrise', date: '2026-09-10', intention: 'Begin again with light.', note: "The horizon painted itself gold this morning, so I followed it home.", cat: 'landscape', style: 'landscape', featured: true, best: true, palette: ['#07030f', '#1b1033', '#3a1b54', '#c98a3a', '#e8c877', '#f4e3b0'] },
  { id: 'infinite-harmony', title: 'Infinite Harmony', date: '2026-09-08', intention: 'Find the rhythm that holds you gently.', note: "Every circle returns to its beginning, and so do we — changed.", cat: 'mandala', style: 'mandala', featured: false, best: true, palette: ['#040312', '#1c1444', '#31277a', '#4d4fcf', '#7f7bff', '#26b7c2'] },
  { id: 'lotus-within', title: 'Lotus Within', date: '2026-09-06', intention: 'Grow beauty from quiet waters.', note: "The lotus asks nothing of the mud; it simply blooms.", cat: 'mandala', style: 'mandala', featured: true, palette: ['#0a0518', '#33114b', '#6b1d63', '#c2389c', '#f15bb5', '#e8c877'] },
  { id: 'inner-universe', title: 'Inner Universe', date: '2026-09-03', intention: 'You contain galaxies — treat them kindly.', note: "A meditation on the cosmos that hums beneath the skin.", cat: 'abstract', style: 'abstract', featured: true, palette: ['#03020c', '#101a4a', '#1f2f77', '#2b6cb0', '#38b2c5', '#e8c877'] },
  { id: 'golden-intention', title: 'Golden Intention', date: '2026-08-30', intention: 'Choose one small true thing today.', note: "Drawn the morning I decided to give this practice a name.", cat: 'mandala', style: 'mandala', featured: true, best: true, palette: ['#0a0710', '#2c1b10', '#5c3a17', '#c98a3a', '#e8c877', '#f7e6b5'] },
  { id: 'celestial-garden', title: 'Celestial Garden', date: '2026-08-27', intention: 'Tend what grows in the dark.', note: "A garden that only opens at night, under a canopy of stars.", cat: 'landscape', style: 'landscape', featured: true, palette: ['#020310', '#0d1b3d', '#1e3a5f', '#2a6f6b', '#3aa08d', '#e8c877'] },
  { id: 'dreamscape', title: 'Dreamscape', date: '2026-08-24', intention: 'Let sleep carry you somewhere kinder.', note: "Painted from the edge of a dream I nearly forgot.", cat: 'abstract', style: 'abstract', featured: false, palette: ['#04030f', '#1c1450', '#2e2482', '#6a3fa0', '#b45bff', '#f4e3b0'] },
  { id: 'path-of-light', title: 'Path of Light', date: '2026-08-21', intention: 'Even one small lamp can end a long night.', note: "A single golden line finding its way across a dark field.", cat: 'landscape', style: 'landscape', featured: true, palette: ['#060310', '#160f2e', '#33205c', '#b06f2e', '#e8c877', '#6aa9c2'] },
  { id: 'starlight-bloom', title: 'Starlight Bloom', date: '2026-08-18', intention: 'Bloom where you were planted, even under moonlight.', note: "Petal by petal, the flower learned to love the silver light.", cat: 'mandala', style: 'mandala', featured: false, palette: ['#03020d', '#141c46', '#22306b', '#2b6cb0', '#63b3c2', '#f4e3b0'] },
  { id: 'prism-lotus', title: 'Prism Lotus', date: '2026-08-15', intention: 'Refract the light you carry.', note: "A study of how one white light can become every colour.", cat: 'mandala', style: 'mandala', featured: false, palette: ['#050210', '#38124a', '#7a1e63', '#d6409e', '#f15bb5', '#38b2c5'] },
  { id: 'echo-of-silence', title: 'Echo of Silence', date: '2026-08-12', intention: 'Sometimes stillness is the loudest answer.', note: "Drawn in total quiet, save a single singing bowl.", cat: 'abstract', style: 'abstract', featured: false, palette: ['#03030c', '#16162e', '#2c2c52', '#4c4f8f', '#7f7bff', '#2ec4b6'] },
  { id: 'violet-dawn', title: 'Violet Dawn', date: '2026-08-09', intention: 'Come gently into the new day.', note: "The first violet of morning spills across everything.", cat: 'landscape', style: 'landscape', featured: false, palette: ['#050310', '#221043', '#4c1d6e', '#7a3ff2', '#b45bff', '#e8c877'] },
  { id: 'ocean-of-stars', title: 'Ocean of Stars', date: '2026-08-06', intention: 'Drift. The tide knows the way.', note: "Where the night sky spills into the sea and forgets to stop.", cat: 'landscape', style: 'landscape', featured: false, best: true, palette: ['#020310', '#0c1c4a', '#16307d', '#2b6cb0', '#38b2c5', '#e8c877'] },
  { id: 'amber-reverie', title: 'Amber Reverie', date: '2026-08-03', intention: 'Warmth is a practice, not a place.', note: "Golden amber drifting through a summer half-remembered.", cat: 'abstract', style: 'abstract', featured: false, palette: ['#0a0710', '#2c1208', '#5c2a10', '#c96a2e', '#e8a25c', '#f7e6b5'] },
  { id: 'nova-petals', title: 'Nova Petals', date: '2026-07-30', intention: 'Explode softly.', note: "A supernova imagined as a field of gentlest petals.", cat: 'mandala', style: 'mandala', featured: false, palette: ['#050211', '#31103a', '#7a1e4b', '#d6407e', '#f15bb5', '#e8c877'] },
  { id: 'whispers-of-gold', title: 'Whispers of Gold', date: '2026-07-27', intention: 'Listen for the quiet yes.', note: "Gold thread on a black field — an oracle written in light.", cat: 'mandala', style: 'mandala', featured: false, palette: ['#0a0710', '#241607', '#4e310e', '#b06f2e', '#e8c877', '#f7e6b5'] },
  { id: 'cosmic-tide', title: 'Cosmic Tide', date: '2026-07-23', intention: 'Let the universe pull you gently forward.', note: "Waves, but made of stars — a tide that never reaches shore.", cat: 'abstract', style: 'abstract', featured: false, palette: ['#03020c', '#0e1c4a', '#1b3384', '#2b6cb0', '#3aa0b5', '#f4e3b0'] },
  { id: 'heart-of-calm', title: 'Heart of Calm', date: '2026-07-19', intention: 'Rest is productive. Rest is sacred.', note: "Three breaths, one circle, a whole afternoon unhurried.", cat: 'mandala', style: 'mandala', featured: false, palette: ['#04100e', '#0f2f2a', '#1f5a4e', '#2a8f7a', '#38b2a5', '#e8c877'] },
  { id: 'moonlit-garden', title: 'Moonlit Garden', date: '2026-07-15', intention: 'Wander somewhere silver tonight.', note: "A garden caught between sunset and the moonrise.", cat: 'landscape', style: 'landscape', featured: false, palette: ['#020310', '#101c3e', '#1e3a5f', '#2f5f6e', '#63a3b5', '#f4e3b0'] },
  { id: 'aurora-mandala', title: 'Aurora Mandala', date: '2026-07-11', intention: 'Dance with the sky tonight.', note: "The auroras came down while I was drawing and joined the circle.", cat: 'mandala', style: 'mandala', featured: false, palette: ['#040310', '#0d1b3d', '#1f3370', '#2b6cb0', '#4fd1a8', '#b45bff'] },
  { id: 'temple-of-light', title: 'Temple of Light', date: '2026-07-07', intention: 'Your body is a temple. Enter softly.', note: "A structure imagined entirely from pillars of gold light.", cat: 'mandala', style: 'mandala', featured: true, palette: ['#0a0710', '#2b1b0c', '#5c3a17', '#b06f2e', '#e8c877', '#a5d6e0'] },
  { id: 'dancing-petals', title: 'Dancing Petals', date: '2026-07-02', intention: 'Joy is allowed. Dance like nothing is watching.', note: "Petal after petal, the page began to sway to a rhythm only I could hear.", cat: 'mandala', style: 'mandala', featured: false, palette: ['#080313', '#3a1140', '#8a1e52', '#d6407e', '#f15bb5', '#e8c877'] },
  { id: 'serene-cosmos', title: 'Serene Cosmos', date: '2026-06-28', intention: 'The cosmos is calm. Borrow its composure.', note: "Drawn during a deep, wordless meditation — this is what stillness looks like when it breathes.", cat: 'mandala', style: 'mandala', featured: true, palette: ['#03020c', '#101a44', '#1f2f77', '#3d4fc0', '#7f9cff', '#2ec4b6'] },
  { id: 'sacred-geometry-i', title: 'Sacred Geometry I', date: '2026-06-24', intention: 'Honour the ancient patterns.', note: "The first of a series exploring the mathematics hidden inside the sacred.", cat: 'mandala', style: 'mandala', featured: true, palette: ['#06030f', '#1c1250', '#33237a', '#7a3ff2', '#b45bff', '#e8c877'] },
  { id: 'golden-mandala-i', title: 'Golden Mandala I', date: '2026-06-20', intention: 'Worth is not earned; it is remembered.', note: "My first fully golden mandala — drawn on the anniversary of my practice.", cat: 'mandala', style: 'mandala', featured: false, palette: ['#0b0710', '#2c1c0c', '#5c3d14', '#c98a3a', '#e8c877', '#ffe9b3'] }
];

/* ---------------- Shop categories ---------------- */
MM.shopCategories = [
  { id: 'all', label: 'All Products' },
  { id: 'prints', label: 'Art Prints' },
  { id: 'canvas', label: 'Canvas & Wall Art' },
  { id: 'tshirts', label: 'T-Shirts' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'decor', label: 'Home Decor' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'gifts', label: 'Gifts' },
  { id: 'featured', label: 'Featured Collections' }
];

/* ---------------- Product catalog ---------------- */
/* type: Art Print | Canvas | T-Shirt | Hoodie | Home Decor | Accessories
   tags: shop category ids the product appears in                          */
const P = (artId, type, price, sizes, colors, extra) => {
  let art = MM.artworks.find(a => a.id === artId);
  let id = (artId + '-' + type).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  let tags = ['all'];
  if (type === 'Art Print') tags.push('prints');
  if (type === 'Canvas') tags.push('canvas');
  if (type === 'T-Shirt') tags.push('tshirts');
  if (type === 'Hoodie') tags.push('hoodies');
  if (type === 'Home Decor') tags.push('decor');
  if (type === 'Accessories') tags.push('accessories');
  if (extra && extra.gift) tags.push('gifts');
  if (art.best) tags.push('featured');
  return Object.assign({
    id, artId, type, price, sizes: sizes || ['One Size'],
    colors: colors || [], name: art.title + ' ' + type,
    desc: extra && extra.desc ? extra.desc : `${art.title} — a ${type.toLowerCase()} designed from Orchid Mandala's original artwork. Printed on demand with vivid, lasting colour.`
  }, extra || {}, { tags });
};

MM.products = [
  // Cosmic Bloom — full range
  P('cosmic-bloom', 'Art Print', 24, ['12×16″', '18×24″', '24×36″']),
  P('cosmic-bloom', 'Canvas', 59, ['12×16″', '18×24″', '24×36″'], ['Walnut', 'Black', 'Natural']),
  P('cosmic-bloom', 'T-Shirt', 29, ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Violet', 'Midnight']),
  P('cosmic-bloom', 'Hoodie', 59, ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Deep Purple', 'Teal']),
  P('cosmic-bloom', 'Home Decor', 48, ['One Size'], ['Champagne', 'Black']),
  P('cosmic-bloom', 'Accessories', 18, ['One Size'], ['Black', 'Champagne']),
  // Sacred Sunrise
  P('sacred-sunrise', 'Canvas', 69, ['18×24″', '24×36″'], ['Walnut', 'Black', 'Natural']),
  P('sacred-sunrise', 'Art Print', 26, ['12×16″', '18×24″', '24×36″']),
  P('sacred-sunrise', 'Hoodie', 62, ['S', 'M', 'L', 'XL'], ['Black', 'Champagne']),
  P('sacred-sunrise', 'T-Shirt', 28, ['XS', 'S', 'M', 'L', 'XL'], ['Black', 'Sand']),
  P('sacred-sunrise', 'Accessories', 16, ['One Size'], ['Champagne']),
  // Infinite Harmony
  P('infinite-harmony', 'Hoodie', 59, ['S', 'M', 'L', 'XL', 'XXL'], ['Midnight', 'Indigo', 'Black']),
  P('infinite-harmony', 'Art Print', 22, ['12×16″', '18×24″']),
  P('infinite-harmony', 'T-Shirt', 27, ['XS', 'S', 'M', 'L', 'XL'], ['Indigo', 'Black', 'Teal']),
  P('infinite-harmony', 'Home Decor', 52, ['One Size'], ['Indigo', 'Black']),
  // Lotus Within
  P('lotus-within', 'T-Shirt', 29, ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Plum', 'Rose']),
  P('lotus-within', 'Hoodie', 61, ['S', 'M', 'L', 'XL'], ['Plum', 'Black']),
  P('lotus-within', 'Art Print', 24, ['12×16″', '18×24″', '24×36″']),
  P('lotus-within', 'Accessories', 14, ['One Size'], ['Plum', 'Champagne']),
  P('lotus-within', 'Home Decor', 55, ['One Size'], ['Plum', 'Champagne']),
  // Inner Universe
  P('inner-universe', 'Canvas', 74, ['18×24″', '24×36″'], ['Black', 'Natural']),
  P('inner-universe', 'Hoodie', 63, ['S', 'M', 'L', 'XL'], ['Deep Blue', 'Black']),
  P('inner-universe', 'Art Print', 27, ['18×24″', '24×36″']),
  P('inner-universe', 'Accessories', 19, ['One Size'], ['Deep Blue']),
  // Golden Intention
  P('golden-intention', 'Art Print', 30, ['12×16″', '18×24″', '24×36″']),
  P('golden-intention', 'Canvas', 89, ['18×24″', '24×36″'], ['Gold', 'Black', 'Walnut']),
  P('golden-intention', 'Hoodie', 65, ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Gold']),
  P('golden-intention', 'Home Decor', 58, ['One Size'], ['Gold', 'Champagne']),
  P('golden-intention', 'T-Shirt', 30, ['XS', 'S', 'M', 'L', 'XL'], ['Black', 'Gold']),
  // Celestial Garden
  P('celestial-garden', 'Home Decor', 56, ['One Size'], ['Teal', 'Black']),
  P('celestial-garden', 'Canvas', 79, ['18×24″', '24×36″'], ['Natural', 'Black']),
  P('celestial-garden', 'Art Print', 26, ['12×16″', '18×24″']),
  // Dreamscape
  P('dreamscape', 'Art Print', 24, ['12×16″', '18×24″', '24×36″']),
  P('dreamscape', 'Hoodie', 60, ['S', 'M', 'L', 'XL'], ['Deep Purple', 'Black']),
  P('dreamscape', 'T-Shirt', 28, ['XS', 'S', 'M', 'L', 'XL'], ['Deep Purple', 'Black']),
  // Path of Light
  P('path-of-light', 'Canvas', 72, ['18×24″', '24×36″'], ['Walnut', 'Black']),
  P('path-of-light', 'Accessories', 17, ['One Size'], ['Sand', 'Black']),
  P('path-of-light', 'Art Print', 25, ['12×16″', '18×24″']),
  // Ocean of Stars
  P('ocean-of-stars', 'Canvas', 84, ['18×24″', '24×36″'], ['Black', 'Natural']),
  P('ocean-of-stars', 'Art Print', 28, ['12×16″', '18×24″', '24×36″']),
  P('ocean-of-stars', 'Home Decor', 54, ['One Size'], ['Deep Blue']),
  P('ocean-of-stars', 'Hoodie', 62, ['S', 'M', 'L', 'XL'], ['Deep Blue', 'Black']),
  // Temple of Light
  P('temple-of-light', 'Art Print', 32, ['18×24″', '24×36″']),
  P('temple-of-light', 'Hoodie', 66, ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Gold']),
  P('temple-of-light', 'Home Decor', 60, ['One Size'], ['Gold', 'Black']),
  // Serene Cosmos
  P('serene-cosmos', 'Canvas', 68, ['18×24″', '24×36″'], ['Black', 'Natural']),
  P('serene-cosmos', 'Accessories', 15, ['One Size'], ['Midnight']),
  P('serene-cosmos', 'Art Print', 25, ['12×16″', '18×24″']),
  // Sacred Geometry I
  P('sacred-geometry-i', 'Art Print', 28, ['12×16″', '18×24″', '24×36″']),
  P('sacred-geometry-i', 'Hoodie', 64, ['S', 'M', 'L', 'XL'], ['Deep Purple', 'Black']),
  P('sacred-geometry-i', 'Accessories', 18, ['One Size'], ['Champagne']),
  // Everyday favourites (gifts)
  P('golden-mandala-i', 'Accessories', 22, ['One Size'], ['Champagne', 'Black'], { gift: true }),
  P('lotus-within', 'Accessories', 26, ['One Size'], ['Plum', 'Rose'], { gift: true }),
  P('heart-of-calm', 'Home Decor', 40, ['One Size'], ['Teal', 'Black'], { gift: true }),
  P('aurora-mandala', 'T-Shirt', 28, ['XS', 'S', 'M', 'L', 'XL'], ['Teal', 'Indigo', 'Black'], { gift: true }),
  P('cosmic-bloom', 'Accessories', 28, ['One Size'], ['Champagne', 'Black'], { gift: true }),
  P('dancing-petals', 'Hoodie', 61, ['S', 'M', 'L', 'XL'], ['Rose', 'Black'], { gift: true }),
  P('path-of-light', 'Accessories', 24, ['One Size'], ['Sand', 'Black'], { gift: true })
];

/* ---------------- Collections ---------------- */
MM.collections = [
  { id: 'sacred-geometry', name: 'Sacred Geometry', artId: 'sacred-geometry-i', blurb: 'Ancient patterns, mathematical grace.', pal: ['#6b3fd4', '#1a1038'] },
  { id: 'cosmic-dreams', name: 'Cosmic Dreams', artId: 'inner-universe', blurb: 'Galaxies, starlight and the worlds within.', pal: ['#1e2b7a', '#0a1130'] },
  { id: 'nature-landscapes', name: 'Nature & Landscapes', artId: 'path-of-light', blurb: 'Digital landscapes drawn from wild places.', pal: ['#1f5a4e', '#0b221c'] },
  { id: 'peace-meditation', name: 'Peace & Meditation', artId: 'heart-of-calm', blurb: 'Artwork to breathe with.', pal: ['#1f8a7d', '#0b2e28'] },
  { id: 'colour-of-day', name: 'Colour of the Day', artId: 'violet-dawn', blurb: 'A new palette every sunrise.', pal: ['#7a3ff2', '#1c0d3e'] },
  { id: 'daily-mandalas', name: 'Daily Mandalas', artId: 'cosmic-bloom', blurb: 'Every single day, one new intention.', pal: ['#3b1f6e', '#120827'] },
  { id: 'best-sellers', name: 'Best Sellers', artId: 'golden-intention', blurb: 'The pieces the community loves most.', pal: ['#c98a3a', '#241607'] }
];

/* ---------------- Testimonials (placeholder — replace with real reviews later) ---------------- */
MM.testimonials = [
  { quote: "Every morning I open my inbox and today's mandala is waiting — it has quietly become the most beautiful part of my day.", name: 'Community Member', role: 'Daily Mandala subscriber' },
  { quote: "The Cosmic Bloom hoodie is stunning. The colours are richer in person and it arrived beautifully packaged.", name: 'Verified Buyer', role: 'Infinite Harmony Hoodie' },
  { quote: "You can feel the intention in every piece. This isn't merchandise — it's art that you can carry with you.", name: 'Collector', role: 'Art print collector' },
  { quote: "I bought a Sacred Sunrise canvas for my studio and it transformed the whole room. I immediately ordered a second one.", name: 'Verified Buyer', role: 'Canvas & Wall Art' }
];

/* ---------------- Helpers ---------------- */
MM.c = {
  gold: '#d4af37',
  goldLight: '#e8c877',
  goldPale: '#f7e6b5',
  white: '#f7f3ff'
};

MM.findArt = id => MM.artworks.find(a => a.id === id);
MM.findProduct = id => MM.products.find(p => p.id === id);

MM.artPrice = (price) => MM.config.currency + price.toFixed(2);

MM.artworkSVG = function (id) {
  let art = MM.findArt(id);
  if (!art) return '';
  return svArtHalo(id, art.palette, art.style);
};

MM.arrowSVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

MM.quoteSVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6.5 7C4.6 8.6 3 10.9 3 13.6V19h6v-6H6c0-1.9.9-3.2 2.2-4.2L6.5 7zm11 0c-1.9 1.6-3.5 3.9-3.5 6.6V19h6v-6h-3c0-1.9.9-3.2 2.2-4.2L17.5 7z"/></svg>`;