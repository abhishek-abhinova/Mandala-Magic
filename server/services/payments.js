const config = require('../config');
const ordersRepo = require('../repos/orders');

// Payment adapter. Default "mock" mode creates a simulated transaction so the
// whole purchase flow can be demonstrated without a gateway. To go live set
// PAYMENT_PROVIDER and PAYMENT_SECRET_KEY and implement the provider's API.

async function createPaymentIntent(order) {
  if (config.payment.provider === 'stripe') {
    // placeholder — plug in Stripe create PaymentIntent here
    throw Object.assign(new Error('Stripe adapter not configured'), { code: 'PAYMENT_NOT_CONFIGURED' });
  }
  // mock mode
  const transactionId = 'mock_' + Math.random().toString(36).substring(2, 12);
  return { transactionId, amount: order.total, status: 'paid', mode: 'mock' };
}

async function confirmPayment(order, payload) {
  const { transactionId, amount } = await createPaymentIntent(order);
  ordersRepo.updatePayment(order.id, 'paid', transactionId);
  return { transactionId, amount };
}

// Called by a provider webhook in production.
function handleWebhook(rawBody, signature) {
  // Verify signature with config.payment.secretKey, then mark order paid.
  return { verified: true };
}

module.exports = { createPaymentIntent, confirmPayment, handleWebhook };