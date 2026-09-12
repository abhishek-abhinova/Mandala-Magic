/* ============================================================
   MANDALA MAGIC BY OM — Product Detail Page
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const mount = MM.q('#pdMount');
  if (!mount) return;

  const params = new URLSearchParams(location.search);
  let pid = params.get('id') || '';

  function mockupBody(type) {
    const MOCKPOINTS = {
      shirt: '150,170 300,230 500,230 650,170 715,310 600,380 640,700 160,700 200,380 85,310',
      hoodie: '150,205 300,255 500,255 650,205 715,315 600,385 640,700 160,700 200,385 85,315',
      tote: '170,120 630,120 630,300 655,660 145,660 170,300',
      cushion: '0,0 800,0 800,800 0,800'
    };
    const key = /shirt/i.test(type) ? 'shirt' : /hoodie/i.test(type) ? 'hoodie' : /tote|accessor/i.test(type) ? 'tote' : 'cushion';
    const pts = MOCKPOINTS[key];
    const isFrame = /print|canvas/i.test(type);
    const outline = isFrame ? '' : `<svg class="mock-outline" viewBox="0 0 800 800" aria-hidden="true"><polygon points="${pts}" fill="none" stroke="#f7f3ff" stroke-width="10" stroke-linejoin="round" opacity="0.85"/><polygon points="${pts}" fill="none" stroke="rgba(212,175,55,.55)" stroke-width="2.5" stroke-linejoin="round" transform="translate(0,-4)"/></svg>`;
    return { key, pts, outline };
  }

  function render() {
    const p = MM.findProduct(pid);
    if (!p) {
      mount.innerHTML = `<div class="center glass" style="padding:60px 30px;max-width:560px;margin-inline:auto">
        <h2 class="display-m">Artwork not found</h2>
        <p class="lede" style="margin:14px auto 0">This piece may have been archived. Let's find you something beautiful.</p>
        <div style="margin-top:24px"><a class="btn btn-gold" href="shop.html">Browse the Shop</a></div>
      </div>`;
      return;
    }
    const art = MM.findArt(p.artId);
    const siblings = MM.products.filter(x => x.artId === p.artId);
    const mk = mockupBody(p.type);
    const isApparel = /shirt|hoodie/i.test(p.type);
    const sizes = p.sizes || ['One Size'];

    const colorDots = p.colors.map((c, i) => {
      const map = { black: '#12121a', violet: '#5f3a8e', midnight: '#141c40', indigo: '#3d3a9f', teal: '#1f8a7d', champagne: '#e8d9a8', gold: '#d4af37', plum: '#5a1f52', rose: '#c26a8e', 'deep purple': '#4a2163', 'deep blue': '#22336e', sand: '#cdb894', walnut: '#6b4423', natural: '#d9c9a7' };
      return `<span class="colr-opt" style="background:${map[c.toLowerCase()] || c}" data-color="${c}" title="${c}"></span>`;
    }).join('');

    mount.innerHTML = `
      <nav class="daily-meta" aria-label="Breadcrumb">
        <a class="link-arrow right" href="gallery.html" style="font-size:.66rem">The Gallery</a>
        <span style="color:var(--faint)">·</span>
        <a class="link-arrow right" href="shop.html" style="font-size:.66rem">Shop</a>
        <span style="color:var(--faint)">·</span>
        <span style="font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold-light)">${p.type}</span>
      </nav>

      <div class="pd-grid">
        <div>
          <div class="pd-media tilt" data-tilt data-gold>
            <div class="mock ${mk.key}" id="pdMainMock">
              ${MM.artworkSVG(p.artId)}
              ${mk.outline}
              ${isApparel ? `<div class="mock-badge">${p.type}</div>` : (isFrame ? `<div class="mock-badge">Premium ${p.type}</div>` : `<div class="mock-badge">${p.type}</div>`)}
            </div>
          </div>
          <div class="pd-thumbs" id="pdThumbs">
            ${siblings.map((s, i) => {
              const smk = mockupBody(s.type);
              const isActive = s.id === p.id;
              return `<button class="pd-thumb ${isActive ? 'active' : ''}" data-vid="${s.id}" aria-label="${s.type}" title="${s.type}">
                <div class="mock ${smk.key}" style="position:relative;width:100%;height:100%">
                  ${MM.artworkSVG(s.artId)}
                </div>
              </button>`;
            }).join('')}
          </div>
        </div>

        <div class="pd-body">
          <div>
            <span class="pd-art-name">Artwork · ${art.title}</span>
            <h1 class="pd-name">${p.name.replace(art.title + ' ', '')}</h1>
            <div class="pd-price" style="margin-top:10px"><small>Price</small>$${p.price.toFixed(2)}</div>
          </div>
          <p class="pd-desc">${p.desc}</p>
          <p class="daily-intention" style="margin:0">“${art.intention}”</p>

          <div class="field" data-field="size">
            <span class="field-label"><span>${isApparel ? 'Size' : 'Size / Dim.'}</span><span id="sizeErr" style="color:var(--magenta);font-size:.66rem"></span></span>
            <div class="size-opts" id="sizeOpts">
              ${sizes.map((s, i) => `<button class="size-opt ${i === 0 ? 'active' : ''}" data-size="${s}">${s}</button>`).join('')}
            </div>
          </div>

          ${p.colors.length ? `<div class="field" data-field="color">
            <span class="field-label"><span>Colour · <span id="colorName">${p.colors[0]}</span></span></span>
            <div class="color-opts">${colorDots}</div>
          </div>` : ''}

          <div class="qty-row">
            <div class="qty-inline">
              <button id="qtyDown" aria-label="Decrease quantity">−</button>
              <span id="qtyVal">1</span>
              <button id="qtyUp" aria-label="Increase quantity">+</button>
            </div>
            <span class="daily-note" style="font-size:.78rem">Made to order — printed just for you 🕊</span>
          </div>

          <div class="pd-cta-row">
            <button class="btn btn-gold" id="addCart">Add to Cart — $${p.price.toFixed(2)}</button>
            <button class="btn btn-royal" id="buyNow">Buy Now</button>
            <button class="icon-btn ${MM.wishlistHas(p.id) ? 'wished' : ''}" id="wishBtn" aria-label="Add to wishlist">${MM.wishlistHas(p.id) ? MM.icons.heartFill : MM.icons.heart}</button>
          </div>

          <div class="pd-trust">
            <div class="row">${MM.icons.leaf}<span><b>Made to order.</b> Every piece is printed and fulfilled through our trusted print-on-demand partner — giving you gallery quality, made just for you.</span></div>
            <div class="row">${MM.icons.truck}<span><b>Ships worldwide.</b> Free shipping on orders over $65. Estimated delivery 5–10 business days.</span></div>
            <div class="row">${MM.icons.lock}<span><b>Secure checkout.</b> Simple, safe, distraction-free. Easy returns within 30 days.</span></div>
          </div>
        </div>
      </div>`;

    wire();
    renderRelated(p);
  }

  function currentProduct() { return MM.findProduct(pid); }

  function wire() {
    /* size */
    const sizeOpts = MM.q('#sizeOpts');
    if (sizeOpts) sizeOpts.addEventListener('click', e => {
      const o = e.target.closest('.size-opt');
      if (!o) return;
      MM.qa('.size-opt', sizeOpts).forEach(x => x.classList.remove('active'));
      o.classList.add('active');
    });

    /* color */
    const colorName = MM.q('#colorName');
    MM.qa('.colr-opt').forEach(c => c.addEventListener('click', () => {
      MM.qa('.colr-opt').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      if (colorName) colorName.textContent = c.dataset.color;
    }));

    /* qty */
    const qtyVal = MM.q('#qtyVal');
    let qty = 1;
    const setQ = () => qtyVal.textContent = qty;
    MM.q('#qtyUp').addEventListener('click', () => { qty = Math.min(10, qty + 1); setQ(); });
    MM.q('#qtyDown').addEventListener('click', () => { qty = Math.max(1, qty - 1); setQ(); });

    /* add / buy */
    const collectOpts = () => ({
      size: (MM.q('.size-opt.active') || {}).dataset ? MM.q('.size-opt.active').dataset.size : 'One Size',
      color: MM.q('.colr-opt.active') ? MM.q('.colr-opt.active').dataset.color : '',
      qty
    });

    MM.q('#addCart').addEventListener('click', () => { MM.addToCart(pid, collectOpts()); MM.openCart(); });
    MM.q('#buyNow').addEventListener('click', () => { MM.addToCart(pid, collectOpts(), true); location.href = 'checkout.html'; });

    const wish = MM.q('#wishBtn');
    if (wish) wish.addEventListener('click', () => {
      MM.toggleWish(pid);
      const p = currentProduct();
      if (MM.wishlistHas(p.id)) wish.innerHTML = MM.icons.heartFill; else wish.innerHTML = MM.icons.heart;
      wish.classList.toggle('wished', MM.wishlistHas(p.id));
    });

    /* variant thumbs */
    const thumbs = MM.q('#pdThumbs');
    if (thumbs) thumbs.addEventListener('click', e => {
      const t = e.target.closest('[data-vid]');
      if (!t) return;
      pid = t.dataset.vid;
      render();
      window.scrollTo({ top: mount.offsetTop - 90, behavior: 'smooth' });
    });
  }

  function renderRelated(p) {
    const rg = MM.q('#relatedGrid');
    if (!rg) return;
    const art = MM.findArt(p.artId);
    const sameArt = MM.products.filter(x => x.artId === p.artId && x.id !== p.id);
    const others = MM.products.filter(x => x.artId !== p.artId && x.tags.indexOf('featured') !== -1);
    const picks = [...sameArt, ...others].slice(0, 6).map(x => {
      const c = MM.productCard(x);
      const d = document.createElement('div');
      d.appendChild(c);
      return d.innerHTML;
    }).join('');
    rg.innerHTML = picks;
  }

  render();
};