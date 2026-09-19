const express = require('express');
const usersRepo = require('../repos/users');
const ordersRepo = require('../repos/orders');
const addressesRepo = require('../repos/addresses');
const wishRepo = require('../repos/wishlists');
const yoycol = require('../services/yoycol');
const audit = require('../services/audit');
const { issueCsrf } = require('../middleware/security');
const { asyncHandler } = require('../middleware/error');

const router = express.Router();

// Ephemeral in-memory store for reset tokens (production: database table).
const resetTokens = new Map();

router.post('/register', (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (usersRepo.findByEmail(email)) return res.status(400).json({ error: 'An account with that email already exists' });
    usersRepo.create({ name, email, password });
    const user = usersRepo.findByEmail(email);
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.csrf = issueCsrf(req);
    require('../services/email').welcome(user);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) { next(e); }
});

router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = usersRepo.findByEmail(email);
    if (!user || !usersRepo.verifyPassword(user, password)) return res.status(401).json({ error: 'Invalid email or password' });
    if (req.session.userId) { req.session.role = undefined; req.session.userId = undefined; }
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.csrf = issueCsrf(req);
    audit.log(user.id, 'login', 'user', user.id);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) { next(e); }
});

router.post('/logout', (req, res, next) => {
  try {
    req.session.destroy(() => res.json({ ok: true }));
  } catch (e) { next(e); }
});

router.post('/forgot', (req, res, next) => {
  try {
    const { email } = req.body;
    const user = usersRepo.findByEmail(email);
    if (user) {
      const token = require('crypto').randomBytes(24).toString('hex');
      resetTokens.set(token, { userId: user.id, expires: Date.now() + 1000 * 60 * 60 });
      const link = `/account?reset=${token}&email=${encodeURIComponent(email)}`;
      require('../services/email').passwordReset(user, require('../config').site.url + link);
    }
    res.json({ ok: true }); // always 200 to avoid account enumeration
  } catch (e) { next(e); }
});

router.post('/reset', (req, res, next) => {
  try {
    const { token, password } = req.body;
    const entry = resetTokens.get(token);
    if (!entry || entry.expires < Date.now()) return res.status(400).json({ error: 'Reset link expired — request a new one' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    usersRepo.update(entry.userId, { password });
    resetTokens.delete(token);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// --- Protected account routes ---
router.use(require('../middleware/auth').requireAuth);

router.get('/me', (req, res) => {
  const u = usersRepo.findById(req.session.userId);
  const { password_hash, ...safe } = u;
  res.json(safe);
});

router.put('/me', (req, res, next) => {
  try {
    const { name, email, avatar_url } = req.body;
    const u = usersRepo.findById(req.session.userId);
    if (email && email !== u.email && usersRepo.findByEmail(email)) return res.status(400).json({ error: 'That email is already in use' });
    usersRepo.update(u.id, { name, email, avatar_url });
    audit.log(u.id, 'update_profile', 'user', u.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.put('/password', (req, res, next) => {
  try {
    const { current, password } = req.body;
    const u = usersRepo.findById(req.session.userId);
    if (!usersRepo.verifyPassword(u, current)) return res.status(403).json({ error: 'Current password is incorrect' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    usersRepo.update(u.id, { password });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/orders', (req, res) => {
  const result = ordersRepo.findByUser(req.session.userId);
  res.json(result.items.map(o => ({ ...o, items: ordersRepo.items(o.id) })));
});

router.get('/orders/:number', (req, res) => {
  const o = ordersRepo.findByNumber(req.params.number);
  if (!o || o.user_id !== req.session.userId) return res.status(404).json({ error: 'Order not found' });
  o.items = ordersRepo.items(o.id);
  res.json(o);
});

// Order tracking: pull the freshest Yoycol timeline for the customer.
router.get('/orders/:number/tracking', asyncHandler(async (req, res) => {
  const o = ordersRepo.findByNumber(req.params.number);
  if (!o || o.user_id !== req.session.userId) return res.status(404).json({ error: 'Order not found' });
  if (!o.yoycol_order_id) return res.json({ status: o.status, timeline: [], tracking: null, note: 'Not yet submitted to the production partner.' });
  const { tracking, timeline } = await yoycol.refreshOrderTracking(o.id);
  res.json({ status: ordersRepo.findByNumber(req.params.number).status, timeline, tracking });
}));

router.get('/wishlist', (req, res) => res.json(wishRepo.items(req.session.userId)));

// Addresses
router.get('/addresses', (req, res) => res.json(addressesRepo.list(req.session.userId)));
router.post('/addresses', (req, res, next) => {
  try {
    const a = addressesRepo.create({ user_id: req.session.userId, ...req.body });
    res.json({ ok: true, id: a.lastID });
  } catch (e) { next(e); }
});
router.delete('/addresses/:id', (req, res, next) => {
  try {
    addressesRepo.remove(req.session.userId, +req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;