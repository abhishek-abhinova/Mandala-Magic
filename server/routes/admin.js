const express = require('express');
const artRepo = require('../repos/artworks');
const prodRepo = require('../repos/products');
const colRepo = require('../repos/collections');
const ordersRepo = require('../repos/orders');
const usersRepo = require('../repos/users');
const settingsRepo = require('../repos/settings');
const analyticsRepo = require('../repos/analytics');
const yoycol = require('../services/yoycol');
const audit = require('../services/audit');
const { requireRole, requireAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/error');
const { query, queryOne, run } = require('../db');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

// Dashboard overview
router.get('/dashboard', (req, res) => {
  const db = require('../db');
  res.json({
    orders: ordersRepo.stats(),
    products: prodRepo.count(),
    artworks: artRepo.count(),
    customers: usersRepo.count(),
    revenue: ordersRepo.revenue(),
    avgOrderValue: ordersRepo.stats().avgOrderValue,
    dailyMandala: artRepo.dailyMandala(),
    recent: ordersRepo.recent(8),
    topProducts: (() => {
      const rows = db.query('SELECT p.title, p.slug, SUM(oi.quantity) as sold FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY p.id ORDER BY sold DESC LIMIT 5');
      return rows;
    })(),
    views: analyticsRepo.totalViews(),
    events: analyticsRepo.totalEvents(),
    yoycol: yoycol.status(),
  });
});

// ---- Artwork management ----
router.get('/artworks', (req, res) => {
  const { search, category, status, featured, daily, page = 1, limit = 50 } = req.query;
  const result = artRepo.findAll({
    search, category, status: status || undefined,
    featured: featured !== undefined ? featured === '1' : undefined,
    daily: daily !== undefined ? daily === '1' : undefined,
    page: +page, limit: +limit,
  });
  result.items = result.items.map(a => ({ ...a, productCount: artRepo.productCount(a.id) }));
  res.json(result);
});

router.get('/artworks/:id', (req, res) => {
  const a = artRepo.findById(+req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.products = prodRepo.findByArtwork(a.id).items;
  res.json(a);
});

router.post('/artworks', (req, res, next) => {
  try {
    const d = req.body;
    if (!d.title) return res.status(400).json({ error: 'Title is required' });
    const info = artRepo.create(d);
    audit.log(req.session.userId, 'artwork_create', 'artwork', info.lastID, { title: d.title });
    const a = artRepo.findById(info.lastID);
    a.products = prodRepo.findByArtwork(a.id).items;
    res.json(a);
  } catch (e) { next(e); }
});

router.put('/artworks/:id', (req, res, next) => {
  try {
    const id = +req.params.id;
    const body = { ...req.body };
    delete body.products;
    artRepo.update(id, body);
    audit.log(req.session.userId, 'artwork_update', 'artwork', id, body);
    const a = artRepo.findById(id);
    a.products = prodRepo.findByArtwork(a.id).items;
    res.json(a);
  } catch (e) { next(e); }
});

router.delete('/artworks/:id', (req, res, next) => {
  try {
    artRepo.remove(+req.params.id);
    audit.log(req.session.userId, 'artwork_delete', 'artwork', +req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/artworks/:id/toggle-feature', (req, res) => {
  const a = artRepo.findById(+req.params.id);
  artRepo.update(a.id, { is_featured: a.is_featured ? 0 : 1 });
  res.json({ ok: true });
});

// Set an artwork as Today's Mandala + publish it.
router.post('/artworks/:id/daily', (req, res, next) => {
  try {
    artRepo.setDaily(+req.params.id);
    artRepo.update(+req.params.id, { status: 'published' });
    audit.log(req.session.userId, 'set_daily_mandala', 'artwork', +req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Link products to an artwork (one artwork → many products).
router.put('/artworks/:id/link-products', (req, res, next) => {
  try {
    const { productIds = [] } = req.body;
    run('DELETE FROM product_artwork_links WHERE artwork_id = ?', [+req.params.id]);
    for (const pid of [...new Set(productIds.map(Number).filter(Boolean))]) {
      run('INSERT OR IGNORE INTO product_artwork_links (artwork_id, product_id) VALUES (?,?)', [+req.params.id, pid]);
    }
    audit.log(req.session.userId, 'artwork_link_products', 'artwork', +req.params.id, { productIds });
    const a = artRepo.findById(+req.params.id);
    a.products = prodRepo.findByArtwork(a.id).items;
    res.json({ ok: true, products: a.products });
  } catch (e) { next(e); }
});

// Link artwork(s) to a product.
router.put('/products/:id/link-artworks', (req, res, next) => {
  try {
    const { artworkIds = [] } = req.body;
    run('DELETE FROM product_artwork_links WHERE product_id = ?', [+req.params.id]);
    for (const aid of [...new Set(artworkIds.map(Number).filter(Boolean))]) {
      run('INSERT OR IGNORE INTO product_artwork_links (product_id, artwork_id) VALUES (?,?)', [+req.params.id, aid]);
    }
    audit.log(req.session.userId, 'product_link_artworks', 'product', +req.params.id, { artworkIds });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Product management ----
router.get('/products', (req, res) => {
  const { search, status, workflow, page = 1, limit = 50 } = req.query;
  const result = prodRepo.findAll({ search, status: status || undefined, workflow: workflow || undefined, page: +page, limit: +limit });
  result.items = result.items.map(p => ({ ...p, variants: prodRepo.variants(p.id) }));
  res.json(result);
});

router.post('/products', (req, res, next) => {
  try {
    const d = req.body;
    if (!d.title || d.price == null) return res.status(400).json({ error: 'Title and price are required' });
    const info = prodRepo.create(d);
    if (Array.isArray(d.variants)) for (const v of d.variants) prodRepo.addVariant({ product_id: info.lastID, ...v });
    audit.log(req.session.userId, 'product_create', 'product', info.lastID, { title: d.title });
    res.json(prodRepo.findById(info.lastID));
  } catch (e) { next(e); }
});

router.put('/products/:id', (req, res, next) => {
  try {
    const id = +req.params.id;
    const body = { ...req.body };
    delete body.variants;
    prodRepo.update(id, body);
    if (Array.isArray(req.body.variants)) prodRepo.setVariants(id, req.body.variants);
    audit.log(req.session.userId, 'product_update', 'product', id, body);
    const p = prodRepo.findById(id);
    p.artworks = prodRepo.artworks(id);
    res.json(p);
  } catch (e) { next(e); }
});

router.delete('/products/:id', (req, res, next) => {
  try {
    prodRepo.remove(+req.params.id);
    audit.log(req.session.userId, 'product_delete', 'product', +req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/products/:id/duplicate', (req, res, next) => {
  try {
    const copy = prodRepo.duplicate(+req.params.id);
    if (!copy) return res.status(404).json({ error: 'Product not found' });
    audit.log(req.session.userId, 'product_duplicate', 'product', copy.id, { from: +req.params.id });
    res.json(copy);
  } catch (e) { next(e); }
});

// Publish a reviewed product to Yoycol (creates/updates the self-store mapping).
router.post('/products/:id/publish-to-yoycol', asyncHandler(async (req, res) => {
  const product = prodRepo.findById(+req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const artworks = prodRepo.artworks(product.id);
  const variants = prodRepo.variants(product.id);
  if (!artworks.length) return res.status(400).json({ error: 'Connect an artwork before publishing to Yoycol' });
  if (!variants.some(v => v.yoycol_sku_code)) return res.status(400).json({ error: 'Map Yoycol SKUs to at least one variant before publishing' });
  const result = await yoycol.publishProductToYoycol(product, artworks[0], variants);
  audit.log(req.session.userId, 'product_publish_yoycol', 'product', product.id, { mappingId: result.mappingId });
  res.json({ ok: true, ...result });
}));

// Import products from the Yoycol catalog as drafts.
router.post('/products/import-yoycol', asyncHandler(async (req, res) => {
  const { keyword, page = 1, size = 20 } = req.body || {};
  const result = await yoycol.importCatalogProducts({ keyword, page, size });
  audit.log(req.session.userId, 'product_import_yoycol', 'yoycol', 0, { created: result.created });
  res.json(result);
}));

// Review endpoint: enrich an imported product with Yoycol variants + base cost.
router.post('/products/:id/fetch-yoycol', asyncHandler(async (req, res) => {
  const product = prodRepo.findById(+req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const detail = await yoycol.fetchCatalogProductDetail(product.yoycol_product_id);
  const variants = await yoycol.fetchCatalogProductVariants(product.yoycol_product_id);
  const mapped = (variants || []).map(v => ({
    size: v.size || '',
    color: v.color || '',
    price: v.salesPrice,
    external_variant_id: String(v.id),
    yoycol_sku_code: v.skuCode || '',
  }));
  const base = (variants || []).reduce((s, v) => s + (v.salesPrice || 0), 0) / Math.max(1, (variants || []).length);
  res.json({ detail, baseCost: Math.round(base * 100) / 100, baseCurrency: ((variants && variants[0] && variants[0].currency) || 'USD'), variants: mapped });
}));

// ---- Yoycol integration ----
router.get('/yoycol', (req, res) => res.json(yoycol.status()));
router.get('/yoycol/credentials', (req, res) => {
  const c = yoycol.creds();
  res.json({
    hasKey: Boolean(c.apiKey),
    hasSecret: Boolean(c.apiSecret),
    baseUrl: c.baseUrl,
    keyConfiguredInEnv: Boolean(process.env.YOYCOL_API_KEY),
    secretConfiguredInEnv: Boolean(process.env.YOYCOL_API_SECRET),
  });
});

// Save credentials. Secrets stored encrypted; env vars always take precedence.
router.put('/yoycol/credentials', (req, res, next) => {
  try {
    const { apiKey, apiSecret, baseUrl } = req.body || {};
    if (apiKey) settingsRepo.setSecret('yoycol_api_key', apiKey);
    if (apiSecret) settingsRepo.setSecret('yoycol_api_secret', apiSecret);
    if (baseUrl !== undefined && baseUrl !== '') settingsRepo.set('yoycol_api_base_url', baseUrl);
    audit.log(req.session.userId, 'yoycol_credentials_update', 'yoycol', 0);
    res.json({ ok: true, hasKey: Boolean(settingsRepo.getSecret('yoycol_api_key') || process.env.YOYCOL_API_KEY), hasSecret: Boolean(settingsRepo.getSecret('yoycol_api_secret') || process.env.YOYCOL_API_SECRET) });
  } catch (e) { next(e); }
});

router.post('/yoycol/test', asyncHandler(async (req, res) => {
  const r = await yoycol.testConnection();
  audit.log(req.session.userId, 'yoycol_test', 'yoycol', 0, { ok: r.ok });
  res.json(r);
}));

router.get('/yoycol/catalog', asyncHandler(async (req, res) => {
  const { query: kw, page = 1, size = 20 } = req.query;
  const r = await yoycol.fetchCatalogProducts({ query: kw, page: +page, size: +size });
  res.json(r);
}));

router.get('/yoycol/catalog/:id', asyncHandler(async (req, res) => {
  const detail = await yoycol.fetchCatalogProductDetail(req.params.id);
  const variants = await yoycol.fetchCatalogProductVariants(req.params.id);
  res.json({ ...detail, variants });
}));

router.get('/yoycol/mappings', asyncHandler(async (req, res) => {
  const { keyword, page = 1, size = 20 } = req.query;
  const r = await yoycol.listSelfStoreProducts({ keyword, page: +page, size: +size });
  res.json(r);
}));

router.post('/yoycol/sync', asyncHandler(async (req, res) => {
  const { scope = 'products', keyword, page = 1, size = 20 } = req.body || {};
  let result;
  if (scope === 'orders') result = await yoycol.pullOrderStatuses({ page, size });
  else result = await yoycol.importCatalogProducts({ keyword, page, size });
  audit.log(req.session.userId, 'yoycol_sync', 'yoycol', 0, { scope });
  res.json(result);
}));

router.get('/yoycol/logs', (req, res) => {
  const { type, status, limit = 25 } = req.query;
  res.json(yoycol.recentLogs({ type: type || undefined, status: status || undefined, limit: +limit }));
});

// Retry a recoverable operation (order submit / import).
router.post('/yoycol/retry', asyncHandler(async (req, res) => {
  const { type, id } = req.body || {};
  if (type === 'order' && id) {
    const order = ordersRepo.findById(+id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const items = ordersRepo.items(order.id);
    const result = await yoycol.submitOrder(order, items);
    audit.log(req.session.userId, 'yoycol_retry_order', 'order', order.id);
    return res.json({ ok: true, ...result });
  }
  if (type === 'product' && id) {
    const product = prodRepo.findById(+id);
    if (!product || !product.yoycol_product_id) return res.status(400).json({ error: 'No Yoycol product reference' });
    const result = await yoycol.importCatalogProducts({ keyword: '', page: 1, size: 1 });
    audit.log(req.session.userId, 'yoycol_retry_product', 'product', +id);
    return res.json({ ok: true, ...result });
  }
  res.status(400).json({ error: 'Unknown retry target' });
}));

// ---- Orders ----
router.get('/orders', (req, res) => {
  const { status, search, page = 1, limit = 50 } = req.query;
  const result = ordersRepo.findAll({ status: status || undefined, search, page: +page, limit: +limit });
  res.json(result);
});

router.get('/orders/:number', (req, res) => {
  const o = ordersRepo.findByNumber(req.params.number);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  o.items = ordersRepo.items(o.id);
  res.json(o);
});

router.put('/orders/:number', asyncHandler(async (req, res) => {
  const o = ordersRepo.findByNumber(req.params.number);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  const { status, tracking_number, carrier } = req.body;
  if (status) ordersRepo.updateStatus(o.id, status);
  ordersRepo.updateFulfillment(o.id, { trackingNumber: tracking_number, carrier });
  if (status === 'shipped' && tracking_number) require('../services/email').orderShipped(o).catch(() => {});
  audit.log(req.session.userId, 'order_update', 'order', o.id, { status, tracking_number });
  res.json(ordersRepo.findByNumber(req.params.number));
}));

// Submit (or resubmit) an order to Yoycol.
router.post('/orders/:number/submit-yoycol', asyncHandler(async (req, res) => {
  const o = ordersRepo.findByNumber(req.params.number);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  const items = ordersRepo.items(o.id);
  const result = await yoycol.submitOrder(o, items);
  audit.log(req.session.userId, 'order_submit_yoycol', 'order', o.id);
  res.json({ ok: true, ...result });
}));

// Manual fulfillment fallback (used when Yoycol is unavailable / not configured).
router.post('/orders/:number/manual-fulfill', asyncHandler(async (req, res) => {
  const o = ordersRepo.findByNumber(req.params.number);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  const { status = 'processing', tracking_number, carrier } = req.body;
  ordersRepo.updateStatus(o.id, status);
  ordersRepo.updateFulfillment(o.id, { status: status === 'shipped' ? 'shipped' : 'fulfilled', trackingNumber: tracking_number, carrier });
  audit.log(req.session.userId, 'order_manual_fulfill', 'order', o.id, { status, tracking_number });
  res.json(ordersRepo.findByNumber(req.params.number));
}));

// Pull the freshest tracking + timeline from Yoycol for a single order.
router.post('/orders/:number/refresh-tracking', asyncHandler(async (req, res) => {
  const o = ordersRepo.findByNumber(req.params.number);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  if (!o.yoycol_order_id) return res.status(400).json({ error: 'Order has not been submitted to Yoycol' });
  const r = await yoycol.refreshOrderTracking(o.id);
  res.json({ ok: true, ...r, order: ordersRepo.findByNumber(req.params.number) });
}));

// ---- Customers ----
router.get('/customers', (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  const result = usersRepo.findAll({ search, role: 'customer', page: +page, limit: +limit });
  const db = require('../db');
  result.items = result.items.map(u => ({
    ...u,
    orderCount: db.queryOne('SELECT COUNT(*) as n FROM orders WHERE user_id = ?', [u.id]).n,
    spent: db.queryOne("SELECT COALESCE(SUM(total),0) as n FROM orders WHERE user_id = ? AND payment_status = 'paid'", [u.id]).n || 0,
  }));
  res.json(result);
});

// ---- Contact messages ----
router.get('/contact', (req, res) => {
  res.json({
    items: query('SELECT id, name, email, subject, message, replied, created_at FROM contact_messages ORDER BY id DESC'),
    unread: queryOne("SELECT COUNT(*) as n FROM contact_messages WHERE replied = 0").n,
  });
});
router.post('/contact/:id/replied', (req, res) => {
  run('UPDATE contact_messages SET replied = ? WHERE id = ?', [req.body && req.body.replied ? 1 : 0, req.params.id]);
  res.json({ ok: true });
});

// ---- Analytics ----
router.get('/analytics', (req, res) => {
  res.json({
    views: analyticsRepo.totalViews(),
    events: analyticsRepo.totalEvents(),
    topPages: analyticsRepo.topPages(10),
    daily: analyticsRepo.dailyViews(14),
    eventsList: analyticsRepo.recentEvents(25),
    audit: audit.recent(25),
  });
});

// ---- Settings ----
router.get('/settings', (req, res) => res.json(settingsRepo.getAll()));
router.put('/settings', (req, res, next) => {
  try {
    const { apiKey, apiSecret, ...rest } = req.body || {};
    settingsRepo.setMany(rest);
    if (apiKey) settingsRepo.setSecret('yoycol_api_key', apiKey);
    if (apiSecret) settingsRepo.setSecret('yoycol_api_secret', apiSecret);
    audit.log(req.session.userId, 'settings_update', 'settings');
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Uploads ----
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = '/assets/uploads/' + req.file.filename;
  audit.log(req.session.userId, 'upload', 'file', null, { url });
  res.json({ url });
});
router.use(handleUploadError);

// ---- Collections ----
router.get('/collections', (req, res) => res.json(colRepo.findAll()));
router.post('/collections', (req, res, next) => {
  try {
    const info = colRepo.create(req.body);
    res.json(colRepo.findById(info.lastID));
  } catch (e) { next(e); }
});
router.put('/collections/:id', (req, res, next) => {
  try {
    colRepo.update(+req.params.id, req.body);
    res.json(colRepo.findById(+req.params.id));
  } catch (e) { next(e); }
});
router.delete('/collections/:id', (req, res, next) => {
  try {
    colRepo.remove(+req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;