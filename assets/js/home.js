/* ============================================================
   MANDALA MAGIC BY OM — Home page renderer
   (All picks derived from the DB catalog — no hardcoded art ids.)
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const ARROW = MM.icons.arrow;

  /* Fallback art = today's mandala, else the most recent work. */
  function heroId() {
    return MM.findArt(MM.config.dailyArtwork.artId) ? MM.config.dailyArtwork.artId : (MM.artworks[0] ? MM.artworks[0].id : '');
  }

  function escText(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ============ CINEMATIC HERO SLIDESHOW ============
     Prefers real uploads dropped into assets/uploads/hero/
     (hero1.jpg … hero6.webp). Falls back to catalogue
     artwork: today's mandala first, then landscapes. */
  function buildHero() {
    const wrap = MM.q('#heroSlides');
    const dots = MM.q('#heroDots');
    const hero = MM.q('.hero');
    if (!wrap) return;
    const prevBtn = MM.q('#heroPrev');
    const nextBtn = MM.q('#heroNext');

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function renderSlides(html) {
      wrap.innerHTML = html;
      const slides = MM.qa('.hero-slide', wrap);
      if (!slides.length) return;

      if (dots) {
        dots.innerHTML = slides.map((s, i) =>
          `<button type="button" role="tab" class="hero-dot${i === 0 ? ' is-active' : ''}" aria-label="Show artwork ${i + 1}" aria-selected="${i === 0}"></button>`
        ).join('');
      }

      let idx = 0, timer = null;

      function shown(n) {
        idx = (n + slides.length) % slides.length;
        slides.forEach((s, i) => {
          s.classList.toggle('is-active', i === idx);
          s.style.zIndex = i === idx ? '1' : '0';
        });
        if (dots) MM.qa('button', dots).forEach((d, i) => {
          d.classList.toggle('is-active', i === idx);
          d.setAttribute('aria-selected', i === idx);
        });
      }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      function start() { if (reduced) return; stop(); timer = setInterval(function () { shown(idx + 1); }, 5000); }
      function bounce(n) { shown(n); start(); }

      if (nextBtn) nextBtn.addEventListener('click', function () { bounce(idx + 1); });
      if (prevBtn) prevBtn.addEventListener('click', function () { bounce(idx - 1); });
      if (dots) dots.addEventListener('click', function (e) {
        const b = e.target.closest('button');
        if (!b) return;
        bounce(MM.qa('button', dots).indexOf(b));
      });
      if (hero) {
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        hero.addEventListener('focusin', stop);
        hero.addEventListener('focusout', start);
      }
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        if (!document.activeElement || !hero || !hero.contains(document.activeElement)) return;
        e.preventDefault();
        bounce(e.key === 'ArrowRight' ? idx + 1 : idx - 1);
      });

      start();
    }

    /* Real uploaded hero images — read via API from the studio's uploads/hero
       folder. Never probes missing files, so no console noise. */
    function probeReal() {
      if (typeof fetch !== 'function') return Promise.resolve({ items: [] }).then(function (d) { return d.items; });
      return fetch('/api/public/heroes')
        .then(function (r) { return r.ok ? r.json() : { items: [] }; })
        .catch(function () { return { items: [] }; })
        .then(function (d) { return (d.items || []).map(function (u) { return u.charAt(0) === '/' ? u.slice(1) : u; }); });
    }

    probeReal().then(function (found) {
      if (found.length) {
        renderSlides(found.slice(0, 6).map((src, i) =>
          `<div class="hero-slide${i === 0 ? ' is-active' : ''}"><img class="hero-slide-img" src="${MM.escAttr(src)}" alt=""${i === 0 ? '' : ' loading="lazy"'}></div>`
        ).join(''));
        return;
      }
      const ids = [];
      const d = MM.config.dailyArtwork && MM.config.dailyArtwork.artId;
      if (d) ids.push(d);
      MM.artworks.forEach(function (a) { if (a.cat === 'landscape' && ids.length < 5) ids.push(a.id); });
      MM.artworks.forEach(function (a) { if (ids.length >= 5) return; if (ids.indexOf(a.id) === -1) ids.push(a.id); });
      ids.length = Math.min(ids.length, 5);
      renderSlides(ids.map((id, i) =>
        `<div class="hero-slide${i === 0 ? ' is-active' : ''}"><div class="hero-slide-media">${MM.artworkSVG(id)}</div></div>`
      ).join(''));
    });
  }

  /* ============ MEET ORCHID MANDALA — 3 panel ============ */
  const hArt = MM.q('#heroArt');
  const mArt = MM.q('#meetArt');
  const landscape = MM.artworks.find(function (a) { return a.cat === 'landscape'; });
  if (hArt) hArt.innerHTML = MM.artworkSVG((landscape && landscape.id) || heroId());
  if (mArt) mArt.innerHTML = MM.artworkSVG(heroId());

  /* ============ TEASER MASONRY — featured works ============ */
  const teaser = MM.q('#teaserGrid');
  if (teaser) {
    const picks = [];
    MM.artworks.forEach(function (a) { if (a.featured && picks.length < 6) picks.push(a); });
    MM.artworks.forEach(function (a) { if (picks.length >= 6) return; if (picks.indexOf(a) === -1) picks.push(a); });
    picks.slice(0, 6).forEach(function (a) { teaser.appendChild(MM.artCard(a)); });
  }

  /* ============ SHOP BY CATEGORY ============ */
  const catGrid = MM.q('#catGrid');
  if (catGrid) {
    const cats = [
      { tag: 'prints', label: 'Art Prints' },
      { tag: 'canvas', label: 'Canvas' },
      { tag: 'tshirts', label: 'T-Shirts' },
      { tag: 'hoodies', label: 'Hoodies' },
      { tag: 'apparel', label: 'Apparel' },
      { tag: 'decor', label: 'Home Decor' },
      { tag: 'accessories', label: 'Accessories' },
      { tag: 'gifts', label: 'Gifts' }
    ];
    cats.forEach(function (cat, i) {
      const prods = MM.products.filter(function (p) { return p.tags.indexOf(cat.tag) !== -1; });
      const artId = prods.length ? prods[0].artId : (MM.artworks.length ? MM.artworks[0].id : '');
      const card = document.createElement('a');
      card.className = 'cat-card reveal';
      card.style.setProperty('--d', (i * 0.05) + 's');
      card.href = 'shop.html?cat=' + cat.tag;
      card.innerHTML = `
        <span class="cat-media">${artId ? MM.artworkSVG(artId) : ''}<span class="cat-scrim"></span></span>
        <span class="cat-body">
          <span class="cat-kicker">${prods.length} ${prods.length === 1 ? 'PRODUCT' : 'PRODUCTS'}</span>
          <span class="cat-name">${cat.label}</span>
        </span>
        <span class="cat-go" aria-hidden="true">${ARROW}</span>`;
      catGrid.appendChild(card);
    });
  }

  /* ============ NEW ARRIVALS ============ */
  const newGrid = MM.q('#newGrid');
  if (newGrid) {
    const ordered = MM.products.slice().sort(function (a, b) {
      const da = MM.findArt(a.artId);
      const db = MM.findArt(b.artId);
      return String(db && db.date).localeCompare(String(da && da.date));
    });
    const picks = [];
    for (const p of ordered) {
      const art = MM.findArt(p.artId);
      if (art && art.newest) picks.push(p);
      if (picks.length >= 8) break;
    }
    (picks.length ? picks : ordered.slice(0, 8)).forEach(function (p) {
      newGrid.appendChild(MM.productCard(p));
    });
  }

  /* ============ COLLECTIONS GRID ============ */
  const coll = MM.q('#collGrid');
  if (coll) {
    MM.collections.forEach(function (c) {
      const art = MM.findArt(c.artId);
      if (!art) return;
      const card = document.createElement('a');
      card.className = 'col-card reveal';
      card.style.setProperty('--d', '0s');
      card.href = 'collections.html#' + c.id;
      const count = (c.members || []).length;
      card.innerHTML = `
        ${MM.artworkSVG(c.artId)}
        <div class="scrim"></div>
        <span class="visit">${ARROW}</span>
        <div>
          <div class="cnt">${count}${count === 1 ? ' Work' : ' Works'}</div>
          <h3>${escText(c.name)}</h3>
        </div>`;
      coll.appendChild(card);
    });
  }

  /* ============ FEATURED STRIP — Framed in Luxury ============ */
  const strip = MM.q('#featStrip');
  if (strip) {
    const picks = [];
    MM.artworks.forEach(function (a) { if ((a.featured || a.best) && picks.length < 5) picks.push(a); });
    MM.artworks.forEach(function (a) { if (picks.length >= 5) return; if (picks.indexOf(a) === -1) picks.push(a); });
    picks.slice(0, 5).forEach(function (art) {
      const item = document.createElement('a');
      item.className = 'featured-item';
      item.style.aspectRatio = '3/4';
      item.title = 'View ' + art.title;
      item.href = 'shop.html?art=' + art.id;
      item.innerHTML = `
        ${MM.artworkSVG(art.id)}
        <div class="featured-frame"></div>
        <div class="featured-info">
          <span class="i">Featured · ${art.cat}</span>
          <div class="t">${escText(art.title)}</div>
        </div>`;
      strip.appendChild(item);
    });
  }

  /* ============ STORY GRID — Every Mandala Has an Intention ============ */
  const sg = MM.q('#storyGrid');
  if (sg) {
    const picks = MM.artworks.filter(function (a) { return a.cat === 'mandala'; }).slice(0, 3);
    (picks.length ? picks : MM.artworks.slice(0, 3)).forEach(function (a) {
      const card = document.createElement('article');
      card.className = 'tile reveal';
      card.style.padding = '0';
      card.style.overflow = 'hidden';
      card.innerHTML = `
        <div style="aspect-ratio:1;overflow:hidden">${MM.artworkSVG(a.id)}</div>
        <div style="padding:26px 26px 30px;display:flex;flex-direction:column;gap:12px;">
          <span class="lb-cat">${MM.fmtDate(a.date)} · ${a.cat}</span>
          <h3 class="display-s">${escText(a.title)}</h3>
          <p class="daily-intention">&ldquo;${escText(a.intention)}&rdquo;</p>
          <p class="daily-note">${escText(a.note)}</p>
          <a class="link-arrow" href="gallery.html" style="margin-top:6px">Read the story ${ARROW}</a>
        </div>`;
      sg.appendChild(card);
    });
  }

  /* ============ LOVE THIS DESIGN — featured artwork, dynamic ============ */
  const loved = MM.findArt(heroId());
  const loveId = loved ? loved.id : '';

  const loveAvail = MM.q('#loveAvail');
  if (loveAvail && loveId) {
    const types = ['T-Shirt', 'Hoodie', 'Art Print', 'Canvas', 'Home Decor', 'Accessories'];
    loveAvail.innerHTML = types.map(function (t) {
      const p = MM.products.find(function (x) { return x.artId === loveId && x.type === t; });
      if (!p) return `<span class="avail-line" style="pointer-events:none;opacity:.4"><span class="dot"></span>${t}</span>`;
      return `<a class="chip avail-line" href="product.html?id=${p.id}" style="padding:8px 14px">${t}</a>`;
    }).join('');
  }
  const loveArt = MM.q('#loveArt');
  if (loveArt && loveId) loveArt.innerHTML = MM.artworkSVG(loveId);

  const loveLink = MM.q('#loveShopLink');
  if (loveLink && loveId) loveLink.href = 'shop.html?art=' + loveId;

  buildHero();
};