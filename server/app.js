const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');
const { getDb } = require('./db');
const { csrf, issueCsrf } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/error');
const analyticsMw = require('./services/analytics');
const analyticsRepo = require('./repos/analytics');

const publicRoutes = require('./routes/public');
const accountRoutes = require('./routes/account');
const checkoutRoutes = require('./routes/checkout');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const artRepo = require('./repos/artworks');
const prodRepo = require('./repos/products');
const colRepo = require('./repos/collections');

// SQLite session store so sessions survive restarts (dev + Hostinger shared).
const SQLiteStore = require('better-sqlite3-session-store')(session);

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use(session({
    store: new SQLiteStore({ client: getDb(), expired: { clear: true, intervalMs: 60 * 60 * 1000 } }),
    name: 'mm.sid',
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: config.session.maxAge,
      sameSite: 'lax',
      // 'auto' sets Secure only over HTTPS — the studio keeps working on
      // plain HTTP (dev / Hostinger staging) without dropping the session.
      secure: 'auto',
    },
  }));

  const limiter = rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
  app.use('/api', limiter);
  app.use('/api/auth', authLimiter);

  // Track page views for analytics (storefront pages only).
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/account') || req.path.startsWith('/assets')) return next();
    try {
      const url = req.path;
      let type = '', id = '';
      if (url === '/') type = 'home';
      else if (url.startsWith('/shop')) type = 'shop';
      else if (url.startsWith('/gallery')) type = 'gallery';
      else if (url.startsWith('/daily')) type = 'daily';
      else if (url.startsWith('/collections')) type = 'collections';
      else { const m = url.match(/^\/(artwork|collection)\/([^/]+)/); if (m) { type = m[1]; id = decodeURIComponent(m[2]); } }
      analyticsRepo.trackPageView({ pageType: type, pageId: id, url, userAgent: req.headers['user-agent'] || '', ip: req.ip, userId: req.session ? req.session.userId : null });
    } catch (e) { /* never block on analytics */ }
    next();
  });

  const ROOT = path.join(__dirname, '..');

  // SEO-safe server-rendered artwork + product pages.
  app.get('/artwork/:slug', (req, res) => {
    const art = artRepo.findBySlug(req.params.slug);
    if (!art || art.status !== 'published') return res.status(404).send(render404());
    art.products = prodRepo.findByArtwork(art.id);
    res.send(renderArtwork(art, config.site));
  });
  app.get('/shop/:slug', (req, res) => {
    const p = prodRepo.findBySlug(req.params.slug);
    if (!p || p.status !== 'published') return res.status(404).send(render404());
    res.send(renderProduct(p, config.site));
  });
  app.get('/collection/:slug', (req, res) => {
    const c = colRepo.findBySlug(req.params.slug);
    if (!c) return res.status(404).send(render404());
    res.send(renderCollection(c, colRepo.items(c.id), config.site));
  });

  // React SPA build (Vite → dist/). Served for the storefront shell routes so the
  // SPA owns them; legacy root .html files, /assets and panels still resolve below.
  const DIST = path.join(ROOT, 'dist');
  app.use(express.static(DIST, { index: 'index.html', maxAge: config.isDev ? 0 : '1y' }));
  const SPA_PATHS = ['/', '/index', '/gallery', '/shop', '/daily', '/about', '/collections', '/order', '/checkout', '/contact'];
  app.use((req, res, next) => {
    if (req.method !== 'GET' || !req.accepts('html')) return next();
    const p = req.path;
    if (/\.\w+$/.test(p)) return next();
    const isSpaRoute = SPA_PATHS.includes(p) || /^\/product\/[^/]+$/.test(p);
    if (isSpaRoute) return res.sendFile(path.join(DIST, 'index.html'));
    next();
  });

  // Legacy root static (assets, uploads, legacy .html pages, admin/account panels).
  app.use(express.static(ROOT, { extensions: ['html'], maxAge: config.isDev ? 0 : '1h' }));

  app.use('/api', (req, res, next) => { if (!req.session.csrf) issueCsrf(req); next(); });
  app.use('/api/auth', accountRoutes);
  // Account panel routes (same protected router, mounted at /api/account).
  app.use('/api/account', accountRoutes);
  // Provider webhooks arrive server-to-server with their own signature checks,
  // never from the browser — mounted before CSRF.
  app.use('/api/webhooks', checkoutRoutes.webhookRouter);
  app.use('/api', csrf);
  app.use('/api/public', publicRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/store', checkoutRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', notFound);

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return notFound(req, res);
    res.status(404).send(render404());
  });
  app.use(errorHandler);

  return app;
}

function page(site, title, ogImage, body, desc, url, ogType) {
  const css = site.url + '/assets/css/style.css';
  const canonical = url ? `<link rel="canonical" href="${url}"><meta property="og:url" content="${url}">` : '';
  return `<!doctype html><html lang="en" data-theme="dark"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | ${site.name}</title>
${desc ? `<meta name="description" content="${esc(desc)}">` : ''}
<meta property="og:type" content="${ogType || 'website'}"><meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${title} | ${site.name}"><meta property="og:image" content="${ogImage}">
${canonical}<link rel="stylesheet" href="${css}">
<style>${ssrCss()}</style></head><body class="ssr">${nav(site)}${body}<script>window.MM_SITE='${site.url}';</script></body></html>`;
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function nav(site) {
  const brandIcon = site.url + '/assets/img/navlogo.png';
  return `<header class="nav"><div class="nav-inner"><a class="nav-logo" href="/">
<img class="nav-logo-mark" src="${brandIcon}" alt="Mandala Magic by OM">
</a>
<nav class="nav-links" aria-label="Primary"><a href="/">Home</a><a href="/gallery">Art Gallery</a><a href="/shop">Shop</a><a href="/daily">Daily Mandala</a><a href="/collections">Collections</a></nav>
<a class="btn btn-sm" href="/shop">Shop the Art</a></div></header>`;
}

function renderArtwork(art, site) {
  const url = site.url + '/artwork/' + art.slug;
  const share = `<div class="ssr-share">
    <a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}">Facebook</a>
    <a target="_blank" rel="noopener" href="https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}">Pinterest</a>
    <a target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(art.title)}">X</a>
    <a href="mailto:?subject=${encodeURIComponent(art.title)}&body=${encodeURIComponent(url)}">Email</a>
    <span class="copy" onclick="navigator.clipboard.writeText('${url}')">Copy Link</span></div>`;
  const grid = (art.products && art.products.length) ? art.products.map(p => `
    <a class="ssr-prod" href="/shop/${p.slug}">
      <div class="ssr-psw"><img src="${p.image_url || art.image_url || ''}" alt="${esc(p.title)}"></div>
      <div>${esc(p.title)}</div>
      <div class="ssr-price">$${p.sale_price != null ? p.sale_price : p.price}</div>
    </a>`).join('') : `<p class="ssr-none">Products for this artwork are being prepared.</p>`;
  const body = `<section class="ssr-hero" style="background:radial-gradient(circle at 50% 0%, ${art.palette ? JSON.parse(art.palette)[1] || '#241245' : '#241245'} 0%, #0a0618 60%)">
  <div class="ssr-wrap">
    <div class="ssr-art"><img src="${art.image_url || ''}" alt="${esc(art.title)}"></div>
    <div class="ssr-meta"><span class="eyebrow">${esc(art.category)} · ${esc(art.artwork_date)}</span>
    <h1>${esc(art.title)}</h1>
    ${art.is_daily_mandala ? '<p class="ssr-daily">✦ Today\'s Mandala</p>' : ''}
    <p class="ssr-int">${esc(art.intention)}</p>
    ${art.description ? `<p>${esc(art.description)}</p>` : ''}
    ${art.artist_note ? `<blockquote class="ssr-note">${esc(art.artist_note)}</blockquote>` : ''}
    ${share}</div>
  </div></section>
  <section class="ssr-shop"><div class="ssr-wrap"><h2>LOVE THIS ARTWORK? Available on</h2><div class="ssr-grid">${grid}</div></div></section>`;
  return page(site, art.title, art.image_url || '', body, art.intention, url);
}

function renderProduct(p, site) {
  const url = site.url + '/shop/' + p.slug;
  const body = `<section class="ssr-hero"><div class="ssr-wrap">
    <div class="ssr-art"><img src="${p.image_url || ''}" alt="${esc(p.title)}"></div>
    <div class="ssr-meta"><span class="eyebrow">Made to order</span><h1>${esc(p.title)}</h1>
    <p class="ssr-price ssr-price-lg">$${p.sale_price != null ? p.sale_price : p.price}</p>
    <p>${esc(p.description)}</p><p class="ssr-note">Printed and fulfilled through our print-on-demand partner.</p>
    <a class="btn" href="/checkout">Add to Cart</a></div></div></section>`;
  return page(site, p.title, p.image_url || '', body, 'Made to order — printed and fulfilled through our print-on-demand partner.', url, 'product');
}

function renderCollection(c, items, site) {
  const grid = items.products.map(p => `<a class="ssr-prod" href="/shop/${p.slug}"><img src="${p.image_url || c.cover_image_url || ''}"><div>${esc(p.title)}</div><div class="ssr-price">$${p.price}</div></a>`).join('') || '<p class="ssr-none">Collection is being curated.</p>';
  const body = `<section class="ssr-hero"><div class="ssr-wrap"><div class="ssr-meta"><h1>${esc(c.name)}</h1><p>${esc(c.description)}</p></div></div></section>
  <section class="ssr-shop"><div class="ssr-wrap"><div class="ssr-grid">${grid}</div></div></section>`;
  const url = site.url + '/collections/' + c.slug;
  return page(site, c.name, c.cover_image_url || '', body, c.seo_description || c.description, url);
}

function render404() {
  return `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>404 — Lost Among the Stars | Mandala Magic by OM</title><meta property="og:title" content="404 — Lost Among the Stars | Mandala Magic by OM">
  <meta name="robots" content="noindex"><link rel="stylesheet" href="/assets/css/style.css"></head>
  <body class="ssr">
  <div class="lost-scene" role="main" aria-labelledby="lost-title">
    <span class="lost-orb l1" aria-hidden="true"></span>
    <span class="lost-orb l2" aria-hidden="true"></span>
    <span class="lost-orb l3" aria-hidden="true"></span>
    <span class="lost-twinkle" aria-hidden="true"></span>
    <span class="lost-twinkle" aria-hidden="true"></span>
    <span class="lost-twinkle" aria-hidden="true"></span>
    <span class="lost-twinkle" aria-hidden="true"></span>
    <span class="lost-twinkle" aria-hidden="true"></span>
    <div style="position:relative;z-index:1">
      <div class="lost-mandala" aria-hidden="true"></div>
      <div class="lost-code">404</div>
      <h1 class="lost-title" id="lost-title">Lost Among the Stars?</h1>
      <p class="lost-copy">The page you reached has drifted off into the cosmos. No worries — every journey just takes a small step back. Breathe, and find your way home.</p>
      <div class="lost-actions">
        <a class="btn btn-gold" href="/">Return Home</a>
        <a class="btn btn-ghost" href="/gallery">Explore the Art</a>
      </div>
    </div>
  </div></body></html>`;
}

function ssrCss() {
  return `
  body.ssr{background:#0a0618;color:#f6f1e7;font-family:Arial,'Segoe UI',sans-serif;margin:0}
  .ssr .nav{background:rgba(10,6,24,.85);border-bottom:1px solid rgba(212,175,55,.15);padding:14px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;backdrop-filter:blur(12px)}
  .ssr .nav-inner{display:flex;align-items:center;gap:20px}
  .ssr .nav-logo{display:flex;align-items:center;gap:12px;text-decoration:none;color:#f6f1e7}
  .ssr .nav-logo-mark{width:auto;height:auto;max-width:100%;max-height:56px;object-fit:contain}
  .ssr .nav-logo-word{font-family:'Arial Black',Arial,sans-serif;font-size:.72rem;letter-spacing:.3em;font-weight:700}
  .ssr .nav-logo-word small{display:block;color:#d4af37;font-size:.5rem;letter-spacing:.45em;margin-top:2px}
  .ssr .nav-links a{color:#cfc9e8;text-decoration:none;margin-right:18px;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase}
  .ssr .nav-links a:hover{color:#d4af37}
  .ssr .btn{display:inline-block;background:#d4af37;color:#0a0618!important;text-decoration:none;font-weight:700;font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;padding:12px 22px;border-radius:999px}
  .ssr-hero{padding:60px 24px}
  .ssr-wrap{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
  .ssr-art img{width:100%;border-radius:20px;border:1px solid rgba(212,175,55,.25);box-shadow:0 24px 80px rgba(2,0,12,.8)}
  .ssr-meta h1{font-family:'Arial Black',Arial,sans-serif;font-size:clamp(2rem,5vw,3.4rem);margin:12px 0;line-height:1.05}
  .ssr-int{font-size:1.2rem;color:#d4af37;font-style:italic}
  .ssr-note{border-left:3px solid #d4af37;padding-left:16px;color:#b9b2d4}
  .ssr-daily{color:#d4af37;letter-spacing:.3em;text-transform:uppercase;font-size:.8rem}
  .ssr-share{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}
  .ssr-share a,.ssr-share .copy{cursor:pointer;color:#cfc9e8;border:1px solid rgba(212,175,55,.3);border-radius:999px;padding:6px 14px;font-size:.78rem;text-decoration:none}
  .ssr-shop{padding:60px 24px;background:linear-gradient(180deg,transparent,rgba(30,16,70,.4))}
  .ssr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:24px}
  .ssr-prod{padding:14px;border:1px solid rgba(212,175,55,.16);border-radius:16px;background:rgba(16,9,36,.6);text-decoration:none;color:#f6f1e7;transition:.2s}
  .ssr-prod:hover{border-color:rgba(212,175,55,.45);transform:translateY(-4px)}
  .ssr-prod img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px}
  .ssr-psw{aspect-ratio:1;background:rgba(122,63,242,.12);border-radius:10px;display:grid;place-items:center;margin-bottom:10px}
  .ssr-psw img{width:100%;aspect-ratio:1;object-fit:cover}
  .ssr-price{color:#d4af37;font-weight:700}
  .ssr-price-lg{font-size:1.6rem}
  .ssr-none{color:#8a84a8;font-style:italic}
  @media(max-width:820px){.ssr-wrap{grid-template-columns:1fr}}
  `;
}

module.exports = { createApp, renderArtwork };