/* ============================================================
   MANDALA MAGIC BY OM — Collections page
   (Members come from the DB collection_items, not hardcoded.)
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const wrap = MM.q('#collectionsWrap');
  if (!wrap) return;

  const ARROW = MM.icons.arrow;

  wrap.innerHTML = MM.collections.map((c, i) => {
    const cover = MM.findArt(c.artId);
    if (!cover) return '';
    const picks = (c.members || []).slice(0, 4);
    const count = (c.members || []).length;
    const mini = picks.map(id => {
      const a = MM.findArt(id);
      if (!a) return '';
      return `<a class="soc-cell" href="gallery.html#view-${a.id}" title="${a.title}">${MM.artworkSVG(a.id)}</a>`;
    }).join('');
    return `
      <article class="collection-large tilt reveal" data-tilt data-collection="${c.id}" id="coll-${c.id}" style="--d:${i * 0.06}s">
        ${MM.artworkSVG(c.artId)}
        <div class="scrim"></div>
        <div class="ctx">
          <div class="cnt">${count}${count === 1 ? ' Work' : ' Works'} · Curated by Orchid</div>
          <h2>${c.name}</h2>
          <p>${c.blurb}</p>
          <div class="mini-grid">${mini}</div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:26px">
            <a class="btn btn-gold" href="shop.html?art=${cover.id}">Shop This Collection</a>
            <a class="btn btn-ghost" href="gallery.html">See the Works</a>
          </div>
        </div>
        <span class="visit" style="position:absolute;top:24px;right:24px;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:rgba(10,6,24,.6);border:1px solid rgba(212,175,55,.4);color:var(--gold-pale)">${ARROW}</span>
      </article>`;
  }).join('');

  const hash = location.hash;
  if (hash && hash.indexOf('#coll-') === 0) {
    const target = MM.q(hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.style.boxShadow = '0 0 0 1px var(--gold), 0 44px 100px -34px rgba(0,0,0,0.92), 0 0 80px -20px rgba(212,175,55,0.4)';
        setTimeout(() => { target.style.boxShadow = ''; }, 2600);
      }, 450);
    }
  }
};