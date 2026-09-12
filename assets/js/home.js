/* ============================================================
   MANDALA MAGIC BY OM — Home page renderer
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const ARROW = MM.icons.arrow;

  /* Hero artwork */
  const heroArt = MM.q('#heroArt');
  if (heroArt) heroArt.innerHTML = MM.artworkSVG('cosmic-bloom');

  /* Teaser masonry */
  const teaser = MM.q('#teaserGrid');
  if (teaser) {
    const ids = ['cosmic-bloom', 'golden-intention', 'sacred-sunrise', 'inner-universe', 'lotus-within', 'path-of-light'];
    ids.forEach(id => {
      const a = MM.findArt(id);
      if (a) teaser.appendChild(MM.artCard(a));
    });
  }

  /* Collections grid */
  const coll = MM.q('#collGrid');
  if (coll) {
    MM.collections.forEach(c => {
      const art = MM.findArt(c.artId);
      if (!art) return;
      const card = document.createElement('a');
      card.className = 'col-card reveal';
      card.style.setProperty('--d', '0s');
      card.href = 'collections.html#' + c.id;
      const count = 4 + (c.id.length % 7);
      card.innerHTML = `
        ${MM.artworkSVG(c.artId)}
        <div class="scrim"></div>
        <span class="visit">${ARROW}</span>
        <div>
          <div class="cnt">${count}${count === 1 ? ' Work' : ' Works'}</div>
          <h3>${c.name}</h3>
        </div>`;
      coll.appendChild(card);
    });
  }

  /* Featured strip */
  const strip = MM.q('#featStrip');
  if (strip) {
    const ids = ['temple-of-light', 'ocean-of-stars', 'cosmic-bloom', 'inner-universe', 'golden-intention'];
    ids.forEach(id => {
      const art = MM.findArt(id);
      if (!art) return;
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
          <div class="t">${art.title}</div>
        </div>`;
      strip.appendChild(item);
    });
  }

  /* Story grid — Every Mandala Has an Intention */
  const sg = MM.q('#storyGrid');
  if (sg) {
    const ids = ['golden-intention', 'lotus-within', 'inner-universe'];
    ids.forEach(id => {
      const a = MM.findArt(id);
      if (!a) return;
      const card = document.createElement('article');
      card.className = 'tile reveal';
      card.style.padding = '0';
      card.style.overflow = 'hidden';
      card.innerHTML = `
        <div style="aspect-ratio:1;overflow:hidden">${MM.artworkSVG(a.id)}</div>
        <div style="padding:26px 26px 30px;display:flex;flex-direction:column;gap:12px;">
          <span class="lb-cat">${MM.fmtDate(a.date)} · ${a.cat}</span>
          <h3 class="display-s">${a.title}</h3>
          <p class="daily-intention">“${a.intention}”</p>
          <p class="daily-note">${a.note}</p>
          <a class="link-arrow" href="gallery.html" style="margin-top:6px">Read the story ${ARROW}</a>
        </div>`;
      sg.appendChild(card);
    });
  }

  /* Love this design */
  const loveAvail = MM.q('#loveAvail');
  if (loveAvail) {
    const types = ['T-Shirt', 'Hoodie', 'Art Print', 'Canvas', 'Home Decor', 'Accessories'];
    loveAvail.innerHTML = types.map(t => {
      const p = MM.products.find(x => x.artId === 'cosmic-bloom' && x.type === t);
      if (!p) return `<span class="avail-line" style="pointer-events:none;opacity:.4"><span class="dot"></span>${t}</span>`;
      return `<a class="chip avail-line" href="product.html?id=${p.id}" style="padding:8px 14px">${t}</a>`;
    }).join('');
  }
  const loveArt = MM.q('#loveArt');
  if (loveArt) loveArt.innerHTML = MM.artworkSVG('cosmic-bloom');
};