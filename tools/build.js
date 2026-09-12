/* Builds the multi-page site from _tpl.html + _pages/*.html */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const tpl = fs.readFileSync(path.join(ROOT, '_tpl.html'), 'utf8');
const pagesDir = path.join(ROOT, '_pages');

/* Inline SVG icon tokens → markup */
const ICONS = {
  __MAIL__: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 6.5l8.5 6 8.5-6" stroke-linecap="round"/></svg>',
  __PALETTE__: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3a9 9 0 1 0 9 9c0-1.4-.8-2-1.8-2H17a2 2 0 0 1-1.5-3.3A2 2 0 0 0 17 4.5c.8 0 .9-.2.9-.5" stroke-linecap="round"/><circle cx="7.5" cy="12" r="1.1" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor"/><circle cx="15" cy="7" r="1.1" fill="currentColor"/></svg>',
  __BRUSH__: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14.5 4.5l5 5-9 9H5.5v-5z" stroke-linejoin="round"/><path d="M11 10l3 3M14.5 4.5l1.5-1.5 5 5-1.5 1.5" stroke-linejoin="round"/></svg>',
  __IG__: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
  __LEAF__: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z" stroke-linejoin="round"/><path d="M5 19c2-5 5-8 10-11" stroke-linecap="round"/></svg>',
  __HEART__: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.6-9.2-9A5.3 5.3 0 0 1 12 6.5 5.3 5.3 0 0 1 21.2 11C19 15.4 12 20 12 20z" stroke-linejoin="round"/></svg>',
  __LOCK__: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke-linecap="round"/></svg>',
  __CHECK__: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

const meta = {
  gallery: ['Art Gallery — Mandala Magic by OM', 'Explore a lifetime of imagination, intention and creativity — Mandalas, digital landscapes and abstract art by Orchid Mandala.'],
  shop: ['Shop — Mandala Magic by OM', 'Wear the magic. Live the art. Shop prints, canvas, t-shirts, hoodies, home decor and accessories designed from original Mandalas by Orchid Mandala.'],
  product: ['Product — Mandala Magic by OM', 'Made to order artwork products, printed and fulfilled through our trusted print-on-demand partner.'],
  daily: ['Daily Mandala — Mandala Magic by OM', 'A new creation. A new intention. Every day. Discover today’s Mandala from Orchid Mandala’s daily practice.'],
  collections: ['Collections — Mandala Magic by OM', 'Curated worlds from twenty-seven years of daily art — Sacred Geometry, Cosmic Dreams, Nature and more.'],
  about: ['About Orchid — Mandala Magic by OM', 'Meet Orchid Mandala — 27 years of creating with intention, one Mandala at a time.'],
  contact: ['Contact — Mandala Magic by OM', 'Reach out to Orchid and the Mandala Magic by OM studio — support, collaborations and wholesale.'],
  checkout: ['Secure Checkout — Mandala Magic by OM', 'Simple, distraction-free checkout for your Mandala Magic by OM order.'],
  order: ['Order Confirmation — Mandala Magic by OM', 'Your order is confirmed. Thank you for bringing this art into your life.']
};

let built = 0;
for (const file of fs.readdirSync(pagesDir)) {
  if (!file.endsWith('.html')) continue;
  const page = file.replace('.html', '');
  let body = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  for (const [tok, svg] of Object.entries(ICONS)) body = body.split(tok).join(svg);
  const [title, desc] = meta[page] || [page.replace('-', ' ') + ' — Mandala Magic by OM', 'Mandala Magic by OM — art created with intention.'];
  let out = tpl
    .split('{{TITLE}}').join(title)
    .split('{{DESC}}').join(desc)
    .split('{{PAGE}}').join(page)
    .split('{{BODY}}').join(body);
  if (/__[A-Z_]+__/.test(out)) {
    throw new Error('Unresolved token in ' + file + ': ' + (out.match(/__[A-Z_]+__/g) || []).join(', '));
  }
  fs.writeFileSync(path.join(ROOT, file), out);
  built++;
  console.log('built', file);
}
console.log('Built', built, 'pages.');