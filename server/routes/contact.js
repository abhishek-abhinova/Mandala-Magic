const express = require('express');
const { run } = require('../db');
const email = require('../services/email');
const config = require('../config');
const { asyncHandler } = require('../middleware/error');

const router = express.Router();

const VALID_SUBJECTS = ['General question', 'Order help', 'Wholesale / collaboration', 'Commission a mandala', 'Just saying hello'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Storefront contact form. Messages are saved to the DB (so Orchid can review
// them in the admin panel) and a notification is emailed best-effort when SMTP
// is configured (otherwise it logs, matching the email service's dev fallback).
router.post('/', asyncHandler(async (req, res) => {
  const b = req.body || {};
  const payload = {
    name: String(b.name || '').trim().slice(0, 120),
    email: String(b.email || '').trim().toLowerCase().slice(0, 200),
    subject: VALID_SUBJECTS.includes(b.subject) ? b.subject : 'General question',
    message: String(b.message || '').trim().slice(0, 6000),
  };
  if (!payload.name) return res.status(400).json({ error: 'Please tell us your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return res.status(400).json({ error: 'That email address doesn\'t look right.' });
  if (!payload.message) return res.status(400).json({ error: 'Please add a message.' });

  const info = run('INSERT INTO contact_messages (name, email, subject, message) VALUES (?,?,?,?)',
    [payload.name, payload.email, payload.subject, payload.message]);

  email.send({
    to: config.smtp.from || 'support@mandalamagic.shop',
    subject: `New message: ${payload.subject} — from ${payload.name}`,
    title: 'New Studio Message',
    body: `<p><strong>From:</strong> ${esc(payload.name)} &lt;${esc(payload.email)}&gt;</p>
<p><strong>Subject:</strong> ${esc(payload.subject)}</p>
<p><strong>Message:</strong></p><p style="white-space:pre-line">${esc(payload.message)}</p>`,
  }).catch(() => {});

  res.json({ ok: true, id: info.lastID });
}));

module.exports = router;