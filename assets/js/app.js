/* ============================================================
   MANDALA MAGIC BY OM — Application Core
   ============================================================ */
(function () {
  const MM = (window.MM = window.MM || {});
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  MM.q = $;
  MM.qa = $$;
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem('mm_' + k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('mm_' + k, JSON.stringify(v)); } catch (e) {} }
  };

  document.documentElement.dataset.theme = store.get('theme', 'light') === 'dark' ? 'dark' : 'light';

  const ICONS = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8h12l-1 12H7L6 8z" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke-linecap="round"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5" stroke-linecap="round"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.4 4.4-5 8-5s6.5 1.6 8 5" stroke-linecap="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.6-9.2-9A5.3 5.3 0 0 1 12 6.5 5.3 5.3 0 0 1 21.2 11C19 15.4 12 20 12 20z" stroke-linejoin="round"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M12 20s-7-4.6-9.2-9A5.3 5.3 0 0 1 12 6.5 5.3 5.3 0 0 1 21.2 11C19 15.4 12 20 12 20z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="5.5" r="2.4"/><circle cx="18" cy="18.5" r="2.4"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" stroke-linecap="round"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2.1-.1-2.1 0-3.6 1.3-3.6 3.7V11H8.3v3h2.4v7h2.8z"/></svg>',
    tw: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 6.5c3-2.6 8.6-2.4 11.4.6.8.9 1.7 1.5 2.9 1.5l1-2A5 5 0 0 0 12 5l5 6-5 6a6.2 6.2 0 0 0-4.5 1.9c-1 1-1.4 2.2-2.9 2.5 2.1-.4 2.5-2 2.9-3.1a6 6 0 0 0 3.4-.8c2.1 1.6 4 3.2 6 5-.5-2.8-2.4-4.4-3.9-6.1C8 11 6.6 9 5 6.5z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 6.5l8.5 6 8.5-6" stroke-linecap="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke-linecap="round"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 6h12v11H2z" stroke-linejoin="round"/><path d="M14 9h4l3 3v5h-7" stroke-linejoin="round"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="18" cy="18.5" r="1.8"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z" stroke-linejoin="round"/><path d="M5 19c2-5 5-8 10-11" stroke-linecap="round"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3a9 9 0 1 0 9 9c0-1.4-.8-2-1.8-2H17a2 2 0 0 1-1.5-3.3A2 2 0 0 0 17 4.5c.8 0 .9-.2.9-.5" stroke-linecap="round"/><circle cx="7.5" cy="12" r="1.1" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor"/><circle cx="15" cy="7" r="1.1" fill="currentColor"/></svg>',
    brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14.5 4.5l5 5-9 9H5.5v-5z" stroke-linejoin="round"/><path d="M11 10l3 3M14.5 4.5l1.5-1.5 5 5-1.5 1.5" stroke-linejoin="round"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8h14l-1.2 11H7.2z" stroke-linejoin="round"/><path d="M4 4h2l2 4" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" stroke-linecap="round"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" stroke-linejoin="round"/></svg>'
  };
  MM.icons = ICONS;

  /* ================= ARTWORK / PRODUCT RENDERING ================= */
  MM.artEl = function (id, cls) {
    const wrap = document.createElement('div');
    wrap.className = cls ? ('art-wrap ' + cls) : 'art-wrap';
    wrap.innerHTML = MM.artworkSVG(id);
    return wrap;
  };

  MM.renderProductMedia = function (p, cls) {
    const wrap = document.createElement('div');
    wrap.className = cls ? ('prod-svg-wrap ' + cls) : 'prod-svg-wrap';
    wrap.setAttribute('data-prod', p.id);
    wrap.innerHTML = `<div class="prod-media">${MM.artworkSVG(p.artId)}</div>`;
    return wrap;
  };

  MM.productCard = function (p) {
    const art = MM.findArt(p.artId);
    const w = document.createElement('article');
    w.className = 'tile prod-card tilt';
    w.style.setProperty('--d', '0s');
    const wished = MM.wishlistHas(p.id);
    w.innerHTML = `
      <div class="prod-media">
        ${MM.artworkSVG(p.artId)}
        <span class="prod-badge">${p.type}</span>
        <button class="prod-whish ${wished ? 'wished' : ''}" data-wish="${p.id}" aria-label="Add to wishlist">${wished ? ICONS.heartFill : ICONS.heart}</button>
        <span class="prod-cta">
          <button class="btn btn-gold btn-sm btn-block" data-pd="${p.id}">${ICONS.eye} Quick View</button>
        </span>
      </div>
      <div class="prod-info">
        <span class="art">${art.title}</span>
        <a class="nm" href="product.html?id=${p.id}">${p.name.replace(art.title + ' ', '')}</a>
        <div class="meta-row">
          <span class="from">from</span>
          <span class="pr">$${p.price.toFixed(2)}</span>
        </div>
      </div>`;
    return w;
  };

  MM.artCard = function (art, opts) {
    opts = opts || {};
    const w = document.createElement('article');
    w.className = 'art-card tilt';
    w.setAttribute('data-art', art.id);
    w.style.setProperty('--d', '0s');
    let tag = art.newest ? '<span class="art-card-tag">New</span>' : (art.featured ? '<span class="art-card-tag">Featured</span>' : (art.best ? '<span class="art-card-tag">Bestseller</span>' : ''));
    w.innerHTML = `
      <div class="art-card-media">${MM.artworkSVG(art.id)}
        ${tag}
        <div class="art-card-overlay">
          <span class="art-card-sub">${art.cat} · ${MM.fmtDate(art.date)}</span>
          <h3 class="art-card-title">${art.title}</h3>
          <div class="art-card-actions">
            <button class="btn btn-light btn-sm" data-view="${art.id}">${ICONS.eye} View Artwork</button>
            <button class="btn btn-gold btn-sm" data-shopart="${art.id}">Shop This Design</button>
          </div>
        </div>
      </div>`;
    return w;
  };

  MM.fmtDate = function (iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  /* ================= CART ================= */
  MM.cartRead = () => store.get('cart', []);
  MM.cartSave = c => store.set('cart', c);

  MM.cartCount = function () {
    return MM.cartRead().reduce((s, i) => s + i.qty, 0);
  };

  MM.cartSubtotal = function () {
    return MM.cartRead().reduce((s, i) => {
      const p = MM.findProduct(i.pid);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  };

  MM.shipping = function () {
    const sub = MM.cartSubtotal();
    if (sub === 0) return 0;
    return sub >= 65 ? 0 : 6.5;
  };

  MM.addToCart = function (pid, opts) {
    opts = opts || {};
    const p = MM.findProduct(pid);
    if (!p) return;
    const size = opts.size || (p.sizes[0] || 'One Size');
    const color = opts.color || (p.colors[0] || '');
    const key = pid + '::' + size + '::' + color;
    const cart = MM.cartRead();
    const found = cart.find(i => i.key === key);
    if (found) found.qty += opts.qty || 1;
    else cart.push({ key, pid, qty: opts.qty || 1, size, color });
    MM.cartSave(cart);
    MM.refreshCartUI();
    const art = MM.findArt(p.artId);
    const label = p.name.replace(art ? art.title : '', '').trim() || p.type;
    MM.toast(`${label} · ${art ? art.title : ''} added to bag ✦`, true);
  };

  MM.setQty = function (key, qty) {
    let cart = MM.cartRead();
    const it = cart.find(i => i.key === key);
    if (!it) return;
    it.qty = Math.max(1, qty);
    MM.cartSave(cart);
    MM.refreshCartUI();
  };

  MM.removeItem = function (key) {
    MM.cartSave(MM.cartRead().filter(i => i.key !== key));
    MM.refreshCartUI();
  };

  MM.refreshCartUI = function () {
    const count = MM.cartCount();
    $$('.cart-count').forEach(el => { el.textContent = count; el.style.display = count ? 'grid' : 'none'; });
    const body = $('#cartBody');
    if (body) MM.mountCartBody(body);
    const totals = $('#cartFoot');
    if (totals) MM.mountCartTotals(totals);
  };

  MM.mountCartBody = function (body) {
    const cart = MM.cartRead();
    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty">
        ${ICONS.bag}
        <p>Your bag is waiting to be filled with magic.</p>
        <a class="btn btn-gold btn-sm" href="shop.html">Explore the Shop</a>
      </div>`;
      return;
    }
    body.innerHTML = cart.map(i => {
      const p = MM.findProduct(i.pid);
      if (!p) return '';
      const art = MM.findArt(p.artId);
      return `<div class="cart-item">
        <div class="thumb">${MM.artworkSVG(p.artId)}</div>
        <div>
          <div class="pt">${p.name.replace(art.title + ' ', '')} — ${art.title}</div>
          <div class="vs">${i.size}${i.color ? ' · ' + i.color : ''} · ${p.type}</div>
          <div class="pr">$${(p.price * i.qty).toFixed(2)}</div>
          <div class="qty">
            <button data-q="${i.key}" data-d="-1" aria-label="Decrease">−</button>
            <span>${i.qty}</span>
            <button data-q="${i.key}" data-d="1" aria-label="Increase">+</button>
          </div>
        </div>
        <button class="cart-item-x" data-rm="${i.key}" aria-label="Remove">×</button>
      </div>`;
    }).join('');
  };

  MM.mountCartTotals = function (foot) {
    const sub = MM.cartSubtotal();
    const ship = MM.shipping();
    foot.innerHTML = `
      <div class="cart-sub"><span>Subtotal</span><b>$${sub.toFixed(2)}</b></div>
      <div class="cart-sub"><span>Shipping</span><b>${ship === 0 ? 'Free' : '$' + ship.toFixed(2)}</b></div>
      <div class="cart-note">${ICONS.truck} Made to order · printed just for you</div>
      <button class="btn btn-gold btn-block" data-checkout>Secure Checkout</button>
      <button class="btn btn-ghost btn-block" data-continue>Continue Shopping</button>`;
  };

  MM.openCart = () => { $('#cartOverlay') && $('#cartOverlay').classList.add('open'); ($('#cartDrawer') || $('#cartDrawer')).classList.add('open'); document.body.style.overflow = 'hidden'; MM.refreshCartUI(); };
  MM.closeCart = () => { $('#cartOverlay') && $('#cartOverlay').classList.remove('open'); $('#cartDrawer') && $('#cartDrawer').classList.remove('open'); document.body.style.overflow = ''; };

  /* ================= WISHLIST ================= */
  MM.wishlistRead = () => store.get('wish', []);
  MM.wishlistHas = id => MM.wishlistRead().includes(id);

  MM.toggleWish = function (pid) {
    let w = MM.wishlistRead();
    if (w.includes(pid)) { w = w.filter(x => x !== pid); MM.toast('Removed from wishlist'); }
    else { w.push(pid); MM.toast('Saved to your wishlist ' + ICONS.heartFill); }
    store.set('wish', w);
    $$('[data-wish="' + pid + '"]').forEach(el => {
      el.classList.toggle('wished', w.includes(pid));
      el.innerHTML = w.includes(pid) ? ICONS.heartFill : ICONS.heart;
    });
  };

  /* ================= TOAST ================= */
  MM.toast = function (msg, added) {
    const stack = $('#toastStack');
    if (!stack) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="tk">${added ? '✦ ' : ''}</span>${msg}`;
    stack.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 420); }, 3200);
  };

  /* ================= LIGHTBOX ================= */
  MM.openArtLightbox = function (id) {
    const art = MM.findArt(id);
    if (!art) return;
    const bx = $('#lightbox');
    if (!bx) return;
    $('#lightboxInner').innerHTML = `
      <div class="lb-art">${MM.artworkSVG(art.id)}
        <button class="lb-close" data-lbclose aria-label="Close">×</button>
      </div>
      <div class="lb-info">
        <span class="lb-cat">${art.cat} · ${MM.fmtDate(art.date)}${art.featured ? ' · Featured' : ''}</span>
        <h2 class="lb-title">${art.title}</h2>
        <p class="lb-intention">“${art.intention}”</p>
        <p class="lb-note">${art.note}</p>
        <div class="lb-div"></div>
        <span class="lb-label">Artist's Note</span>
        <p class="lb-note">${art.note}</p>
        <div class="lb-div"></div>
        <span class="lb-label">LOVE THIS DESIGN?</span>
        <div class="products-avail">${availChips(art.id)}</div>
        <div class="lb-actions" style="margin-top:6px">
          <a class="btn btn-gold btn-sm" href="shop.html?art=${art.id}">Shop This Artwork</a>
          <a class="btn btn-ghost btn-sm" href="gallery.html">View Full Gallery</a>
        </div>
      </div>`;
    bx.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  MM.closeLightbox = function () {
    const bx = $('#lightbox');
    if (bx) bx.classList.remove('open');
    document.body.style.overflow = '';
  };

  MM.openProductLightbox = function (pid) {
    const p = MM.findProduct(pid);
    if (!p) return;
    const art = MM.findArt(p.artId);
    const bx = $('#lightbox');
    if (!bx) return;
    $('#lightboxInner').innerHTML = `
      <div class="lb-art">${MM.artworkSVG(p.artId)}
        <button class="lb-close" data-lbclose aria-label="Close">×</button>
      </div>
      <div class="lb-info">
        <span class="lb-cat">${art.title} · ${p.type}</span>
        <h2 class="lb-title">${p.name.replace(art.title + ' ', '')}</h2>
        <div class="lb-meta">$${p.price.toFixed(2)} · from ${p.sizes.length ? 'from $' + p.price.toFixed(2) : ''}</div>
        <p class="lb-note">${p.desc}</p>
        <div class="lb-div"></div>
        <span class="lb-label">Available Sizes</span>
        <div class="size-opts">${p.sizes.map(s => `<span class="size-opt" style="cursor:default">${s}</span>`).join('')}</div>
        <div class="lb-actions" style="margin-top:10px">
          <button class="btn btn-gold btn-sm" data-addq="${p.id}">${ICONS.cart} Add to Cart — $${p.price.toFixed(2)}</button>
          <a class="btn btn-ghost btn-sm" href="product.html?id=${p.id}">Full Details</a>
        </div>
      </div>`;
    bx.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function availChips(artId) {
    const types = ['T-Shirt', 'Hoodie', 'Art Print', 'Canvas', 'Home Decor', 'Accessories'];
    return types.map(t => {
      const p = MM.products.find(x => x.artId === artId && x.type === t);
      if (!p) return `<span class="avail-line" style="pointer-events:none;opacity:.35"><span class="dot"></span>${t}</span>`;
      return `<a class="avail-line" href="product.html?id=${p.id}"><span class="dot"></span>${t}</a>`;
    }).join('');
  }
  MM.availChips = availChips;

  /* ================= NAV / UI ================= */
  const NAV_LINKS = [
    { h: 'index.html', t: 'Home' },
    { h: 'gallery.html', t: 'Art Gallery' },
    { h: 'shop.html', t: 'Shop' },
    { h: 'daily.html', t: 'Daily Mandala' },
    { h: 'about.html', t: 'About Orchid' },
    { h: 'collections.html', t: 'Collections' },
    { h: 'contact.html', t: 'Contact' },
    { h: 'account/index.html', t: 'My Account' }
  ];

  function buildChrome() {
    const d = document;
    const body = d.body;

    /* ambient */
    if (!$('#bgParticles')) {
      const cv = d.createElement('canvas');
      cv.id = 'bgParticles';
      body.appendChild(cv);
    }
    if (!$('#cursorGlow')) {
      const g = d.createElement('div');
      g.id = 'cursorGlow';
      body.appendChild(g);
    }
    if (!$('#cursorRing')) {
      const r = d.createElement('div');
      r.id = 'cursorRing';
      body.appendChild(r);
    }
    if (!$('#cursorDot')) {
      const dot = d.createElement('div');
      dot.id = 'cursorDot';
      body.appendChild(dot);
    }
    (['orb-1', 'orb-2', 'orb-3']).forEach(c => {
      if (!$('.' + c)) {
        const o = d.createElement('div');
        o.className = 'page-bg-orb ' + c;
        body.appendChild(o);
      }
    });

    /* mobile menu */
    if (!$('#mmenu')) {
      const mm = d.createElement('div');
      mm.id = 'mmenu';
      mm.className = 'mmenu';
      mm.innerHTML = NAV_LINKS.map((l, i) => `<a href="${l.h}"><small>0${i + 1}</small>${l.t}</a>`).join('') +
        `<a class="btn btn-gold m-cta" href="shop.html" style="justify-content:center">Shop the Art</a>
        <div class="mmenu-foot">${[['Instagram', 'ig', 'https://instagram.com'], ['Facebook', 'fb', 'https://facebook.com'], ['X', 'tw', 'https://x.com']].map(s => `<a class="icon-btn" href="${s[2]}" target="_blank" rel="noopener" aria-label="${s[0]}">${ICONS[s[1]]}</a>`).join('')}</div>`;
      body.appendChild(mm);
    }

    /* search overlay */
    if (!$('#searchOv')) {
      const so = d.createElement('div');
      so.id = 'searchOv';
      so.className = 'overlay';
      so.setAttribute('role', 'dialog');
      so.setAttribute('aria-label', 'Search artwork and products');
      so.innerHTML = `<div class="overlay-card">
        <div class="eyebrow center" style="margin-bottom:18px">Search the gallery</div>
        <input class="search-input" id="searchInput" type="search" placeholder="Search artwork, products, intentions…" autocomplete="off"/>
        <div class="search-results" id="searchResults"><p class="daily-note" style="text-align:center">Type to search artworks &amp; products…</p></div>
      </div>`;
      body.appendChild(so);
    }

    /* cart */
    if (!$('#cartOverlay')) {
      const co = d.createElement('div');
      co.id = 'cartOverlay';
      co.className = 'cart-overlay';
      body.appendChild(co);
    }
    if (!$('#cartDrawer')) {
      const cd = d.createElement('div');
      cd.id = 'cartDrawer';
      cd.className = 'cart-drawer';
      cd.setAttribute('role', 'dialog');
      cd.setAttribute('aria-label', 'Shopping bag');
      cd.innerHTML = `<div class="cart-head"><h3>Your Bag</h3><button class="icon-btn" data-cartclose aria-label="Close bag">${ICONS.x}</button></div>
        <div class="cart-body" id="cartBody"></div>
        <div class="cart-foot" id="cartFoot"></div>`;
      body.appendChild(cd);
      cd.addEventListener('click', e => {
        if (e.target.closest('[data-cartclose]')) MM.closeCart();
      });
    }

    /* lightbox */
    if (!$('#lightbox')) {
      const lb = d.createElement('div');
      lb.id = 'lightbox';
      lb.className = 'lightbox';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-label', 'Artwork viewer');
      lb.innerHTML = `<div class="lb-card" id="lightboxInner"></div>`;
      lb.addEventListener('click', e => { if (e.target === lb) MM.closeLightbox(); });
      body.appendChild(lb);
    }

    /* toast + to-top */
    if (!$('#toastStack')) {
      const ts = d.createElement('div');
      ts.id = 'toastStack';
      ts.className = 'toast-stack';
      body.appendChild(ts);
    }
    if (!$('#toTop')) {
      const tt = d.createElement('button');
      tt.id = 'toTop';
      tt.className = 'to-top';
      tt.setAttribute('aria-label', 'Back to top');
      tt.innerHTML = ICONS.arrow;
      body.appendChild(tt);
    }

    /* scroll progress */
    if (!$('#scrollProgress')) {
      const sp = d.createElement('div');
      sp.id = 'scrollProgress';
      sp.className = 'scroll-progress';
      sp.setAttribute('aria-hidden', 'true');
      sp.innerHTML = '<i></i>';
      body.appendChild(sp);
    }

    /* theme toggle */
    if (!$('#themeBtn')) {
      const nt = d.createElement('button');
      nt.id = 'themeBtn';
      nt.type = 'button';
      nt.className = 'icon-btn theme-btn';
      nt.setAttribute('aria-label', 'Toggle light and dark theme');
      const navA = $('.nav-actions');
      const cta = $('.nav-cta');
      if (navA) navA.insertBefore(nt, cta || navA.firstChild);
    }
  }

  function initNav() {
    const nav = $('#nav');
    if (nav) {
      const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    const burger = $('.burger');
    if (burger) burger.addEventListener('click', () => {
      const m = $('#mmenu');
      const open = m.classList.toggle('open');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    const mm = $('#mmenu');
    if (mm) mm.querySelectorAll('a[href]').forEach(l => l.addEventListener('click', () => {
      mm.classList.remove('open');
      document.body.style.overflow = '';
    }));
    const cartBtn = $('#cartBtn');
    if (cartBtn) cartBtn.addEventListener('click', MM.openCart);
    const acctBtn = $('#acctBtn');
    if (acctBtn) acctBtn.addEventListener('click', () => { location.href = 'account/index.html'; });
    const overlay = $('#cartOverlay');
    if (overlay) overlay.addEventListener('click', MM.closeCart);
    document.addEventListener('click', e => {
      if (e.target.closest('[data-checkout]')) { e.preventDefault(); location.href = 'checkout.html'; MM.closeCart(); }
      if (e.target.closest('[data-continue]')) { MM.closeCart(); }
      if (e.target.closest('[data-cartopen]')) MM.openCart();
    });

    /* search */
    const searchBtn = $('#searchBtn');
    const searchOv = $('#searchOv');
    if (searchBtn && searchOv) {
      searchBtn.addEventListener('click', () => {
        searchOv.classList.add('open');
        setTimeout(() => { const i = $('#searchInput'); i && i.focus(); }, 120);
      });
      searchOv.addEventListener('click', e => {
        if (e.target === searchOv || e.target.closest('[data-lbclose]')) searchOv.classList.remove('open');
      });
      const input = $('#searchInput');
      if (input) input.addEventListener('input', () => doSearch(input.value.trim(), $('#searchResults')));
    }
  }

  function doSearch(q, box) {
    if (!box) return;
    if (!q) { box.innerHTML = '<p class="daily-note" style="text-align:center">Type to search artworks &amp; products…</p>'; return; }
    const ql = q.toLowerCase();
    const arts = MM.artworks.filter(a => (a.title + ' ' + a.cat + ' ' + a.intention).toLowerCase().includes(ql)).slice(0, 5);
    const prods = MM.products.filter(p => {
      const art = MM.findArt(p.artId);
      return (p.name + ' ' + p.type + ' ' + (art ? art.title : '')).toLowerCase().includes(ql);
    }).slice(0, 5);
    const rows = arts.map(a => `<a class="search-item" href="gallery.html#view-${a.id}">
        <span class="thumb">${MM.artworkSVG(a.id)}</span>
        <span><span class="t">${a.title}</span><br><span class="s">Artwork · ${a.cat}</span></span>
        <span class="go">${ICONS.arrow}</span></a>`)
      .concat(prods.map(p => `<a class="search-item" href="product.html?id=${p.id}">
        <span class="thumb">${MM.artworkSVG(p.artId)}</span>
        <span><span class="t">${p.name}</span><br><span class="s">${p.type} · $${p.price.toFixed(2)}</span></span>
        <span class="go">${ICONS.arrow}</span></a>`))
      .join('');
    box.innerHTML = rows || '<p class="daily-note" style="text-align:center">Nothing found — try “bloom” or “golden”.</p>';
  }

  /* ================= AMBIENT ================= */
  function initParticles() {
    try {
      const cv = $('#bgParticles');
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let W, H, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const palettesFor = th => th === 'dark'
      ? [['155, 93, 229', 0.5], ['212, 175, 55', 0.4], ['46, 196, 182', 0.35], ['241, 91, 181', 0.3], ['247, 230, 181', 0.5]]
      : [['122, 63, 242', 0.2], ['212, 175, 55', 0.32], ['46, 196, 182', 0.22], ['241, 91, 181', 0.14], ['165, 124, 46', 0.26]];
    let PALETTES = palettesFor(document.documentElement.dataset.theme);
    MM.relightParticles = function () { try { PALETTES = palettesFor(document.documentElement.dataset.theme); if (typeof seed === 'function') seed(); } catch (e) {} };
    let parts = [];
    let orbs = [];
    let cxp = -400, cyp = -400;
    try { window.addEventListener('mousemove', e => { cxp = e.clientX; cyp = e.clientY; }, { passive: true }); } catch (e) {}

    function size() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      const n = Math.max(34, Math.min(96, Math.round(W * H / 21000)));
      parts = Array.from({ length: n }, () => {
        const near = Math.random() < 0.34;
        return {
          x: Math.random() * W, y: Math.random() * H,
          r: near ? 1.1 + Math.random() * 2.1 : 0.5 + Math.random() * 1.2,
          vx: (Math.random() - 0.5) * (near ? 0.5 : 0.22), vy: (Math.random() - 0.5) * (near ? 0.5 : 0.22) - (near ? 0.1 : 0.04),
          c: PALETTES[Math.floor(Math.random() * PALETTES.length)],
          tw: Math.random() * Math.PI * 2, tws: (near ? 0.02 : 0.008) + Math.random() * 0.02,
          near, base: near ? 0.35 : 0.3
        };
      });
      orbs = Array.from({ length: 3 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 120 + Math.random() * 200,
        c: PALETTES[Math.floor(Math.random() * 3)][0],
        o: 0.05 + Math.random() * 0.05,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r) o.x = W + o.r; if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r; if (o.y > H + o.r) o.y = -o.r;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.c}, ${o.o})`);
        g.addColorStop(1, `rgba(${o.c}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const p of parts) {
        const dxp = p.x - cxp, dyp = p.y - cyp;
        const d2 = dxp * dxp + dyp * dyp;
        const radius = 140;
        if (p.near && d2 < radius * radius) {
          const d = Math.sqrt(d2) || 1;
          p.x += (dxp / d) * 1.6;
          p.y += (dyp / d) * 1.6;
        }
        p.x += p.vx; p.y += p.vy;
        p.tw += p.tws;
        if (p.x < -4) p.x = W + 4; if (p.x > W + 4) p.x = -4;
        if (p.y < -4) p.y = H + 4; if (p.y > H + 4) p.y = -4;
        const a = (p.base + 0.5 * (0.5 + 0.5 * Math.sin(p.tw))) * +p.c[1];
        ctx.fillStyle = `rgba(${p.c[0]}, ${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    size(); seed(); tick();
    window.addEventListener('resize', () => { size(); seed(); });
    } catch (err) { /* particles are decorative */ }
  }

  function initCursorGlow() {
    const el = $('#cursorGlow');
    if (!el || window.matchMedia('(hover: none)').matches) return;
    let tx = innerWidth / 2, ty = innerHeight / 3, x = tx, y = ty;
    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    (function anim() {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      el.style.transform = `translate3d(${x - 280}px, ${y - 280}px, 0)`;
      requestAnimationFrame(anim);
    })();
  }

  function initCursorFX() {
    const ring = $('#cursorRing'), dot = $('#cursorDot');
    if (!ring || !dot || window.matchMedia('(hover: none)').matches) return;
    let tx = innerWidth / 2, ty = innerHeight / 3;
    let rx = tx, ry = ty, dx = tx, dy = ty;
    const HOVER = 'a[href], button, [data-tilt], .magnetic, .chip, input, select, textarea, .daily-prev, .avail-line';
    let hovered = false;
    document.addEventListener('mouseover', e => {
      const h = !!(e.target instanceof Element && e.target.closest && e.target.closest(HOVER));
      ring.classList.toggle('is-hover', h);
      hovered = h;
    });
    document.addEventListener('mouseout', e => {
      if (!hovered) return;
      if (e.target instanceof Element && e.target.closest && e.target.closest(HOVER)) {
        ring.classList.remove('is-hover');
        hovered = false;
      }
    });
    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function anim() {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16;
      dx += (tx - dx) * 0.5; dy += (ty - dy) * 0.5;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(anim);
    })();
    const leave = () => ring.classList.add('is-hidden');
    const enter = () => ring.classList.remove('is-hidden');
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', enter);
  }

  function initPreloader() {
    const pre = $('#preloader');
    if (!pre) return;
    const fade = () => {
      if (pre.classList.contains('is-done')) return;
      pre.classList.remove('is-active');
      pre.classList.add('is-done');
      try { sessionStorage.setItem('mm_intro', '1'); } catch (e) {}
    };
    try {
      if (sessionStorage.getItem('mm_intro')) { pre.remove(); return; }
    } catch (e) {}
    const t = setTimeout(fade, 1500);
    window.addEventListener('load', () => { clearTimeout(t); fade(); });
  }

  function initReveal() {
    const els = $$('.reveal, .reveal-l, .reveal-r, .reveal-zoom, .stagger, .cnt-reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(ent => {
        if (ent.isIntersecting) { ent.target.classList.add('in'); io.unobserve(ent.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
    if (document.body.dataset.page) {
      const here = document.querySelector('.nav-links a[href="' + location.pathname.split('/').pop() + '"]');
      if (here) here.classList.add('active');
      const m = document.querySelector('body[data-page]');
    }
  }

  function initTilt() {
    if (window.matchMedia('(hover: none)').matches) return;
    $$('[data-tilt], .tilt').forEach(el => {
      let raf, leaving = false;
      const reset = () => {
        el.style.transform = '';
        el.style.boxShadow = '';
        el.style.setProperty('--go', '0');
        el.style.setProperty('--gx', '50%');
        el.style.setProperty('--gy', '50%');
      };
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const mx = (e.clientX - r.left) / r.width - 0.5;
        const my = (e.clientY - r.top) / r.height - 0.5;
        const px = ((e.clientX - r.left) / r.width) * 100;
        const py = ((e.clientY - r.top) / r.height) * 100;
        leaving = false;
        el.style.transition = 'transform 0.1s ease';
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `perspective(900px) rotateX(${(-my * 7).toFixed(2)}deg) rotateY(${(mx * 7).toFixed(2)}deg) translateY(-4px)`;
          if (el.dataset.gold) el.style.boxShadow = `0 ${26 + Math.abs(mx * my) * 60}px 80px -30px rgba(0,0,0,0.85), 0 0 ${20 + Math.abs(mx) * 40}px ${Math.abs(my) * 20}px rgba(212,175,55,0.3)`;
          if (el.dataset.glare) {
            el.style.setProperty('--gx', px + '%');
            el.style.setProperty('--gy', py + '%');
            el.style.setProperty('--go', '1');
          }
        });
      });
      el.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        leaving = true;
        el.style.transition = 'transform 0.6s cubic-bezier(0.22, 0.9, 0.28, 1), box-shadow 0.6s ease';
        reset();
      });
    });
  }

  function initMagnetic() {
    if (window.matchMedia('(hover: none)').matches) return;
    $$('.magnetic').forEach(el => {
      el.addEventListener('mouseenter', () => { el.classList.add('is-pulled'); });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.32;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.32;
        el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      });
      el.addEventListener('mouseleave', () => {
        el.classList.remove('is-pulled');
        el.style.transform = '';
      });
    });
  }

  function initMouseParallax() {
    if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = $$('[data-mp]');
    if (!els.length) return;
    let tx = 0, ty = 0, x = 0, y = 0;
    window.addEventListener('mousemove', e => {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
    (function anim() {
      x += (tx - x) * 0.06; y += (ty - y) * 0.06;
      for (const el of els) {
        const depth = parseFloat(el.dataset.mp) || 12;
        el.style.translate = `${(-x * depth).toFixed(1)}px ${(-y * depth).toFixed(1)}px`;
      }
      requestAnimationFrame(anim);
    })();
  }

  function initTransitions() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href.endsWith('.html')) return;
      if (a.target === '_blank') return;
      const same = new URL(href, location.href).pathname === location.pathname;
      if (same) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      document.body.classList.add('transitioning', 'start');
      setTimeout(() => { location.href = a.href; }, 380);
    });
  }

  function initToTop() {
    const b = $('#toTop');
    if (!b) return;
    const onScroll = () => b.classList.toggle('show', window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ================= THEME ================= */
  const setTheme = function (t, persist) {
    document.documentElement.dataset.theme = t;
    if (persist) store.set('theme', t);
    const btn = $('#themeBtn');
    if (btn) {
      btn.innerHTML = t === 'dark' ? ICONS.sun : ICONS.moon;
      btn.setAttribute('aria-label', t === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme');
      btn.setAttribute('aria-pressed', String(t === 'dark'));
    }
    const tc = $('meta[name="theme-color"]');
    if (tc) tc.setAttribute('content', t === 'dark' ? '#05030f' : '#f6f1e7');
    if (MM.relightParticles) { try { MM.relightParticles(); } catch (e) {} }
  };
  MM.setTheme = setTheme;

  function initTheme() {
    const btn = $('#themeBtn');
    if (btn) btn.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light', false);
  }

  /* ================= SCROLL MOTION ================= */
  function initScrollMotion() {
    const bar = $('#scrollProgress i');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paras = reduced ? [] :
      ['.hero-art-wrap', '.story-figure', '.daily-art', '.page-bg-orb', '.hero-orb', '.collection-large', '.pd-media', '.mood-strip']
        .flatMap(s => $$(s, document))
        .filter(el => el.dataset.para !== '0')
        .map(el => ({ el, s: parseFloat(el.dataset.para) || -0.14 }));
    const zoomEl = reduced ? null : $('#heroArt');
    let ticking = false;
    function frame() {
      ticking = false;
      const vh = window.innerHeight;
      if (bar) {
        const m = document.documentElement;
        const h = m.scrollHeight - vh;
        bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
      }
      for (const p of paras) {
        const r = p.el.getBoundingClientRect();
        if (r.bottom < -140 || r.top > vh + 140) { if (p.el.style.translate) p.el.style.translate = ''; continue; }
        const y = (r.top + r.height / 2 - vh / 2) * p.s;
        p.el.style.translate = y ? `0 ${y.toFixed(1)}px` : '0 0px';
      }
      if (zoomEl) {
        const r = zoomEl.getBoundingClientRect();
        const c = r.top + r.height / 2 - vh / 2;
        const k = Math.max(0, 1 - Math.abs(c) / (vh * 0.9));
        zoomEl.style.scale = (1 + (1 - k) * 0.14).toFixed(4);
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    if (bar || paras.length || zoomEl) {
      frame();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    }
  }

  function initCounters() {
    const els = $$('.m-num');
    if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('counted'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(ent => {
        if (!ent.isIntersecting) return;
        const el = ent.target;
        io.unobserve(el);
        const m = (el.textContent || '').match(/^([\d.]+)([+\-%]*)$/);
        if (!m) { el.classList.add('counted'); return; }
        const target = parseFloat(m[1]);
        const suf = m[2];
        const t0 = performance.now();
        const dur = 1400;
        (function step(now) {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = Math.round(target * eased);
          el.textContent = val + suf;
          if (p < 1) requestAnimationFrame(step); else el.classList.add('counted');
        })(t0);
      });
    }, { threshold: 0.5 });
    els.forEach(el => io.observe(el));
  }

  /* ================= WIDGETS (data-driven sections) ================= */
  function mountDaily(el, opts) {
    opts = opts || {};
    const cfg = MM.config.dailyArtwork;
    const art = MM.findArt(cfg.artId) || MM.artworks[0];
    const mode = opts.hero ? 'hero' : 'default';
    const recent = MM.artworks.filter(a => a.id !== art.id && a.cat === 'mandala').slice(0, 6);
    el.innerHTML = `
      <div class="daily-cols">
        <div class="daily-art reveal-zoom" data-mount>
          <div class="halo-ring"></div><div class="halo-ring inv"></div>
          <div class="art-frame" data-tilt><div>${MM.artworkSVG(art.id)}</div></div>
        </div>
        <div class="daily-info">
          <span class="eyebrow">Daily Mandala</span>
          <h2 class="display-l" style="margin:16px 0 4px">${cfg.title || art.title}</h2>
          <div class="daily-meta">
            <span class="daily-date">${MM.fmtDate(art.date)}</span>
            <span class="daily-date" style="background:rgba(122,63,242,.09);border-color:rgba(122,63,242,.35);color:#c9b0ff">✦ Intention of the day</span>
          </div>
          <p class="daily-intention">“${art.intention}”</p>
          <p class="daily-note">${art.note}</p>
          <div class="daily-actions">
            <button class="btn btn-gold" data-shopart="${art.id}">Shop This Design</button>
            <div class="share-row">
              <button class="share-btn tw" data-share="x" aria-label="Share on X">${ICONS.tw}</button>
              <button class="share-btn fb" data-share="fb" aria-label="Share on Facebook">${ICONS.fb}</button>
              <button class="share-btn ig" data-share="ig" aria-label="Share on Instagram">${ICONS.ig}</button>
              <button class="share-btn" data-share="copy" aria-label="Copy link">${ICONS.share}</button>
            </div>
          </div>
        </div>
      </div>`;
    if (mode === 'hero') {
      const railWrap = document.createElement('div');
      railWrap.className = 'daily-rail-wrap';
      railWrap.innerHTML = `<div class="intro-head left reveal" data-mount style="margin-bottom:18px">
        <span class="eyebrow">The Practice</span>
        <h3 class="display-s">A new creation. A new intention. Every day.</h3>
        <p class="lede">Scroll through recent mandalas from Orchid's daily practice. Tap any one to see its intention.</p>
      </div>
      <div class="daily-rail">${recent.map(a => `
        <div class="daily-prev" data-art="${a.id}">
          <div class="thumb">${MM.artworkSVG(a.id)}</div>
          <div><div class="t">${a.title}</div><div class="d">${MM.fmtDate(a.date)}</div></div>
          <span class="go">${ICONS.arrow}</span>
        </div>`).join('')}</div>
      <a class="link-arrow" href="gallery.html" style="margin-top:20px">View all mandalas ${ICONS.arrow}</a>`;
      el.appendChild(railWrap);
    }
    return art;
  }

  function mountTestimonials(el) {
    if (!MM.testimonials || !MM.testimonials.length) { el.style.display = 'none'; return; }
    el.querySelectorAll('.tes-grid').forEach(g => {
      g.innerHTML = MM.testimonials.map(t => `
        <figure class="tes-card tile reveal" data-mount>
          <span class="quote-mark">${MM.quoteSVG}</span>
          <blockquote>“${t.quote}”</blockquote>
          <figcaption class="who"><b>${t.name}</b><span>${t.role}</span></figcaption>
        </figure>`).join('');
    });
  }

  function mountSocialGrid(el) {
    const arts = MM.artworks.slice(0, 12);
    el.innerHTML = arts.map(a => `
      <a class="soc-cell reveal" data-mount href="gallery.html#view-${a.id}">
        ${MM.artworkSVG(a.id)}
        <span class="ig-icon">${ICONS.ig}</span>
      </a>`).join('');
  }

  function wireWidgetEvents() {
    document.addEventListener('click', e => {
      const dp = e.target.closest('.daily-prev');
      if (dp) MM.openArtLightbox(dp.dataset.art);
      const share = e.target.closest('[data-share]');
      if (share) {
        const url = location.href;
        const text = 'Today’s Mandala — ' + MM.config.dailyArtwork.title + ' from Mandala Magic by OM';
        if (share.dataset.share === 'copy') {
          (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.resolve()).then(() => MM.toast('Link copied to clipboard'));
        } else if (share.dataset.share === 'x') {
          open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url), '_blank');
        } else if (share.dataset.share === 'fb') {
          open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank');
        } else {
          MM.toast('Share this mandala using your device share menu');
        }
      }
    });
    const news = $$('.form-news');
    news.forEach(f => f.addEventListener('submit', e => {
      e.preventDefault();
      MM.toast('Welcome to the magic ✦ You’ll hear from Orchid soon.');
      f.reset();
    }));
  }

  function initChromeDelegation() {
    document.addEventListener('click', e => {
      const dec = e.target.closest('[data-d][data-q]');
      if (dec) {
        const it = MM.cartRead().find(i => i.key === dec.dataset.q);
        if (it) MM.setQty(dec.dataset.q, it.qty + parseInt(dec.dataset.d, 10));
      }
      const rm = e.target.closest('[data-rm]');
      if (rm) MM.removeItem(rm.dataset.rm);
      const addq = e.target.closest('[data-addq]');
      if (addq) { MM.addToCart(addq.dataset.addq); MM.closeLightbox(); }
      const wish = e.target.closest('[data-wish]');
      if (wish) MM.toggleWish(wish.dataset.wish);
      const view = e.target.closest('[data-view]');
      if (view) MM.openArtLightbox(view.dataset.view);
      const pd = e.target.closest('[data-pd]');
      if (pd) MM.openProductLightbox(pd.dataset.pd);
      const shopArt = e.target.closest('[data-shopart]');
      if (shopArt) { e.preventDefault(); location.href = 'shop.html?art=' + shopArt.dataset.shopart; }
      const lbclose = e.target.closest('[data-lbclose]');
      if (lbclose) { MM.closeLightbox(); }
    });
  }

  /* ================= BOOT ================= */
  MM.init = function () {
    const safe = fn => { try { fn(); } catch (err) { console.error('MM init step failed', err); } };
    // Non-catalog chrome + interactions boot immediately…
    safe(initPreloader);
    safe(buildChrome);
    safe(initTheme);
    safe(initNav);
    safe(initChromeDelegation);
    safe(initParticles);
    safe(initCursorGlow);
    safe(initCursorFX);
    safe(initMouseParallax);
    safe(initReveal);
    safe(initTilt);
    safe(initMagnetic);
    safe(initTransitions);
    safe(initToTop);
    safe(initScrollMotion);
    safe(initCounters);
    safe(wireWidgetEvents);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        MM.closeCart();
        MM.closeLightbox();
        const so = $('#searchOv'); so && so.classList.remove('open');
        const mm = $('#mmenu'); mm && mm.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    // …while the catalog renders only once the DB data has arrived from /api/public/*.
    const start = () => {
      document.body.classList.add('mm-ready');

      const info = $('#infoSection') || $('[data-widget="info"]');
      $$('[data-widget="daily"]').forEach(el => mountDaily(el, { hero: el.dataset.mode === 'hero' }));
      $$('[data-widget="testimonials"]').forEach(mountTestimonials);
      $$('[data-widget="social"]').forEach(mountSocialGrid);

      MM.refreshCartUI();

      if (typeof MM.pageInit === 'function') {
        try { MM.pageInit(); } catch (err) { console.error('page init error', err); }
      }

      // Re-observe reveal nodes created during the render above.
      safe(initReveal);

      /* deep link lightbox */
      const hash = location.hash;
      if (hash && hash.indexOf('#view-') === 0) {
        const artId = hash.slice(6);
        if (MM.findArt(artId)) setTimeout(() => MM.openArtLightbox(artId), 420);
      }
    };

    if (MM.dataReady && typeof MM.dataReady.then === 'function') {
      MM.dataReady.then(start).catch(err => {
        console.error('Catalog load failed', err);
        document.body.classList.add('mm-ready');
      });
    } else {
      start();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', MM.init);
  else MM.init();
})();