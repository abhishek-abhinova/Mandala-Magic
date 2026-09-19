const crypto = require('crypto');
const config = require('../config');
const settingsRepo = require('../repos/settings');
const productsRepo = require('../repos/products');
const { query, queryOne, run } = require('../db');

// ---------------------------------------------------------------------------
// Yoycol integration service.
//
// Built against the official Yoycol OpenAPI 2025.11 document, verified from:
//   https://www.yoycol.com/api/2025/redoc
//   spec: https://www.yoycol.com/api/2025/v3/api-docs/open-api
//
// Base URL:  https://www.yoycol.com   (override: YOYCOL_API_BASE_URL)
// API path:  /api/2025/open/v4
//
// Only endpoints that exist in the current documented spec are used.
// Features Yoycol does not document (design upload, automated webhook push)
// are handled through an explicit manual / fallback workflow instead of fake
// API calls. Credentials never leave the server.
// ---------------------------------------------------------------------------

const API_VERSION = '/api/2025/open/v4';
const SUCCESS_CODES = new Set(['0', '200', 'SUCCESS', 'OK']);

function creds() {
  const key = config.yoycol.apiKey || settingsRepo.getSecret('yoycol_api_key') || '';
  const secret = config.yoycol.apiSecret || settingsRepo.getSecret('yoycol_api_secret') || '';
  const baseUrl = config.yoycol.baseUrl || settingsRepo.get('yoycol_api_base_url') || 'https://www.yoycol.com';
  return { apiKey: key, apiSecret: secret, baseUrl };
}

const connected = () => { const { apiKey, apiSecret } = creds(); return Boolean(apiKey && apiSecret); };

function authHeaders() {
  const { apiKey, apiSecret } = creds();
  const h = { 'Content-Type': 'application/json' };
  h[config.yoycol.keyHeader] = apiKey;
  h[config.yoycol.secretHeader] = apiSecret;
  return h;
}

// Unwrap { code, msg, data } envelopes. Treats documented success codes as ok
// and throws on a non-success business code instead of inventing a response.
function unwrap(body) {
  if (body && typeof body === 'object' && 'code' in body && 'data' in body && 'msg' in body) {
    if (!SUCCESS_CODES.has(String(body.code))) {
      const err = Object.assign(new Error(`Yoycol ${body.code}: ${body.msg || 'request failed'}`), {
        code: 'YOYCOL_BIZ_ERROR', bizCode: String(body.code), data: body,
      });
      throw err;
    }
    return body.data;
  }
  return body;
}

async function api(path, { method = 'GET', body, params } = {}) {
  if (!connected()) throw Object.assign(new Error('Yoycol is not configured'), { code: 'YOYCOL_NOT_CONFIGURED' });
  const { baseUrl } = creds();
  const url = new URL((baseUrl || 'https://www.yoycol.com') + API_VERSION + path);
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { method, headers: authHeaders(), body: body ? JSON.stringify(body) : undefined });
  const text = await res.text().catch(() => '');
  let parsed;
  try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = {}; }
  if (!res.ok) {
    const msg = String(parsed.msg || parsed.message || text || 'error').slice(0, 300);
    throw Object.assign(new Error(`Yoycol HTTP ${res.status}: ${msg}`), {
      code: 'YOYCOL_API_ERROR', status: res.status, data: parsed,
    });
  }
  return unwrap(parsed);
}

function shaSign(secret, rawBody) {
  return crypto.createHmac('sha256', secret || '').update(rawBody || '').digest('hex');
}

function pushLog(type, status, message, req = {}, res = {}, entityId = '', retryable = 0) {
  run('INSERT INTO yoycol_sync_logs (type,status,message,request_data,response_data,entity_id,retryable) VALUES (?,?,?,?,?,?,?)',
    [type, status, String(message).slice(0, 500), JSON.stringify(req).slice(0, 1000), JSON.stringify(res).slice(0, 1000), String(entityId || ''), retryable ? 1 : 0]);
}

// ---- Connection ------------------------------------------------------------

async function testConnection() {
  try {
    await api('/shipping/levels');
    pushLog('connection', 'success', 'Connected to Yoycol API');
    return { ok: true, connected: true, message: 'Connected to Yoycol API' };
  } catch (err) {
    if (err.code === 'YOYCOL_NOT_CONFIGURED') {
      return { ok: false, connected: false, message: 'Yoycol API credentials are not configured.' };
    }
    pushLog('connection', 'error', err.message, {}, {}, '', err.code !== 'YOYCOL_BIZ_ERROR' ? 1 : 0);
    return { ok: false, connected: false, message: err.message, code: err.code, bizCode: err.bizCode };
  }
}

// ---- Catalog (read-only product catalog) ----------------------------------

async function fetchCatalogProducts({ query: kw, page = 1, size = 20 } = {}) {
  const data = await api('/catalog/products', { params: { page, size, query: kw, owner_only: true } });
  const records = (data && data.records) || (Array.isArray(data) ? data : []);
  return { items: records, total: (data && data.total) || records.length, page, size };
}

async function fetchCatalogProductDetail(productId) {
  return api(`/catalog/products/${encodeURIComponent(productId)}`);
}

async function fetchCatalogProductVariants(productId) {
  return api(`/catalog/products/${encodeURIComponent(productId)}/variants`);
}

async function fetchCatalogVariantLookup(keyword) {
  return api('/catalog/variants', { params: { keyword } });
}

async function fetchShippingLevels() {
  return api('/shipping/levels');
}

async function fetchSkuQuote(skuCode) {
  return api('/shipping/sku_quotes', { params: { sku_code: skuCode } });
}

// ---- Product templates / designs (read-only; creation happens in Yoycol UI) -

async function fetchTemplates({ keyword } = {}) {
  const data = await api('/product_templates', { params: { keyword } });
  return (data && data.records) || (Array.isArray(data) ? data : []);
}

async function fetchTemplateDetail(templateId) {
  return api(`/product_templates/${encodeURIComponent(templateId)}`);
}

// ---- Self store product mapping (connect store products to Yoycol) --------

async function listSelfStoreProducts({ keyword, page = 1, size = 20 } = {}) {
  const data = await api('/self_store/products', { params: { keyword, page, size } });
  return { items: (data && data.records) || [], total: (data && data.total) || 0, page, size };
}

async function getSelfStoreProduct(mappingId) {
  return api(`/self_store/products/${encodeURIComponent(mappingId)}`);
}

async function upsertSelfStoreProduct(payload) {
  return api('/self_store/products', { method: 'POST', body: payload });
}

async function updateSelfStoreVariants(mappingId, variants) {
  return api(`/self_store/products/${encodeURIComponent(mappingId)}/variants`, { method: 'PUT', body: variants });
}

// ---- Orders ----------------------------------------------------------------

async function createYoycolOrder(payload) {
  return api('/orders', { method: 'POST', body: payload });
}

async function listYoycolOrders({ page = 1, size = 20 } = {}) {
  const data = await api('/orders', { params: { page, size } });
  return { items: (data && data.records) || [], total: (data && data.total) || 0, page, size };
}

async function getYoycolOrder(orderId) {
  return api(`/orders/${encodeURIComponent(orderId)}`);
}

async function cancelYoycolOrder(orderId) {
  return api(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' });
}

async function getOrderTracking(orderId) {
  return api(`/orders/${encodeURIComponent(orderId)}/tracking`);
}

async function getOrderTimeline(orderId) {
  return api(`/orders/${encodeURIComponent(orderId)}/timeline`);
}

// ---- Status mapping ---------------------------------------------------------

// Map Yoycol's status label + delivery status to internal order states.
function mapYoycolStatus(label) {
  if (!label) return 'processing';
  const s = String(label).toLowerCase();
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('deliver')) return 'delivered';
  if (s.includes('ship')) return 'shipped';
  if (s.includes('produc')) return 'in_production';
  if (s.includes('paid') || s.includes('confirm')) return 'paid';
  if (s.includes('fail') || s.includes('error')) return 'failed';
  if (s.includes('process') || s.includes('fulfil') || s.includes('fulfill')) return 'processing';
  return 'processing';
}

function applyYoycolOrder(result, ours) {
  // result is the unwrapped response of an order create / order detail.
  const id = result.orderId || result.order_id || result.id || '';
  const no = result.orderNo || result.order_no || '';
  const statusLabel = result.statusLabel || result.status_label || result.status || '';
  const tracking = result.waybillCode || result.tracking_number || '';
  const carrier = result.carrier || result.lpName || '';
  const status = statusLabel ? mapYoycolStatus(statusLabel) : (id ? 'submitted_yoycol' : ours.status);
  const sets = ["updated_at = datetime('now')"];
  const params = [];
  const assign = (col, val) => { if (val) { sets.push(col + ' = ?'); params.push(val); } };
  assign('yoycol_order_id', String(id));
  assign('yoycol_order_no', String(no));
  assign('yoycol_status_label', String(statusLabel));
  assign('carrier', String(carrier));
  assign('tracking_number', String(tracking));
  assign('status', status);
  assign('fulfillment_status', status === 'shipped' || status === 'delivered' ? 'shipped' : 'fulfilled');
  if (sets.length > 1) run(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, [...params, ours.id]);
}

// ---- Order submission -------------------------------------------------------

// Send a paid order to Yoycol for fulfillment. Uses the store's self-store
// product mappings + variant SKU/design codes. Fails honestly: never pretends
// an API call succeeded. Falls back to manual fulfillment when not configured.
async function submitOrder(order, items) {
  const lines = (items || []).map(it => {
    const variant = it.variant_id
      ? queryOne('SELECT * FROM product_variants WHERE id = ?', [it.variant_id])
      : null;
    const prod = it.productId ? queryOne('SELECT * FROM products WHERE id = ?', [it.productId]) : null;
    return {
      thirdItemId: String(it.itemId || it.id || (it.ci && it.ci.id) || ''),
      productId: String(prod ? prod.yoycol_product_id || prod.id : (it.productId || '')),
      variantId: String(variant ? (variant.external_variant_id || variant.id) : (it.variantId || '')),
      title: it.title || '',
      image: (it.image_url || (prod ? prod.image_url : '') || ''),
      quantity: it.quantity || 1,
      salesPrice: it.price || 0,
      realPrice: it.price || 0,
      skuCode: variant ? variant.yoycol_sku_code || '' : '',
      designCode: variant ? variant.yoycol_design_code || '' : '',
    };
  });

  const payload = {
    storeOrderSn: order.order_number,
    remark: (order.notes || 'Mandala Magic by OM order').slice(0, 200),
    thirdCreatedAt: order.created_at ? new Date(order.created_at + 'Z').toISOString() : new Date().toISOString(),
    currency: 'USD',
    address: {
      firstName: String(order.shipping_name || '').split(' ')[0] || 'Customer',
      lastName: String(order.shipping_name || '').split(' ').slice(1).join(' ') || order.shipping_name || '',
      email: order.shipping_email || '',
      country: (order.shipping_country || 'US').toUpperCase(),
      province: order.shipping_state || '',
      city: order.shipping_city || '',
      address1: order.shipping_address || '',
      address2: '',
      zip: order.shipping_zip || '',
      phone: '',
    },
    items: lines,
  };

  pushLog('order_submit', 'pending', `Submitting order ${order.order_number} to Yoycol`, { storeOrderSn: order.order_number }, {});
  let result;
  try {
    result = await createYoycolOrder(payload);
  } catch (err) {
    run("UPDATE orders SET status = 'requires_attention', fulfillment_status = 'manual_required', updated_at = datetime('now') WHERE id = ?", [order.id]);
    pushLog('order_submit', 'error', err.message, payload, {}, order.order_number, 1);
    throw err;
  }
  // Result may be a single order summary. Apply what we can.
  applyYoycolOrder(result, order);
  const final = queryOne('SELECT * FROM orders WHERE id = ?', [order.id]);
  const yid = final.yoycol_order_id || '';
  if (yid) pushLog('order_submit', 'success', `Order ${order.order_number} submitted to Yoycol (${yid})`, { storeOrderSn: order.order_number }, result, order.order_number);
  else run("UPDATE orders SET status = 'submitted_yoycol', fulfillment_status = 'submitted', updated_at = datetime('now') WHERE id = ?", [order.id]);
  return { manual: false, yoycol_order_id: final.yoycol_order_id, yoycol_order_no: final.yoycol_order_no, raw: result };
}

// Manual fallback: mark an order for manual fulfillment (no API call made).
function markManualFulfillment(orderId, note) {
  run("UPDATE orders SET status = 'requires_attention', fulfillment_status = 'manual_required', notes = COALESCE(notes,'') || ? , updated_at = datetime('now') WHERE id = ?",
    [note ? ' [Manual fulfillment: ' + note + ']' : ' [Requires manual fulfillment]', orderId]);
  pushLog('order_submit', 'manual', `Order ${orderId} queued for manual Yoycol fulfillment`, { order_id: orderId }, {}, '', 1);
}

// ---- Sync operations --------------------------------------------------------

// Import Yoycol catalog products into the store as DRAFT (imported) products.
// Full variant/base-cost enrichment happens on Review/Edit to avoid hammering
// the API. Already-imported products are skipped.
async function importCatalogProducts({ page = 1, size = 20, keyword, productType = 'Imported' } = {}) {
  if (!connected()) throw Object.assign(new Error('Yoycol is not configured'), { code: 'YOYCOL_NOT_CONFIGURED' });
  const { items } = await fetchCatalogProducts({ query: keyword, page, size });
  let created = 0; const skipped = 0;
  for (const p of items) {
    const exists = queryOne('SELECT id FROM products WHERE yoycol_product_id = ?', [String(p.id)]);
    if (exists) continue;
    productsRepo.create({
      title: p.name || 'Yoycol Product',
      slug: 'yoycol-' + (p.spuCode || p.id) + '-' + Math.random().toString(36).slice(2, 6),
      price: 0,
      yoycol_product_id: String(p.id),
      status: 'draft',
      workflow_status: 'imported',
      product_type: productType,
      image_url: p.spuDisplayImg || '',
      description: '',
    });
    created++;
  }
  pushLog('product_import', 'success', `Imported ${created} products from Yoycol catalog${skipped ? ` (${skipped} skipped)` : ''}`, { page, size, keyword }, { created }, '', 0);
  return { created, skipped, count: items.length };
}

async function publishProductToYoycol(product, artwork, variants) {
  if (!connected()) throw Object.assign(new Error('Yoycol is not configured'), { code: 'YOYCOL_NOT_CONFIGURED' });
  const payload = {
    storeProductId: String(product.id),
    title: product.title,
    spuCode: product.yoycol_product_id || product.slug,
    handle: product.slug,
    image: product.image_url || '',
    visibility: true,
    isThird: true,
    synced: true,
    variants: variants.map(v => ({
      variantId: v.external_variant_id || String(v.id),
      title: [v.size, v.color].filter(Boolean).join(' / ') || 'Default',
      skuCode: v.yoycol_sku_code || '',
      designCode: v.yoycol_design_code || '',
      retailPrice: String(v.price != null ? v.price : product.price),
      image: product.image_url || '',
      synced: true,
    })),
  };
  const result = await upsertSelfStoreProduct(payload);
  const mappingId = result.mappingId || result.mapping_id || result.id || null;
  run("UPDATE products SET yoycol_mapping_id = ?, workflow_status = 'published', status = 'published', updated_at = datetime('now') WHERE id = ?", [mappingId, product.id]);
  pushLog('product_publish', 'success', `Published "${product.title}" to Yoycol (mapping ${mappingId})`, { storeProductId: String(product.id) }, result, String(product.id));
  return { mappingId, raw: result };
}

// Pull latest Yoycol orders and reconcile status onto matching store orders.
async function pullOrderStatuses({ page = 1, size = 20 } = {}) {
  let matched = 0, total = 0;
  try {
    const { items } = await listYoycolOrders({ page, size });
    total = items.length;
    for (const o of items) {
      if (!o.storeOrderSn) continue;
      const ours = queryOne('SELECT * FROM orders WHERE order_number = ?', [o.storeOrderSn]);
      if (!ours) continue;
      applyYoycolOrder(o, ours);
      matched++;
    }
    pushLog('order_sync', 'success', `Synced ${matched} of ${total} Yoycol order statuses`, { page, size }, { matched, total });
  } catch (err) {
    pushLog('order_sync', 'error', err.message, { page, size }, {}, '', 1);
    throw err;
  }
  return { matched, total };
}

async function refreshOrderTracking(orderId) {
  const order = typeof orderId === 'object' ? orderId : queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order || !order.yoycol_order_id) throw Object.assign(new Error('Order has no Yoycol reference'), { code: 'NO_YOYCOL_REF' });
  let tracking = null, timeline = null;
  try { tracking = await getOrderTracking(order.yoycol_order_id); } catch (e) { /* non-fatal */ }
  try { timeline = await getOrderTimeline(order.yoycol_order_id); } catch (e) { /* non-fatal */ }
  if (tracking) {
    const carrier = tracking.lpName || tracking.carrier || '';
    const waybill = tracking.waybillCode || tracking.tailTrackCode || '';
    run("UPDATE orders SET carrier = ?, tracking_number = ?, yoycol_status_label = ?, updated_at = datetime('now') WHERE id = ?",
      [carrier, waybill, tracking.deliveryStatus != null ? 'delivery:' + tracking.deliveryStatus : order.yoycol_status_label, order.id]);
  }
  if (timeline && Array.isArray(timeline) && timeline.length) {
    const last = timeline[timeline.length - 1];
    if (last && last.orderStatusLabel) {
      const st = mapYoycolStatus(last.orderStatusLabel);
      run("UPDATE orders SET status = ?, yoycol_status_label = ?, updated_at = datetime('now') WHERE id = ?", [st, last.orderStatusLabel, order.id]);
    }
  }
  return { tracking, timeline };
}

// ---- Status / logs ------------------------------------------------------------

function status() {
  const err = queryOne("SELECT COUNT(*) as n FROM yoycol_sync_logs WHERE status = 'error'").n;
  const lastOf = (type) => queryOne("SELECT created_at FROM yoycol_sync_logs WHERE type = ? ORDER BY id DESC LIMIT 1", [type]);
  const lastSync = queryOne('SELECT created_at FROM yoycol_sync_logs ORDER BY id DESC LIMIT 1');
  return {
    connected: connected(),
    productsImported: queryOne("SELECT COUNT(*) as n FROM products WHERE yoycol_product_id != ''").n,
    productsConnected: queryOne('SELECT COUNT(*) as n FROM products WHERE yoycol_mapping_id IS NOT NULL').n,
    ordersSynced: queryOne("SELECT COUNT(*) as n FROM orders WHERE yoycol_order_id != ''").n,
    pendingOrders: queryOne("SELECT COUNT(*) as n FROM orders WHERE status IN ('placed','processing','submitted_yoycol')").n,
    manualOrders: queryOne("SELECT COUNT(*) as n FROM orders WHERE fulfillment_status = 'manual_required'").n,
    syncErrors: err,
    lastSync: lastSync ? lastSync.created_at : null,
    lastProductSync: lastOf('product_import') ? lastOf('product_import').created_at : null,
    lastOrderSync: lastOf('order_sync') ? lastOf('order_sync').created_at : null,
  };
}

function recentLogs({ type, status: statusFilter, limit = 25 } = {}) {
  let where = []; const params = [];
  if (type) { where.push('type = ?'); params.push(type); }
  if (statusFilter) { where.push('status = ?'); params.push(statusFilter); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  return query(`SELECT * FROM yoycol_sync_logs ${w} ORDER BY id DESC LIMIT ?`, [...params, limit]);
}

// ---- Webhook handling ---------------------------------------------------------

// Yoycol does not currently document webhook delivery or signing in the OpenAPI
// spec, so this endpoint is defensive: it verifies an HMAC signature when a
// shared secret (YOYCOL_WEBHOOK_SECRET) is configured, dedupes by event id, and
// applies order/status updates from a best-effort payload. Without a configured
// secret it refuses to act (never trusts unsigned webhooks).
function verifyWebhook(req, rawBody) {
  const secret = process.env.YOYCOL_WEBHOOK_SECRET || '';
  if (!secret) return { ok: false, reason: 'YOYCOL_WEBHOOK_SECRET not configured' };
  const sig = req.headers['x-yoycol-signature'] || req.headers['x-signature'] || '';
  const expected = shaSign(secret, rawBody);
  if (!sig || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return { ok: false, reason: 'signature mismatch' };
  }
  return { ok: true };
}

function processWebhook(payload) {
  const eventId = String(payload.event_id || payload.id || payload.eventId || (payload.data && payload.data.eventId) || crypto.randomUUID());
  const existing = queryOne('SELECT id FROM webhook_events WHERE event_id = ?', [eventId]);
  if (existing) return { deduped: true };
  run('INSERT INTO webhook_events (source, event_id, event_type, order_id, payload) VALUES (?,?,?,?,?)',
    ['yoycol', eventId, payload.event || payload.event_type || 'unknown', String(payload.data && (payload.data.orderId || payload.data.orderNo || payload.data.storeOrderSn || '')), JSON.stringify(payload)]);
  const data = payload.data || payload;
  const storeSn = data.storeOrderSn || data.order_no || data.order_number || data.storeOrderNo || '';
  const yid = data.orderId || data.order_id || '';
  let ours = storeSn ? queryOne('SELECT * FROM orders WHERE order_number = ?', [String(storeSn)]) : null;
  if (!ours && yid) ours = queryOne('SELECT * FROM orders WHERE yoycol_order_id = ?', [String(yid)]);
  if (ours) {
    applyYoycolOrder({ ...data, orderId: yid, orderNo: storeSn, statusLabel: data.statusLabel || data.status || payload.event_label || '' }, ours);
    run("UPDATE orders SET tracking_number = ?, carrier = ?, updated_at = datetime('now') WHERE id = ?",
      [data.trackingNumber || data.waybillCode || ours.tracking_number, data.carrier || data.lpName || ours.carrier, ours.id]);
    pushLog('webhook', 'success', `Webhook ${eventId} applied to order ${ours.order_number}`, { event: payload.event }, data, ours.order_number);
    return { applied: true, order_number: ours.order_number };
  }
  pushLog('webhook', 'success', `Webhook ${eventId} recorded (no matching order)`, { event: payload.event }, data, '');
  return { applied: false, noted: true };
}

module.exports = {
  connected,
  creds,
  api,
  shaSign,
  pushLog,
  testConnection,
  fetchCatalogProducts,
  fetchCatalogProductDetail,
  fetchCatalogProductVariants,
  fetchCatalogVariantLookup,
  fetchShippingLevels,
  fetchSkuQuote,
  fetchTemplates,
  fetchTemplateDetail,
  listSelfStoreProducts,
  getSelfStoreProduct,
  upsertSelfStoreProduct,
  updateSelfStoreVariants,
  createYoycolOrder,
  listYoycolOrders,
  getYoycolOrder,
  cancelYoycolOrder,
  getOrderTracking,
  getOrderTimeline,
  mapYoycolStatus,
  submitOrder,
  markManualFulfillment,
  importCatalogProducts,
  publishProductToYoycol,
  pullOrderStatuses,
  refreshOrderTracking,
  status,
  recentLogs,
  verifyWebhook,
  processWebhook,
};