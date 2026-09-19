const express = require('express');
const path = require('path');
const fs = require('fs');
const artRepo = require('../repos/artworks');
const prodRepo = require('../repos/products');
const colRepo = require('../repos/collections');
const wishRepo = require('../repos/wishlists');
const cartRepo = require('../repos/cart');
const usersRepo = require('../repos/users');
const { issueCsrf } = require('../middleware/security');

const router = express.Router();

router.get('/session', (req, res) => {
  if (!req.session.csrf) req.session.csrf = require('crypto').randomBytes(24).toString('hex');
  const payload = { authenticated: !!req.session.userId, csrf: req.session.csrf };
  if (req.session.userId) {
    const u = usersRepo.findById(req.session.userId);
    if (u) { payload.id = u.id; payload.name = u.name; payload.email = u.email; payload.role = u.role; }
    else { payload.authenticated = false; req.session.userId = undefined; req.session.role = undefined; }
  }
  res.json(payload);
});

// Public artwork catalog
router.get('/artworks', (req, res) => {
  const { search, category, featured, daily, page = 1, limit = 24 } = req.query;
  const result = artRepo.findAll({ search, category, status: 'published', featured: featured || undefined, daily: daily || undefined, page: +page, limit: +limit });
  res.json(result);
});

router.get('/artworks/featured', (req, res) => {
  res.json(artRepo.findAll({ featured: true, status: 'published', limit: 8 }).items);
});

router.get('/artworks/daily', (req, res) => {
  const a = artRepo.webDaily() || artRepo.dailyMandala();
  if (!a) return res.status(404).json({ error: 'No daily mandala set yet' });
  a.products = prodRepo.findByArtwork(a.id).items;
  res.json(a);
});

router.get('/artworks/:slug', (req, res) => {
  const a = artRepo.findBySlug(req.params.slug);
  if (!a) return res.status(404).json({ error: 'Artwork not found' });
  a.products = prodRepo.findByArtwork(a.id).items;
  a.productCount = a.products.length;
  a.related = artRepo.findAll({ category: a.category, status: 'published', limit: 4 }).items.filter(x => x.id !== a.id).slice(0, 3);
  res.json(a);
});

// Public product catalog
router.get('/products', (req, res) => {
  const { search, category, type, featured, sort, page = 1, limit = 24 } = req.query;
  const result = prodRepo.findAll({ search, category, type, featured: featured || undefined, status: 'published', page: +page, limit: +limit });
  const ids = result.items.map(p => p.id);
  const byProd = {};
  for (const v of prodRepo.variantsFor(ids)) (byProd[v.product_id] = byProd[v.product_id] || []).push(v);
  result.items.forEach(p => { p.variants = byProd[p.id] || []; });
  res.json(result);
});

router.get('/products/:slug', (req, res) => {
  const p = prodRepo.findBySlug(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  p.variants = prodRepo.variants(p.id);
  p.artworks = prodRepo.artworks(p.id);
  res.json(p);
});

// Collections
router.get('/collections', (req, res) => {
  res.json(colRepo.findAll().map(c => {
    const items = colRepo.items(c.id);
    const artId = (items.artworks[0] && items.artworks[0].slug) || '';
    return { ...c, artId, members: items.artworks.map(a => a.slug), itemCount: items.artworks.length };
  }));
});
router.get('/collections/:slug', (req, res) => {
  const c = colRepo.findBySlug(req.params.slug);
  if (!c) return res.status(404).json({ error: 'Collection not found' });
  res.json({ ...c, items: colRepo.items(c.id) });
});

// Search across artworks, products, collections
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ artworks: [], products: [], collections: [] });
  const artworks = artRepo.findAll({ search: q, status: 'published', limit: 8 }).items;
  const products = prodRepo.findAll({ search: q, status: 'published', limit: 8 }).items;
  const collections = colRepo.findAll().filter(c => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
  res.json({ artworks, products, collections });
});

// Cart (guest + logged-in)
router.get('/cart', (req, res) => {
  const sessionId = req.cookies.mm_cart || '';
  const userId = req.session.userId || null;
  const items = cartRepo.getCart(sessionId, userId);
  res.json({ items, count: cartRepo.count(sessionId, userId) });
});

router.post('/cart', (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });
  let sessionId = req.cookies.mm_cart;
  if (!sessionId) {
    sessionId = require('crypto').randomBytes(16).toString('hex');
    res.cookie('mm_cart', sessionId, { maxAge: 90 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
  }
  cartRepo.addItem(sessionId, req.session.userId || null, productId, variantId, +quantity);
  const items = cartRepo.getCart(sessionId, req.session.userId || null);
  res.json({ items, count: cartRepo.count(sessionId, req.session.userId || null) });
});

router.patch('/cart/:id', (req, res) => {
  const { quantity } = req.body;
  cartRepo.updateQty(+req.params.id, +quantity);
  res.json({ ok: true });
});

router.delete('/cart/:id', (req, res) => {
  cartRepo.removeItem(+req.params.id);
  res.json({ ok: true });
});

// Wishlist (protected)
router.get('/wishlist', require('../middleware/auth').requireAuth, (req, res) => res.json(wishRepo.items(req.session.userId)));
router.post('/wishlist', require('../middleware/auth').requireAuth, (req, res) => {
  const { itemId, itemType } = req.body;
  wishRepo.add(req.session.userId, itemId, itemType || 'product');
  res.json({ ok: true });
});
router.delete('/wishlist/:id', require('../middleware/auth').requireAuth, (req, res) => {
  wishRepo.remove(req.session.userId, +req.params.id);
  res.json({ ok: true });
});

// Homepage hero images. The studio drops hero1..heroN into assets/uploads/hero
// and they show up automatically — the storefront never probes missing files.
router.get('/heroes', (req, res) => {
  const dir = path.join(__dirname, '..', '..', 'assets', 'uploads', 'hero');
  const urls = [];
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).sort((a, b) => {
      const na = parseInt(a.match(/\d+/), 10) || 0;
      const nb = parseInt(b.match(/\d+/), 10) || 0;
      return na - nb;
    });
    for (const f of files) {
      if (/\.(jpe?g|png|webp)$/i.test(f)) urls.push('/assets/uploads/hero/' + f);
      if (urls.length === 6) break;
    }
  }
  res.json({ items: urls });
});

module.exports = router;