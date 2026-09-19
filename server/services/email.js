const config = require('../config');

let transporter = null;
let nodemailer = null;

function getTransport() {
  if (!config.smtp.host) return null;
  if (!nodemailer) {
    // Optional dependency — only needed when SMTP is configured.
    try { nodemailer = require('nodemailer'); }
    catch (e) { console.warn('[email] nodemailer not installed — upgrade via `npm install nodemailer` to enable SMTP sending.'); return null; }
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

function brandHtml(inner) {
  const gold = '#d4af37', purple = '#7a3ff2', bg = '#0a0618';
  return `<!doctype html><html><body style="margin:0;background:${bg};font-family:Arial,sans-serif;color:#f6f1e7;">
    <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;padding-bottom:24px;">
        <div style="font-size:22px;font-weight:bold;letter-spacing:2px;color:${gold};">MANDALA MAGIC <span style="color:#f6f1e7;">BY OM</span></div>
        <div style="color:${gold};font-size:12px;letter-spacing:3px;margin-top:6px;font-style:italic;">Art Created With Intention.</div>
      </div>
      <div style="background:rgba(20,12,48,.85);border:1px solid rgba(212,175,55,.25);border-radius:16px;padding:28px;">${inner}</div>
      <div style="text-align:center;font-size:12px;color:#8a84a8;margin-top:20px;">Mandala Magic by OM · 27+ Years of Daily Creation</div>
    </div></body></html>`;
}

async function send({ to, subject, title, body }) {
  const transporter = getTransport();
  const message = { from: config.smtp.from, to, subject, html: brandHtml(`<h1 style="color:${gold};font-size:20px;border-bottom:1px solid rgba(212,175,55,.25);padding-bottom:12px;">${title}</h1>${body}`) };
  if (!transporter) {
    // dev fallback: log instead of sending.
    console.log(`\n[EMAIL][${to}] ${subject}\n---\n${body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n---\n`);
    return { queued: false, devLog: true };
  }
  const info = await transporter.sendMail(message);
  return { queued: true, id: info.messageId };
}

const gold = '#d4af37';

module.exports = {
  send,
  welcome(user) { return send({ to: user.email, subject: 'Welcome to Mandala Magic by OM', title: 'Welcome, ' + user.name + ' 🌸', body: '<p>Thank you for joining Mandala Magic by OM, where art is created with intention.</p><p>Your account is ready. Explore original mandalas, digital landscapes, and beautifully designed products inspired by Orchid\'s daily practice.</p><p><a href="' + config.site.url + '/account" style="background:' + gold + ';color:#0a0618;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Manage your account</a></p>' }); },
  orderConfirmation(order) { return send({ to: order.shipping_email, subject: 'Order ' + order.order_number + ' confirmed', title: 'Order Confirmed ✨', body: '<p>Thank you for your order <strong>' + order.order_number + '</strong>.</p><p>Your artwork is now being prepared. Each piece is made to order and printed through our print-on-demand partner, then shipped to you.</p><p>Total: <strong>$' + order.total.toFixed(2) + '</strong></p>' }); },
  paymentConfirmation(order, txn) { return send({ to: order.shipping_email, subject: 'Payment received — ' + order.order_number, title: 'Payment Received 💛', body: '<p>Your payment for order <strong>' + order.order_number + '</strong> was successful.</p><p>Reference: <code>' + (txn || '—') + '</code></p>' }); },
  orderShipped(order) { return send({ to: order.shipping_email, subject: 'Your order ' + order.order_number + ' has shipped', title: 'On Its Way 🚚', body: '<p>Great news — your order <strong>' + order.order_number + '</strong> has shipped' + (order.tracking_number ? ' with tracking <strong>' + order.tracking_number + '</strong>' : '') + '.</p>' }); },
  passwordReset(user, link) { return send({ to: user.email, subject: 'Reset your password', title: 'Reset Your Password', body: '<p>A password reset was requested for your Mandala Magic account.</p><p><a href="' + link + '" style="background:' + gold + ';color:#0a0618;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset password</a></p><p>If you didn\'t request this, you can ignore this email.</p>' }); },
  adminNewOrder(order) { return send({ to: 'admin@mandalamagicbyom.com', subject: 'New order ' + order.order_number, title: 'New Order 🎉', body: '<p>A new order has been placed: <strong>' + order.order_number + '</strong> — $' + order.total.toFixed(2) + '</p>' }); },
};