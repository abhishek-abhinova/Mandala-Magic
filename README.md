# Mandala Magic by OM — Premium Ecommerce Platform

**Art Created With Intention.**

A complete, production-ready ecommerce platform for artist **Orchid Mandala** — public storefront, art gallery, daily mandala publishing, customer accounts, admin studio, print-on-demand (Yoycol) architecture, payments, SEO, analytics and a Hostinger-ready Node.js + MySQL backend.

Built to run on standard **Hostinger Business Hosting** (Node.js app mode). No VPS, no Docker, no Kubernetes.

---

## ✨ What's included

| Area | Status |
|---|---|
| Public storefront (light/dark themes, premium design) | ✅ Working |
| Art gallery & artwork pages (SEO-friendly SSR) | ✅ Working |
| Daily Mandala with social sharing (FB · Pinterest · X · Email · Copy Link) | ✅ Working |
| 6-step "Publish Today's Mandala" admin wizard (Upload → Words → Choose products → Connect → Preview → Publish) | ✅ Working |
| Customer account panel (orders, wishlist, addresses, profile, security) | ✅ Working |
| Contact form → stored in studio DB, delivered to the inbox + Admin → Messages | ✅ Working |
| Admin dashboard (stats, orders, customers, messages, analytics, audit log) | ✅ Working |
| Product & artwork CRUD + variants + featured + drafts | ✅ Working |
| Shopping cart + checkout (studio-confirmed orders; gateway-ready) | ✅ Working |
| Yoycol print-on-demand integration layer (graceful fallback) | ✅ Working (live-ready, demo mode safe) |
| Email service (templates + dev log / SMTP) | ✅ Working (dev log) |
| SEO: SSR pages, slugs, OG meta, robots.txt, sitemap | ✅ Working |
| Analytics (page views, events, top pages, daily traffic) | ✅ Working |
| Secure auth (bcrypt, sessions, CSRF, rate limiting, roles) | ✅ Working |
| Upload security (MIME, size, safe filenames) | ✅ Working |
| Database migrations + demo seed | ✅ Working |

---

## 🚀 Quick start (local / dev)

```bash
npm install
cp .env.example .env        # edit values (dev works with defaults)
npm run setup               # migrates schema + seeds demo catalog & admin
npm run dev                 # http://localhost:4173
```

Open:

- Storefront — http://localhost:4173
- Artwork (SSR) — http://localhost:4173/artwork/cosmic-bloom
- Admin studio — http://localhost:4173/admin
  - `admin@mandalamagicbyom.com` / `admin123`
- Customer account — http://localhost:4173/account
  - `customer@example.com` / `customer123`

The storefront reads its catalog live from the database (`assets/js/db.js` → `/api/public/*`), so any artwork, product or collection published in the admin studio appears immediately. `assets/js/data.js` now exists only as the server-side seed catalog.

**Homepage hero slides** come from `assets/uploads/hero/` — drop `hero1.jpg`, `hero2.png`, … in and they appear automatically (up to 6). While empty, the hero falls back to today's mandala + featured artworks, so the redesigned homepage is never bare.

---

## 🏗 Architecture

```
server/
  index.js            entry: migrate → seed → listen
  app.js              express app: security, sessions, SSR pages, API mounts
  config.js           environment-driven config
  schema.sql          relational schema (products, artworks, orders, users, …)
  migrate.js          schema runner
  seed.js             demo catalog (reuses assets/js/data.js) + admin account
  db.js               SQLite (dev) adapter — swap for MySQL in production
  repos/              data access layer
    users · artworks · products · orders · collections · settings
    wishlists · cart · addresses · analytics
  services/
    yoycol.js         Yoycol adapter (credentials server-side only)
    payments.js       payment provider adapter (mock by default)
    email.js          branded transactional email templates
    analytics.js      page/event tracking
    audit.js          admin audit trail
    frontendData.js   loads assets/js/data.js in a sandbox for seeding
  middleware/
    auth.js           requireAuth · requireRole (server-side, never client flags)
    security.js       CSRF token issuance & validation
    upload.js         multer with MIME/size/filename hardening
    error.js          friendly error responses (no stack traces)
  routes/
    public.js         catalog, search, collections, cart, wishlist, heroes
    account.js        auth + profile + orders + addresses + wishlist
    checkout.js       order creation, payments, webhooks, tracking events
    contact.js        storefront contact messages (stored + emailed to the studio)
    admin.js          dashboard, CRUD, Yoycol, analytics, settings, uploads
public → admin/        admin studio SPA (dark premium theme)
        account/       customer dashboard SPA
assets/               existing premium storefront, plus generated artwork SVGs
```

**Database:** SQLite for zero-config development; the schema is MySQL-compatible. Point `DATABASE_URL` at a Hostinger MySQL database and swap `db.js`'s adapter for `mysql2` to go live (see below).

---

## 🔐 Security

- **No credentials in the browser.** Yoycol, payment, SMTP and DB secrets are read via `dotenv` (`server/config.js`) and only used server-side.
- **Authentication:** bcrypt-hashed passwords, `httpOnly` + `sameSite=lax` session cookies (secure in production), session store persisted in the database.
- **Authorization:** every admin call is guarded by `requireRole('admin')` server-side. A frontend role flag is never trusted.
- **CSRF:** state-changing requests must present the session-bound token (`X-CSRF-Token`), except the stateless auth session boot.
- **Rate limiting:** 300 req/min global, 30/15-min on auth endpoints.
- **Uploads:** MIME whitelist (JPEG/PNG/WebP/GIF/SVG), size cap, server-generated safe filenames, stored outside anything executable. Never trust extensions alone.
- **Errors:** friendly JSON messages only — no stack traces to customers.
- **Audit log** for admin actions (create/edit/delete/publish/settings).
- Optional `helmet` headers served; input validation on all write routes.

---

## 🖼 Daily Mandala workflow (Orchid's morning ritual)

1. **+ Add Daily Mandala** in the admin sidebar (same flow on tablet/phone).
2. **Step 1 — Upload** today's artwork image (web preview; add a high-res production file later from the Artwork Manager).
3. **Step 2 — The Words** — title, date, category, intention, artist note, description.
4. **Step 3 — Choose Products** — tick the product types carrying the design (Art Print, Canvas, T-Shirt, Hoodie, Home Decor, Accessories).
5. **Step 4 — Connect** — the mandala is linked to every selected product as its artwork (so product pages say *Art by Orchid* and the artwork page lists them under **Available on**).
6. **Step 5 — Preview** — see the live page exactly as it will render.
7. **Step 6 — Publish** → the system creates the artwork (set as Today's Mandala, featured, published) and linked products, then shows **YOUR DAILY MANDALA IS LIVE** with **Copy Social Link**, **Share…**, **View artwork ↗** and **Shop products ↗**.

Paste the link wherever Orchid shares (Facebook, Pinterest, X). Customers land on `/artwork/<slug>` — a purchase-ready, share-optimized page. Optionally publish products to Yoycol from the **Products** page after mapping variant SKUs.

---

## 🔗 Yoycol print-on-demand

- Dedicated adapter (`server/services/yoycol.js`) with API key + secret only in `.env` (or encrypted server-side via Admin → Settings; env wins).
- **Verified against Yoycol's current public API** (`https://www.yoycol.com/api/2025/open/v4`): catalog products & variants, self-store product mappings, shipping levels & sku quotes, product templates (read-only), order create/list/detail/cancel/tracking/timeline.
- Product pipeline **Import → Review → Connect artwork → set price → Preview → Publish**. Store products keep **their own IDs** and store the Yoycol reference (`yoycol_product_id` + `yoycol_mapping_id`) — the storefront never depends on Yoycol IDs.
- Admin → **Yoycol Integration** shows connection status, imported/published counts, orders sent, sync errors with **Retry**, the last-event log, catalog import and order-status pull.
- Products list shows a **Yoycol Connected ✓** badge once mapped; variants carry the Yoycol SKU and design code; `base_cost` (never visible to customers) is tracked separately from the selling price.
- **Order statuses:** `placed → paid → processing → submitted_yoycol → in_production → shipped → delivered` (plus `cancelled`, `failed`, `requires_attention`). Customers see an honest progress timeline in their account; admins can submit-to-Yoycol, mark manual fulfillment, refresh tracking or retry failed operations.
- **Graceful fallback:** if Yoycol isn't configured (demo mode), paid orders land in **Needs Attention** for the manual workflow — nothing fakes success.
- **Honest capability notes:** Yoycol's current API has **no** create/update endpoint for product templates/designs (design creation happens in the Yoycol studio UI) and **no documented webhooks** — the `/api/webhooks/yoycol` endpoint is guarded by a shared secret and refuses unsigned payloads; routine updates happen via the pull/sync controls.

---

## 💳 Checkout & payments

The **storefront checkout is live and studio-confirmed**: placing an order creates a real order in the database (emails the customer + studio, feeds dashboards/analytics) with payment and fulfillment arranged personally by the studio — **no card details are collected on the website**, so nothing sensitive is ever stored. The order page and account panel show the honest status timeline.

The backend is **gateway-ready**: swap the provider from the default mock to a real one and the payment steps activate automatically. To go live set:

```
PAYMENT_PROVIDER=stripe
PAYMENT_SECRET_KEY=sk_...
PAYMENT_PUBLISHABLE_KEY=pk_...
PAYMENT_WEBHOOK_SECRET=...
```

Implement `createPaymentIntent`/`handleWebhook` in `server/services/payments.js`. Raw card numbers are never stored — only a transaction reference is saved on the order/payment row.

---

## 📦 Deploying to Hostinger Business Hosting

Hostinger Business hosting supports Node.js applications through hPanel → **Website → Manage → Advanced → Node.js**. The app only needs Node 18+ and a MySQL database.

### 1. Production build
The storefront is already static (HTML/CSS/JS) — no bundler build required. For the server just install production deps:

```bash
npm install --omit=dev
```

### 2. Environment setup
Upload `.env` (from `.env.example`) on the server with production values:

```
NODE_ENV=production
PORT=3000                      # hostinger provides the port
HOST=0.0.0.0
SESSION_SECRET=<long random string>
DATABASE_URL=mysql://user:pass@localhost:3306/mandala_magic
SITE_URL=https://mandalamagicbyom.com
YOYCOL_API_KEY=...
YOYCOL_API_SECRET=...
PAYMENT_PROVIDER=mock          # or stripe
PAYMENT_SECRET_KEY=...
SMTP_HOST=smtp.your-provider.com
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=support@mandalamagic.shop
ADMIN_EMAIL=admin@mandalamagic.shop
ADMIN_PASSWORD=<change-me>
```

### 3. Database setup
In hPanel create a MySQL database + user. Set `DATABASE_URL` in `.env`, then migrate and seed once:

```bash
npm run setup
```

> To use MySQL in production, install `mysql2` (`npm i mysql2`) and swap the adapter in `server/db.js` — the SQLite queries in this repo are written to translate 1:1 to the MySQL schema in `server/schema.sql`. The demo seed can then be skipped and the catalog built from the admin studio.

### 4. Domain & SSL
Point the domain's A/AAAA records at the hosting IP in hPanel → **Domains → Manage**. Enable **Let's Encrypt SSL** (hPanel → Security → SSL). Force HTTPS (`NODE_ENV=production` already sets `secure` cookies).

### 5. Upload / deploy
Upload the project (excluding `node_modules`, `.env`, `server/data`) via hPanel File Manager or FTP. Run `npm install --omit=dev` and `npm run setup` via **hPanel → Terminal** or SSH.

### 6. Run the server
In **hPanel → Node.js**:
- Application root: `/path/to/project/server`
- Start file / entry: `index.js`
- Start command: `npm start`
- Restart the app.

### 7–10. Integrations
Configure **Yoycol** (`YOYCOL_API_KEY/SECRET`), **payment provider**, and **SMTP** in `.env`. Restart the app after changes. Payment webhooks point at `https://yourdomain.com/api/store/webhooks/payment`; the (guarded) Yoycol event webhook is `https://yourdomain.com/api/webhooks/yoycol`.

### 11. Migrations
Schema changes live in `server/schema.sql`. Run `npm run migrate` after each deploy, or run the included `backup + migrate` routine in maintenance windows.

### 12. Backup & recovery
- **Database:** hPanel MySQL → export, or `node tools/backup.js` equivalent via SSH (`sqlite3` for dev file, or `mysqldump` for MySQL).
- **Artwork:** back up `assets/img/` and `assets/uploads/`.
- **Environment:** keep a secure copy of `.env` (never in git).
- **Restore:** re-upload backup files → rerun `npm run migrate` → restart.
- **Update:** pull new build → `npm install --omit=dev` → `npm run migrate` → restart.

Never commit `.env`, generated SVGs under `assets/img/art` are safe to sync.

### 13. Troubleshooting
| Symptom | Fix |
|---|---|
| `Session store` errors | Ensure `server/data/` is writable (or DB session store configured) |
| 502 / connection refused | App not running — check Node.js app is started & `PORT` matches hPanel port |
| CSRF logins fail | Cookies blocked / https misconfigured — and use `sameSite=lax` HTTPS |
| Uploads rejected | MIME or size cap — resize image or raise `MAX_UPLOAD_SIZE_MB` |
| 503 Yoycol | Credentials not configured — connect account or use manual workflow |
| Cold white pages | Ensure `.env` `SITE_URL` and static paths match the domain |

---

## 🔍 SEO & sharing

- Every artwork/product has an SEO-friendly slug (`/artwork/cosmic-bloom`, `/shop/cosmic-bloom-t-shirt`) rendered server-side with full meta.
- Open Graph tags (title, image, description) generate beautiful social previews — artwork + title + *Mandala Magic by OM* + URL.
- Share buttons on artwork/product pages: Facebook, Pinterest, X, Email, Copy Link.
- `sitemap.xml` and `robots.txt` static files for crawlers.

## 📊 Analytics

Privacy-conscious, first-party: page views, product/artwork views, add-to-carts, purchases, top pages, top products and audit events — visible in **Admin → Analytics** and the **Dashboard**.

## 🧭 Collections & content

Create collections (Sacred Geometry, Cosmic Dreams, Nature & Landscapes, Daily Mandalas, Best Sellers, New Arrivals) with description, cover and SEO fields, and attach products/artwork.

---

## 📁 Project layout

```
/            storefront pages (hand-built, premium, light+dark)
assets/      css·js·img (artwork SVGs generated at seed)
admin/       admin studio SPA
account/     customer account SPA
server/      backend (routes·repos·services·middleware)
tools/       static build helpers
.env.example · package.json · README.md
```

---

*Mandala Magic by OM — 27+ Years of Daily Creation · A New Mandala. A New Intention. Every Day.*