const express = require('express');
const ordersRepo = require('../repos/orders');
const prodRepo = require('../repos/products');
const cartRepo = require('../repos/cart');
const analyticsRepo = require('../repos/analytics');
const payments = require('../services/payments');
const yoycol = require('../services/yoycol');
const email = require('../services/email');
const config = require('../config');
const artRepo = require('../repos/artworks');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const { asyncHandler } = require('../middleware/error');

function track(type, pageType, pageId, data, req) {
  try {
    analyticsRepo.trackEvent({ eventType: type, pageType, pageId, data, userId: req.session ? req.session.userId : null, sessionId: req.sessionID });
  } catch (e) { /* analytics never blocks checkout */ }
}

router.get('/config', (req, res) => {
  res.json({
    siteName: config.site.name,
    siteUrl: config.site.url,
    paymentProvider: config.payment.provider === 'mock' ? 'mock' : config.payment.provider,
    yoycolConnected: yoycol.connected(),
  });
});

router.post('/checkout', asyncHandler(async (req, res) => {
  const sessionId = req.cookies.mm_cart || '';
  const userId = req.session.userId || null;
  const cart = cartRepo.getCart(sessionId, userId);
  if (!cart.length) return res.status(400).json({ error: 'Your cart is empty' });

  const { shipping = {} } = req.body;
  if (!shipping.email || !shipping.name || !shipping.address || !shipping.city || !shipping.country) {
    return res.status(400).json({ error: 'Shipping information is incomplete' });
  }

  let subtotal = 0;
  const lines = cart.map(ci => {
    const price = ci.sale_price != null ? ci.sale_price : ci.price;
    subtotal += price * ci.quantity;
    return { ci, price, title: ci.title, size: '', quantity: ci.quantity, productId: ci.product_id, variantId: ci.variant_id, image_url: ci.image_url };
  });

  const shippingCost = subtotal >= 75 ? 0 : 6.95;
  const total = Math.round((subtotal + shippingCost) * 100) / 100;

  const order = ordersRepo.create({
    user_id: userId,
    subtotal, shipping: shippingCost, tax: 0, total,
    shipping_name: shipping.name, shipping_email: shipping.email,
    shipping_address: shipping.address, shipping_city: shipping.city,
    shipping_state: shipping.state || '', shipping_zip: shipping.zip || '', shipping_country: shipping.country,
  });

  for (const l of lines) {
    ordersRepo.addItem({ order_id: order.id, product_id: l.productId, variant_id: l.variantId, title: l.title, size: l.size, quantity: l.quantity, price: l.price });
  }

  analyticsRepo.trackEvent({ eventType: 'purchase', pageType: 'checkout', pageId: order.order_number, data: { total } });
  const payment = await payments.confirmPayment(order, { token: req.body.paymentToken });
  ordersRepo.updateStatus(order.id, 'paid'); // payment confirmed
  cartRepo.clear(sessionId, userId);

  // Best-effort Yoycol submission. A failure must never error the customer's
  // checkout: the order falls back to "requires attention / manual fulfillment".
  yoycol.submitOrder(order, lines).catch(e => {
    yoycol.pushLog('order_submit', 'error', `Order ${order.order_number}: ${e.message}`, {}, {}, order.order_number, 1);
  });

  const fullOrder = ordersRepo.findById(order.id);
  email.orderConfirmation(fullOrder).catch(() => {});
  track('purchase_complete', 'checkout', order.order_number, { total }, req);
  res.json({ order_number: order.order_number, payment, orderId: order.id });
}));

// Simulated webhook endpoint so payment providers can confirm status.
const paymentWebhook = asyncHandler(async (req, res) => {
  const { orderId, transactionId } = req.body || {};
  const ok = payments.handleWebhook(JSON.stringify(req.body || {}), req.headers['x-signature'] || '');
  if (ok.verified !== false) {
    (async () => {
      const order = orderId ? ordersRepo.findById(orderId) : null;
      if (order) ordersRepo.updatePayment(order.id, 'paid', transactionId || 'webhook');
    })();
  }
  res.json({ received: true });
});
router.post('/webhooks/payment', paymentWebhook);

// Yoycol fulfillment webhook (defensive: only acts when a shared secret is
// configured, since Yoycol does not document webhook signing in the OpenAPI).
// Polling via admin "Sync Orders" remains the primary update path.
const yoycolWebhook = asyncHandler(async (req, res) => {
  const raw = JSON.stringify(req.body || {});
  const check = yoycol.verifyWebhook(req, raw);
  if (!check.ok) {
    yoycol.pushLog('webhook', 'rejected', 'Rejected unsigned/unverified Yoycol webhook', {}, {}, '');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const result = yoycol.processWebhook(req.body || {});
  res.json({ received: true, ...result });
});
router.post('/webhooks/yoycol', yoycolWebhook);

// Track product + artwork view events from the storefront.
router.post('/event', (req, res) => {
  const { type, pageType, pageId, data } = req.body || {};
  try {
    if (type === 'product_view') artRepo.incrementViews(pageId);
    analyticsRepo.trackEvent({ eventType: type, pageType, pageId, data, userId: req.session ? req.session.userId : null, sessionId: req.sessionID });
  } catch (e) { /* analytics never blocks */ }
  res.json({ ok: true });
});

// Dedicated provider-webhook router mounted at /api/webhooks (CSRF-exempt).
// Webhooks are server-to-server by definition.
const webhookRouter = express.Router();
webhookRouter.post('/payment', paymentWebhook);
webhookRouter.post('/yoycol', yoycolWebhook);

module.exports = router;
module.exports.webhookRouter = webhookRouter;