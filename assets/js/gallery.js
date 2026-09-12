/* ============================================================
   MANDALA MAGIC BY OM — Art Gallery page
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const grid = MM.q('#galleryGrid');
  if (!grid) return;

  const PAGE = 9;
  let activeFilter = 'all';
  let shown = 0;

  function matches(art) {
    switch (activeFilter) {
      case 'all': return true;
      case 'featured': return !!art.featured || !!art.best;
      case 'newest': return !!art.newest || /2026-0(9|8|7)/.test(art.date);
      default: return art.cat === activeFilter;
    }
  }

  const allWorks = () => MM.artworks.filter(matches);

  function render() {
    const list = allWorks();
    const slice = list.slice(0, shown);
    grid.innerHTML = slice.map(a => {
      const card = MM.artCard(a);
      const d = document.createElement('div');
      d.appendChild(card);
      return d.innerHTML;
    }).join('');
    const count = MM.q('#galCount');
    if (count) count.textContent = `${slice.length}${slice.length < list.length ? ' of ' + list.length : ''} works · ${activeFilter === 'all' ? 'full collection' : activeFilter}`;
    const btn = MM.q('#loadMore');
    if (btn) btn.style.display = shown < list.length ? 'inline-flex' : 'none';
    MM.qa('.masonry .art-card').forEach(c => { c.classList.add('stagger-child'); });
    window.dispatchEvent(new Event('resize'));
  }

  const bar = MM.q('#filterBar');
  if (bar) bar.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    MM.qa('.chip', bar).forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    shown = PAGE;
    render();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const loadBtn = MM.q('#loadMore');
  if (loadBtn) loadBtn.addEventListener('click', () => {
    shown += PAGE;
    render();
  });

  shown = Math.min(PAGE, allWorks().length);
  render();
};