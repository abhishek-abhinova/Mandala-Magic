/* ============================================================
   MANDALA MAGIC BY OM — Shop page
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const grid = MM.q('#shopGrid');
  if (!grid) return;

  const PAGE = 9;
  let cat = 'all';
  let artFilter = '';
  let shown = 0;

  const params = new URLSearchParams(location.search);
  if (params.get('art')) {
    const a = MM.findArt(params.get('art'));
    if (a) artFilter = a.id;
  }

  function matches(p) {
    if (artFilter && p.artId !== artFilter) return false;
    if (cat === 'all') return true;
    return p.tags.indexOf(cat) !== -1;
  }

  function list() { return MM.products.filter(matches); }

  function render() {
    const all = list();
    const slice = all.slice(0, shown);
    grid.innerHTML = slice.map(p => {
      const c = MM.productCard(p);
      const d = document.createElement('div');
      d.appendChild(c);
      return d.innerHTML;
    }).join('');
    const count = MM.q('#shopCount');
    if (count) count.textContent = `${slice.length}${slice.length < all.length ? ' of ' + all.length : ''} products`;
    const btn = MM.q('#shopMore');
    if (btn) btn.style.display = shown < all.length ? 'inline-flex' : 'none';
  }

  /* artwork filter banner */
  const banner = MM.q('#artFilterBanner');
  if (banner) {
    if (artFilter) {
      banner.hidden = false;
      MM.q('#artBannerName').textContent = MM.findArt(artFilter).title;
      MM.q('#clearArtFilter').addEventListener('click', () => {
        history.replaceState(null, '', location.pathname);
        artFilter = '';
        banner.hidden = true;
        cat = 'all';
        MM.qa('.chip', MM.q('#catBar')).forEach(c => c.classList.toggle('active', c.dataset.cat === 'all'));
        shown = PAGE;
        render();
        renderCount();
      });
    }
  }

  function renderCount() {
    const all = list();
    const count = MM.q('#shopCount');
    if (count) count.textContent = all.length + ' products';
  }

  const bar = MM.q('#catBar');
  if (bar) bar.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    MM.qa('.chip', bar).forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    cat = chip.dataset.cat;
    shown = PAGE;
    render();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const more = MM.q('#shopMore');
  if (more) more.addEventListener('click', () => { shown += PAGE; render(); });

  shown = Math.min(PAGE, list().length);
  render();
  renderCount();
};