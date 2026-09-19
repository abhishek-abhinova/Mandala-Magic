(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  const state = { user: null, csrf: '', view: 'dashboard', page: 1 };

  const fmtMoney = n => '$' + (+n || 0).toFixed(2);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- API core ---------------- */
  async function api(path, opts = {}) {
    const cfg = opts.config || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (state.csrf) headers['X-CSRF-Token'] = state.csrf;
    const res = await fetch('/api' + path, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: 'same-origin' });
    let data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) {
      const err = new Error(data.error || res.statusText || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function ensureCsrf() {
    const s = await api('/public/session', { config: { noCsrf: true } });
    state.csrf = s.csrf;
    return s;
  }

  /* ---------------- Toasts ---------------- */
  function toast(msg, type = '') {
    const el = document.createElement('div');
    el.className = 'a-toast ' + type;
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 3800);
  }

  /* ---------------- Modal ---------------- */
  function openModal(html, wide) {
    closeModal();
    const root = $('#modalRoot');
    root.innerHTML = `<div class="a-modal-back"><div class="a-modal" ${wide ? 'style="max-width:820px"' : ''}>${html}</div></div>`;
    const back = $('.a-modal-back');
    back.addEventListener('click', e => { if (e.target === back) closeModal(); });
    return back;
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; }

  /* ---------------- Router ---------------- */
  const views = {};
  function register(name, fn) { views[name] = fn; }

  async function navigate(name, params = {}) {
    state.view = name;
    $('#pageTitle').textContent = VIEW_TITLES[name] || 'Dashboard';
    $$('.a-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    const view = $('#view');
    view.innerHTML = '<div class="a-empty">Loading…</div>';
    try {
      const v = views[name];
      const html = typeof v === 'function' ? await v(params) : v;
      view.innerHTML = html;
      bindView(name);
    } catch (err) {
      view.innerHTML = `<div class="a-empty">${esc(err.message)}</div>`;
    }
  }

  function bindView(name) { if (VIEW_BINDS[name]) VIEW_BINDS[name](); }

  const VIEW_TITLES = {
    dashboard: 'Dashboard',
    artworks: 'Artwork Manager',
    wizard: 'Add Daily Mandala',
    products: 'Products',
    orders: 'Orders',
    customers: 'Customers',
    messages: 'Messages',
    yoycol: 'Yoycol Integration',
    analytics: 'Analytics & Insights',
    settings: 'Site Settings',
  };
  const VIEW_BINDS = {};

  VIEW_BINDS.dashboard = () => {
    const c = $('#qa-copy');
    if (c) c.onclick = async () => {
      try {
        const d = await api('/admin/dashboard');
        if (!d.dailyMandala) return toast('No daily mandala set yet', 'err');
        const url = location.origin + '/artwork/' + d.dailyMandala.slug;
        await navigator.clipboard.writeText(url);
        toast('Daily mandala link copied', 'ok');
      } catch (e) { toast(e.message, 'err'); }
    };
  };

  /* ================= Views ================= */
  register('dashboard', async () => {
    const d = await api('/admin/dashboard');
    const peers = persisted('mm_admin_stats');
    if (peers && peers.revenue !== d.revenue) toast('Dashboard updated');
    localStorage.setItem('mm_admin_stats', JSON.stringify(d));
    const daily = d.dailyMandala
      ? `<p style="margin-top:10px"><img src="${esc(d.dailyMandala.image_url)}" alt="" width="120" style="border-radius:10px;border:1px solid var(--line2)"></p>
         <p class="a-lede" style="margin-top:10px">${esc(d.dailyMandala.title)}</p>
         <p style="font-size:.8rem;color:var(--ink-faint)">${esc(d.dailyMandala.intention)}</p>
         <a class="a-btn a-btn-sm" style="margin-top:14px" target="_blank" href="/artwork/${esc(d.dailyMandala.slug)}">View live page ↗</a>` 
      : '<p class="a-empty">No daily mandala set — use <b>+ Add Daily Mandala</b>.</p>';
    const rows = d.recent.map(o => `<tr>
      <td><a href="#/orders" data-order="${esc(o.order_number)}" class="order-link">${esc(o.order_number)}</a></td>
      <td>${esc(o.shipping_name || '—')}</td><td>${fmtMoney(o.total)}</td><td><span class="a-badge ${pBadge(o.payment_status)}">${esc(o.payment_status)}</span></td>
      <td style="color:var(--ink-faint);font-size:.74rem">${esc((o.created_at || '').slice(0, 10))}</td></tr>`).join('') || '<tr><td colspan="5" class="a-empty">No orders yet</td></tr>';
    const y = d.yoycol || {};
    const yConn = y.connected ? '<span style="color:var(--ok)">● Connected</span>' : '<span style="color:var(--warn)">○ Demo mode</span>';
    const attn = (d.orders.requires_attention || 0) + (y.manualOrders || 0);
    const attnCard = attn > 0 ? `<a href="#/orders" class="a-card attn-card" style="text-decoration:none"><div class="k">Needs Attention</div><div class="v" style="color:var(--bad)">${attn}</div><div class="sub">orders await fulfillment</div></a>` : '';
    const quickActions = `<div class="quick-bar">
      <a class="a-btn a-btn-gold" href="#/wizard">✦ Add Today's Mandala</a>
      <a class="a-btn" href="#/products">+ Add Product</a>
      ${d.dailyMandala ? `<button class="a-btn" id="qa-copy">⧉ Copy Social Link</button>` : ''}
      <a class="a-btn" href="#/orders">▤ Check Orders</a>
    </div>`;

    return `${quickActions}<div class="cards">
      <div class="a-card"><div class="k">Revenue</div><div class="v gold">${fmtMoney(d.revenue)}</div><div class="sub">Lifetime · avg ${fmtMoney(d.avgOrderValue || 0)}/order</div></div>
      <div class="a-card"><div class="k">Orders</div><div class="v">${d.orders.total}</div><div class="sub">${d.orders.processing || 0} in production</div></div>
      <div class="a-card"><div class="k">Artwork</div><div class="v">${d.artworks}</div><div class="sub">in the studio</div></div>
      <div class="a-card"><div class="k">Products</div><div class="v">${d.products}</div><div class="sub">${y.productsConnected || 0} connected to Yoycol</div></div>
      <div class="a-card"><div class="k">Yoycol</div><div class="v">${yConn}</div><div class="sub">${y.productsSynced || y.productsImported || 0} imported · ${y.ordersSynced || 0} orders sent</div></div>
      <div class="a-card"><div class="k">Customers</div><div class="v">${d.customers}</div><div class="sub">${d.views} total page views</div></div>
    </div>
    ${attn ? (attnCard) : ''}
    <div class="a-grid2">
      <div class="a-card"><div class="a-h2">Recent Orders <a href="#/orders" class="a-btn a-btn-sm">View all</a></div>
        <div style="overflow-x:auto"><table class="a-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div>
      </div>
      <div class="a-card"><div class="a-h2">Today's Mandala <a href="#/wizard" class="a-btn a-btn-sm a-btn-gold">+ New</a></div>${daily}</div>
    </div>
    <div class="a-card"><div class="a-h2">Best Sellers</div>
      ${bestsellers(d.topProducts)}
    </div>`;
  });

  function bestsellers(list) {
    if (!list || !list.length) return '<p class="a-empty">No sales yet — demo purchases will appear here.</p>';
    let max = Math.max(...list.map(x => x.sold));
    return `<div style="display:grid;gap:12px">${list.map(x => `
      <div><div style="display:flex;justify-content:space-between;font-size:.84rem"><span>${esc(x.title)}</span><span class="a-badge b-feat">${x.sold} sold</span></div>
      <div style="height:8px;background:rgba(212,175,55,.1);border-radius:99px;margin-top:6px"><div style="height:100%;width:${Math.round(x.sold / max * 100)}%;background:linear-gradient(90deg,var(--gold),var(--gold2));border-radius:99px"></div></div></div>`).join('')}</div>`;
  }
  const pBadge = s => s === 'paid' ? 'b-pub' : 'b-dim';

  /* ---------------- Artworks ---------------- */
  register('artworks', async (params) => {
    const q = params.q || ''; const cat = params.cat || ''; const st = params.st || ''; const daily = params.daily || ''; const pg = params.pg || 1;
    const qs = new URLSearchParams({ search: q, category: cat, status: st, daily, page: pg, limit: 30 });
    const data = await api('/admin/artworks?' + qs);
    const rows = data.items.map(a => `<tr>
      <td><img class="a-thumb" src="${esc(a.image_url)}" alt=""></td>
      <td><strong>${esc(a.title)}</strong><div class="sub" style="font-size:.72rem;color:var(--ink-faint)">${esc(a.slug)}</div></td>
      <td>${esc(a.category)}</td>
      <td style="color:var(--ink-faint);font-size:.8rem">${esc(a.artwork_date || '')}</td>
      <td><div class="a-badge ${a.status === 'published' ? 'b-pub' : 'b-draft'}">${esc(a.status)}</div>${a.is_featured ? ' <span class="a-badge b-feat">featured</span>' : ''}${a.is_daily_mandala ? ' <span class="a-badge b-daily">daily</span>' : ''}</td>
      <td>${a.productCount}</td><td>${a.views}</td>
      <td><div class="b-row">
        <button data-act="edit" data-id="${a.id}">Edit</button>
        <button data-act="link" data-id="${a.id}">Products</button>
        <button data-act="feature" data-id="${a.id}" class="gold">${a.is_featured ? 'Unfeature' : 'Feature'}</button>
        ${a.status !== 'published' ? `<button data-act="publish" data-id="${a.id}">Publish</button>` : ''}
        <button data-act="daily" data-id="${a.id}" class="gold">Set Today's</button>
        <button data-act="view" data-id="${a.id}">Preview</button>
        <button data-act="del" data-id="${a.id}" class="danger">Delete</button>
      </div></td></tr>`).join('') || '<tr><td colspan="8" class="a-empty">No artwork found</td></tr>';

    return `<div class="a-card">
      <div class="toolbar">
        <input type="text" id="artSearch" placeholder="Search artwork…" value="${esc(q)}">
        <select id="artCat"><option value="">All categories</option><option ${cat==='Mandala'?'selected':''}>Mandala</option><option ${cat==='Digital Landscape'?'selected':''}>Digital Landscape</option><option ${cat==='Abstract'?'selected':''}>Abstract</option></select>
        <select id="artSt"><option value="">All status</option><option value="published" ${st==='published'?'selected':''}>Published</option><option value="draft" ${st==='draft'?'selected':''}>Draft</option></select>
        <label class="a-chk">Daily <input type="checkbox" id="artDaily" ${daily ? 'checked' : ''}></label>
        <button class="a-btn a-btn-sm" id="artGo">Filter</button>
        <button class="a-btn a-btn-gold a-btn-sm" id="artNew">+ Add Artwork</button>
      </div>
      <div style="overflow-x:auto"><table class="a-table"><thead><tr><th></th><th>Title</th><th>Category</th><th>Date</th><th>Status</th><th>Products</th><th>Views</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${pager(data.total, pg, '#/artworks')}
      <div class="a-lede" style="font-size:.8rem;margin-top:10px">Gallery scales to 900+ pieces — use filters or search rather than scrolling.</div>
    </div>`;
  });

  VIEW_BINDS.artworks = () => {
    const go = () => navigate('artworks', { q: $('#artSearch').value.trim(), cat: $('#artCat').value, st: $('#artSt').value, daily: $('#artDaily').checked ? '1' : '' });
    $('#artGo').onclick = go;
    $('#artSearch').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    $('#artDaily').onchange = go;
    $('#artNew').onclick = () => artworkEditor(null);
    $$('.b-row').forEach(row => {
      row.querySelectorAll('button').forEach(btn => {
        btn.onclick = async () => {
          const id = +btn.dataset.id, act = btn.dataset.act;
          if (act === 'edit') await artworkEditor(id);
          if (act === 'link') await linkProductsModal(id);
          if (act === 'feature') { await api('/admin/artworks/' + id + '/toggle-feature', { method: 'POST' }); toast('Updated'); navigate('artworks'); }
          if (act === 'publish') { await api('/admin/artworks/' + id, { method: 'PUT', body: { status: 'published' } }); toast('Artwork published'); navigate('artworks'); }
          if (act === 'daily') { await api('/admin/artworks/' + id + '/daily', { method: 'POST' }); toast('Set as Today\'s Mandala'); navigate('artworks'); }
          if (act === 'view') window.open('/artwork/' + await slugOf(id), '_blank');
          if (act === 'del') { if (confirm('Delete this artwork? This will also unlink its products.')) { await api('/admin/artworks/' + id, { method: 'DELETE' }); toast('Deleted'); navigate('artworks'); } }
        };
      });
    });
  };

  async function linkProductsModal(artworkId) {
    const art = await api('/admin/artworks/' + artworkId);
    const products = (await api('/admin/products?' + new URLSearchParams({ limit: 300 }))).items;
    const linked = new Set(art.products.map(p => p.id));
    openModal(`<div class="a-modal-head"><button class="a-close" onclick="document.querySelector('.a-modal-back').click()">✕</button><h3>Products for "${esc(art.title)}"</h3></div>
      <div class="a-form">
        <p class="a-lede" style="font-size:.82rem">Tick the store products that should carry this artwork on its page (Available on…).</p>
        <div style="max-height:50vh;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:10px">
          ${products.map(p => `<label class="a-chk" style="display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid var(--line)">
            <span>${esc(p.title)} <small style="color:var(--ink-faint)">${esc(p.product_type || '')}</small></span>
            <input type="checkbox" data-pid="${p.id}" ${linked.has(p.id) ? 'checked' : ''}></label>`).join('') || '<p class="a-empty">No products yet</p>'}
        </div>
        <div class="a-actions"><button class="a-btn">Cancel</button><button class="a-btn a-btn-gold" id="saveLinks">Save Links</button></div></div>`);
    $('#saveLinks').onclick = async () => {
      const ids = $$('[data-pid]:checked').map(c => +c.dataset.pid);
      await api('/admin/artworks/' + artworkId + '/link-products', { method: 'PUT', body: { productIds: ids } });
      toast('Product links saved', 'ok'); closeModal(); navigate('artworks');
    };
  }

  async function slugOf(id) { const a = await api('/admin/artworks?limit=1'); return a.items.find(x => x.id === id)?.slug || ''; }

  async function artworkEditor(id) {
    const all = (await api('/admin/artworks?' + new URLSearchParams({ limit: 500 }))).items;
    const existing = id ? all.find(x => x.id === id) : { status: 'draft', is_featured: 0, palette: '["#0b0620","#241245","#3b1f6e","#7a3ff2","#b45bff","#28c7b0"]' };
    const back = openModal(`
      <div class="a-modal-head"><button class="a-close" onclick="document.querySelector('.a-modal-back').click()">✕</button><h3>${id ? 'Edit Artwork' : 'New Artwork'}</h3></div>
      <div class="a-form a-editor">
        <div style="position:sticky;top:0">
          <img id="preImg" class="a-preview-img" src="${esc(existing.image_url || '/assets/img/logo-mark.svg')}" alt="preview">
          <div class="a-drop" id="drop" style="margin-top:12px">🖼 Web preview image — drop or click (JPG/PNG/WebP ≤15MB)</div>
          ${existing.production_file ? `<p class="a-lede" style="font-size:.78rem;margin-top:8px">✓ Production file on file:</p>` : ''}
          <div class="a-drop" id="dropProd" style="margin-top:8px;font-size:.8rem">🎞 High-res production file (for print) — optional</div>
          ${existing.production_file ? `<p class="a-lede" style="font-size:.76rem;color:var(--ok)">${esc(existing.production_file)} (or re-drop to replace)</p>` : ''}
        </div>
        <div>
          <div class="frow"><div><label>Title</label><input id="fTitle" value="${esc(existing.title || '')}"></div>
          <div><label>Slug (URL)</label><input id="fSlug" value="${esc(existing.slug || '')}" placeholder="auto"></div></div>
          <div class="frow"><div><label>Date created</label><input id="fDate" type="date" value="${esc(existing.artwork_date || '')}"></div>
          <div><label>Category</label><select id="fCat"><option>Mandala</option><option>Digital Landscape</option><option>Abstract</option></select></div></div>
          <div><label>Intention <span style="color:var(--ink-faint)">(shown as the core quote)</span></label><textarea id="fInt" class="a-textarea">${esc(existing.intention || '')}</textarea></div>
          <div><label>Description</label><textarea id="fDesc" class="a-textarea" style="min-height:60px">${esc(existing.description || '')}</textarea></div>
          <div><label>Artist note</label><textarea id="fNote" class="a-textarea" style="min-height:60px">${esc(existing.artist_note || '')}</textarea></div>
          <div class="frow"><div><label>Status</label><select id="fStatus"><option value="draft">Draft</option><option value="published">Published</option></select></div>
          <div style="display:flex;align-items:end;gap:6px"><label style="flex:1"><input type="checkbox" id="fFeat" style="width:auto"> Featured artwork</label></div></div>
          <div class="a-actions"><button class="a-btn">Cancel</button><button class="a-btn a-btn-gold" id="saveArt">${id ? 'Save Changes' : 'Create Artwork'}</button></div>
        </div>
      </div>`);
    if (existing.category) $('#fCat').value = existing.category;
    $('#fStatus').value = existing.status || 'draft';
    $('#fFeat').checked = !!existing.is_featured && existing.is_featured !== '0';
    let imgUrl = existing.image_url || '';
    let prodUrl = existing.production_file || '';
    const wireDrop = (dropId, cb) => {
      const drop = $(dropId);
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = () => uploadFile(input.files[0]).then(url => { cb(url); toast('Uploaded'); }).catch(e => toast(e.message, 'err'));
      drop.onclick = () => input.click();
    };
    wireDrop('#drop', url => { imgUrl = url; $('#preImg').src = url; });
    wireDrop('#dropProd', url => { prodUrl = url; toast('Production file uploaded'); });
    $('#saveArt').onclick = async () => {
      const body = {
        title: $('#fTitle').value.trim(),
        slug: $('#fSlug').value.trim() || undefined,
        artwork_date: $('#fDate').value,
        category: $('#fCat').value,
        intention: $('#fInt').value.trim(),
        description: $('#fDesc').value.trim(),
        artist_note: $('#fNote').value.trim(),
        status: $('#fStatus').value,
        is_featured: $('#fFeat').checked ? 1 : 0,
        image_url: imgUrl, thumbnail_url: imgUrl,
        production_file: prodUrl || undefined,
      };
      if (!body.title) return toast('Title is required', 'err');
      if (id) await api('/admin/artworks/' + id, { method: 'PUT', body });
      else await api('/admin/artworks', { method: 'POST', body });
      toast('Artwork saved');
      closeModal(); navigate('artworks');
    };
  }

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, headers: state.csrf ? { 'X-CSRF-Token': state.csrf } : {}, credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  /* ---------------- Daily Mandala Wizard (6 steps) ---------------- */
  register('wizard', () => {
    return `<div class="wizard">
      <div class="wsteps">
        <div class="wstep" data-s="1"><small>Step</small> 1 · Upload</div>
        <div class="wstep" data-s="2"><small>Step</small> 2 · The Words</div>
        <div class="wstep" data-s="3"><small>Step</small> 3 · Choose Products</div>
        <div class="wstep" data-s="4"><small>Step</small> 4 · Connect</div>
        <div class="wstep" data-s="5"><small>Step</small> 5 · Preview</div>
        <div class="wstep" data-s="6"><small>Step</small> 6 · Publish</div>
      </div>
      <div class="wcard" id="wbody"></div>
      <div class="wnav"><button class="a-btn" id="wBack" style="visibility:hidden">← Back</button>
        <div class="wprev-next"><button class="a-btn" id="wCancel">Cancel</button><button class="a-btn a-btn-gold" id="wNext">Continue →</button></div></div>
    </div>`;
  });

  VIEW_BINDS.wizard = () => {
    const W = { step: 1, artwork: null, title: '', date: '', cat: 'Mandala', intention: '', desc: '', note: '', types: [], slug: '' };
    const wbody = $('#wbody'), wBack = $('#wBack'), wNext = $('#wNext'), wCancel = $('#wCancel');
    const TYPES = [{ t: 'Art Print', base: 24 }, { t: 'Canvas', base: 59 }, { t: 'T-Shirt', base: 29 }, { t: 'Hoodie', base: 59 }, { t: 'Home Decor', base: 48 }, { t: 'Accessories', base: 18 }];

    function paint() {
      $$('.wstep').forEach(s => { const n = +s.dataset.s; s.classList.remove('active', 'done'); if (n === W.step) s.classList.add('active'); else if (n < W.step) s.classList.add('done'); });
      wBack.style.visibility = W.step > 1 ? 'visible' : 'hidden';
      if (W.step === 6) wNext.style.visibility = 'hidden';
      else { wNext.style.visibility = 'visible'; wNext.textContent = W.step === 5 ? 'Publish the Mandala ✨' : 'Continue →'; }

      const s = W.step;
      if (s === 1) wbody.innerHTML = `
        <h3 class="a-h2">Upload today's mandala</h3>
        <div class="a-drop" id="wDrop" style="padding:54px"><div style="font-size:2rem">✦</div>
          <p style="margin-top:10px"><strong>Drop the artwork here</strong> or click to browse</p>
          <p style="font-size:.74rem;color:var(--ink-faint)">Web preview (JPEG · PNG · WebP — up to 15MB). Optionally add a high-res production file afterward from the Artwork Manager.</p></div>
        ${W.artwork ? `<img src="${esc(W.artwork)}" style="margin-top:14px;max-height:320px;border-radius:12px;border:1px solid var(--line2)">` : ''}`;
      if (s === 2) wbody.innerHTML = `
        <h3 class="a-h2">The words behind today's intention</h3>
        <div class="a-form">
          <div class="frow"><div><label>Title</label><input id="wTitle" value="${esc(W.title)}" placeholder="Cosmic Bloom"></div>
          <div><label>Creation date</label><input id="wDate" type="date" value="${esc(W.date)}"></div></div>
          <div><label>Category</label><select id="wCat"><option>Mandala</option><option>Digital Landscape</option><option>Abstract</option></select></div>
          <label>Intention <span style="color:var(--ink-faint)">— one warm sentence</span></label><textarea id="wInt" class="a-textarea">${esc(W.intention)}</textarea>
          <label>Artist note <span style="color:var(--ink-faint)">— a short story for this piece</span></label><textarea id="wNote" class="a-textarea" style="min-height:70px">${esc(W.note)}</textarea>
          <label>Description <span style="color:var(--ink-faint)">— optional, shown on the artwork page</span></label><textarea id="wDesc" class="a-textarea" style="min-height:60px">${esc(W.desc)}</textarea>
        </div>`;
      if (s === 3) wbody.innerHTML = `
        <h3 class="a-h2">Which products should carry today's mandala?</h3>
        <div class="wpick">${TYPES.map(t => `<label><input type="checkbox" data-t="${esc(t.t)}" value="${esc(t.t)}" ${W.types.includes(t.t) ? 'checked' : ''}>
          <span><strong>${esc(t.t)}</strong><br><small>from ${fmtMoney(t.base)}</small></span></label>`).join('')}</div>
        <p class="a-lede" style="margin-top:14px">Each selection becomes a store product. After publishing you can map exact Yoycol variants (SKU/design code) from the <b>Products</b> page, then choose to publish products to Yoycol.</p>`;
      if (s === 4) wbody.innerHTML = `
        <h3 class="a-h2">Connect the artwork</h3>
        <p class="a-lede">Today's mandala is automatically linked to each selected product as its artwork — so every product page says <i>"Art by Orchid"</i> and the artwork page lists them under <b>Available on</b>.</p>
        <div class="wpick" style="grid-template-columns:1fr">
          <label><input type="checkbox" id="wConnect" checked><span><strong>Connect ${esc(W.title || 'this mandala')} to ${W.types.length ? esc(W.types.join(', ')) : 'the selected products'}</strong><br><small>Creates one product per type, linked to this artwork</small></span></label>
        </div>`;
      if (s === 5) wbody.innerHTML = `
        <h3 class="a-h2">Preview your page</h3>
        ${previewCard(W)}`;
      if (s === 6) wbody.innerHTML = W.slug
        ? previewCard(W) + `<div class="wstep-done-card" style="border:1px solid var(--line2);border-radius:14px;margin-top:18px">
            <div class="big">✦ YOUR DAILY MANDALA IS LIVE ✦</div>
            <p class="a-lede">${esc(W.title)} is now Today's Mandala — linked to ${W.types.length} products.</p>
            <div class="w-share-link" id="shareLink">${location.origin}/artwork/${esc(W.slug)}</div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <button class="a-btn a-btn-gold" id="copyLink">⧉ Copy Social Link</button>
              <button class="a-btn" id="shareNative">Share…</button>
              <a class="a-btn a-btn-purple" target="_blank" href="/artwork/${esc(W.slug)}">View artwork ↗</a>
              <a class="a-btn" target="_blank" href="/shop">Shop products ↗</a>
            </div>
            <p class="sub" style="font-size:.75rem;color:var(--ink-faint);margin-top:14px">Share on Facebook · Pinterest · X — customers land straight on a purchase-ready page.</p>
          </div>`
        : `<h3 class="a-h2">Ready to publish?</h3>
           <p class="a-lede">Step back through the preview and press publish to make this artwork live as Today's Mandala, or save as a draft.</p>`;
      if (W.step === 6 && W.slug) {
        const shareUrl = location.origin + '/artwork/' + W.slug;
        $('#copyLink').onclick = () => { navigator.clipboard.writeText(shareUrl); toast('Social link copied', 'ok'); };
        const native = $('#shareNative'); if (native && navigator.share) native.onclick = () => navigator.share({ title: W.title, url: shareUrl }); else if (native) native.style.display = 'none';
      }

      const drop = $('#wDrop'); if (drop) {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
        input.onchange = () => uploadFile(input.files[0]).then(url => { W.artwork = url; toast('Artwork uploaded'); paint(); }).catch(e => toast(e.message, 'err'));
        drop.onclick = () => input.click();
      }
      const connect = $('#wConnect'); if (connect) connect.onchange = () => W.connect = connect.checked;
      const wTitle = $('#wTitle'); if (wTitle) wTitle.oninput = () => { W.title = wTitle.value; };
      const wDate = $('#wDate'); if (wDate) wDate.oninput = () => W.date = wDate.value;
      const wInt = $('#wInt'); if (wInt) wInt.oninput = () => W.intention = wInt.value;
      const wNote = $('#wNote'); if (wNote) wNote.oninput = () => W.note = wNote.value;
      const wDesc = $('#wDesc'); if (wDesc) wDesc.oninput = () => W.desc = wDesc.value;
      const wCat = $('#wCat'); if (wCat) wCat.onchange = () => W.cat = wCat.value;
      $$('.wpick input[type=checkbox]').forEach(cb => cb.onchange = () => { W.types = $$('.wpick input:checked').map(c => c.value); });
    }

    function previewCard(W) {
      const prods = W.types.map(t => `<span class="a-badge b-feat">${esc(t)}</span>`).join(' ') || '<span class="a-badge b-dim">No products selected</span>';
      return `<div style="display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start" class="preview-row">
        <img src="${esc(W.artwork || '/assets/img/logo-mark.svg')}" style="width:100%;border-radius:14px;border:1px solid var(--line2)">
        <div><div style="color:var(--gold2);font-style:italic">✦ Today's Mandala · ${esc(W.date || 'today')}</div>
          <h3 style="font-size:1.6rem;margin:8px 0">${esc(W.title || 'Untitled Mandala')}</h3>
          <p style="color:var(--ink-dim)">${esc(W.intention || '')}</p>
          ${W.note ? `<p style="font-size:.82rem;color:var(--ink-faint);font-style:italic">${esc(W.note)}</p>` : ''}
          <div class="b-row" style="margin-top:14px">${prods}</div>
          <p style="font-size:.8rem;color:var(--ok);margin-top:12px">✓ Public page: /artwork/${esc(slugFrom(W.title))} · connected to ${W.types.length || 0} products</p>
        </div></div>`;
    }
    const slugFrom = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    wBack.onclick = () => { if (W.step > 1) { W.step--; paint(); } };
    wCancel.onclick = () => navigate('artworks');
    wNext.onclick = async () => {
      if (W.step === 1) { if (!W.artwork) return toast('Upload an artwork first', 'err'); W.step = 2; paint(); return; }
      if (W.step === 2) { if (!W.title.trim() || !W.intention.trim()) return toast('Title and intention are required', 'err'); W.step = 3; paint(); return; }
      if (W.step === 3) { if (!W.types.length) return toast('Select at least one product type', 'err'); W.step = 4; paint(); return; }
      if (W.step === 4) { W.connect = $('#wConnect') ? $('#wConnect').checked : true; if (!W.connect) return toast('Keep "Connect" ticked so the artwork is linked to its products', 'err'); W.step = 5; paint(); return; }
      if (W.step === 5) {
        const slug = slugFrom(W.title);
        const art = await api('/admin/artworks', { method: 'POST', body: {
          title: W.title, slug, artwork_date: W.date, category: W.cat, intention: W.intention, description: W.desc, artist_note: W.note,
          image_url: W.artwork, thumbnail_url: W.artwork, status: 'published', is_daily_mandala: 1, is_featured: 1,
        } });
        for (const t of W.types) {
          await api('/admin/products', { method: 'POST', body: { title: W.title + ' ' + t, artwork_id: art.id, product_type: t, category: t, status: 'published', price: TYPES.find(x => x.t === t).base } });
        }
        W.slug = slug; W.step = 6;
        toast('Today\'s mandala is live ✦', 'ok'); paint(); return;
      }
    };
    paint();
  };

  /* ---------------- Products ---------------- */
  register('products', async (params) => {
    const q = params.q || ''; const st = params.st || ''; const wf = params.wf || ''; const pg = params.pg || 1;
    const qs = new URLSearchParams({ search: q, status: st, workflow: wf, page: pg, limit: 30 });
    const data = await api('/admin/products?' + qs);
    const rows = data.items.map(p => {
      const wb = p.workflow_status === 'published' || p.workflow_status === 'active' ? 'b-pub' : p.workflow_status === 'imported' ? 'b-draft' : 'b-dim';
      return `<tr>
      <td><img class="a-thumb" src="${esc(p.image_url)}" alt=""></td>
      <td><strong>${esc(p.title)}</strong><div class="sub" style="font-size:.72rem;color:var(--ink-faint)">${esc(p.product_type)} · ${p.yoycol_product_id ? '<span style="color:var(--ok)">Yoycol ✓</span>' : 'manual'}</div></td>
      <td>${esc(((p.artwork_title) || '—'))}</td>
      <td style="font-size:.8rem;color:var(--ink-faint)">${p.yoycol_product_id ? esc(p.yoycol_product_id) : '—'}</td>
      <td class="v" style="font-size:1rem">${p.sale_price != null ? `<s style="color:var(--ink-faint)">${fmtMoney(p.price)}</s> ${fmtMoney(p.sale_price)}` : fmtMoney(p.price)}
        ${p.base_cost ? `<div class="sub" style="font-size:.68rem;color:var(--ink-faint)">cost ${fmtMoney(p.base_cost)}</div>` : ''}</td>
      <td>${p.variants ? p.variants.length : 0}</td>
      <td><span class="a-badge ${p.status === 'published' ? 'b-pub' : 'b-draft'}">${esc(p.status)}</span>
        <span class="a-badge ${wb}">${esc(p.workflow_status || 'draft')}</span>${p.is_featured ? ' <span class="a-badge b-feat">featured</span>' : ''}</td>
      <td><div class="b-row"><button data-act="edit" data-id="${p.id}">Edit</button>
        ${p.workflow_status === 'published' && !p.yoycol_mapping_id ? `<button data-act="publish" data-id="${p.id}" class="gold">Publish to Yoycol</button>` : ''}
        ${p.workflow_status === 'published' && p.yoycol_mapping_id ? `<button data-act="publish" data-id="${p.id}" class="gold">Sync to Yoycol</button>` : ''}
        <button data-act="dup" data-id="${p.id}">Duplicate</button>
        <button data-act="del" data-id="${p.id}" class="danger">Delete</button></div></td></tr>`;
    }).join('') || '<tr><td colspan="8" class="a-empty">No products found.</td></tr>';
    return `<div class="a-card"><div class="toolbar">
      <input type="text" id="pSearch" placeholder="Search products…" value="${esc(q)}">
      <select id="pSt"><option value="">All status</option><option value="published" ${st==='published'?'selected':''}>Published</option><option value="draft" ${st==='draft'?'selected':''}>Draft</option></select>
      <select id="pWf"><option value="">All workflow</option><option value="imported" ${wf==='imported'?'selected':''}>Imported</option><option value="reviewed" ${wf==='reviewed'?'selected':''}>Reviewed</option><option value="published" ${wf==='published'?'selected':''}>Published</option></select>
      <button class="a-btn a-btn-sm" id="pGo">Filter</button>
      <button class="a-btn a-btn-gold a-btn-sm" id="pNew">+ Add Product</button>
      <button class="a-btn a-btn-sm" data-go="yoycol">⇄ Import from Yoycol</button>
    </div>
    <div style="overflow-x:auto"><table class="a-table"><thead><tr><th></th><th>Product</th><th>Artwork</th><th>Yoycol ID</th><th>Price</th><th>Variants</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${pager(data.total, pg, '#/products')}</div>`;
  });

  VIEW_BINDS.products = () => {
    $('#pGo').onclick = () => navigate('products', { q: $('#pSearch').value.trim(), st: $('#pSt').value, wf: $('#pWf').value });
    $('#pSearch').addEventListener('keydown', e => { if (e.key === 'Enter') $('#pGo').click(); });
    $('#pNew').onclick = () => productEditor(null);
    $$('[data-go]').forEach(b => b.onclick = () => navigate(b.dataset.go));
    $$('.b-row').forEach(row => row.querySelectorAll('button').forEach(btn => {
      btn.onclick = async () => {
        const id = +btn.dataset.id, act = btn.dataset.act;
        if (act === 'edit') await productEditor(id);
        if (act === 'dup') { await api('/admin/products/' + id + '/duplicate', { method: 'POST' }); toast('Duplicated as draft', 'ok'); navigate('products'); }
        if (act === 'publish') {
          if (!confirm('Publish this product to Yoycol? It must have a linked artwork and at least one variant with a Yoycol SKU.')) return;
          try {
            await api('/admin/products/' + id + '/publish-to-yoycol', { method: 'POST' });
            toast('Product published to Yoycol', 'ok'); navigate('products');
          } catch (e) { toast(e.message || 'Publish failed — map a Yoycol SKU on a variant first', 'err'); }
        }
        if (act === 'del') { if (confirm('Delete this product?')) { await api('/admin/products/' + id, { method: 'DELETE' }); toast('Deleted'); navigate('products'); } }
      };
    }));
  };

  async function productEditor(id) {
    let existing = { status: 'draft', price: 0, variants: [], workflow_status: 'draft' };
    let artList = [];
    if (id) existing = await api('/admin/products?' + new URLSearchParams({ limit: 500 })).then(d => d.items.find(x => x.id === id)) || existing;
    try { artList = (await api('/admin/artworks?' + new URLSearchParams({ limit: 500 }))).items; } catch (e) {}
    let variants = (existing.variants || []).map(v => ({ size: v.size, color: v.color, price: v.price, yoycol_sku_code: v.yoycol_sku_code, yoycol_design_code: v.yoycol_design_code }));

    openModal(`
      <div class="a-modal-head"><button class="a-close" onclick="document.querySelector('.a-modal-back').click()">✕</button><h3>${id ? 'Edit Product' : 'New Product'}</h3></div>
      <div class="a-form">
        <div class="frow"><div><label>Title</label><input id="pTitle" value="${esc(existing.title || '')}"></div>
        <div><label>Product type</label><select id="pType"><option>Art Print</option><option>Canvas</option><option>T-Shirt</option><option>Hoodie</option><option>Home Decor</option><option>Accessories</option></select></div></div>
        <div class="frow"><div><label>Base price ($)</label><input id="pPrice" type="number" step="0.01" value="${existing.price || 0}"></div>
        <div><label>Base cost ($) <span style="color:var(--ink-faint)">— never shown to customers</span></label><input id="pCost" type="number" step="0.01" value="${existing.base_cost || 0}"></div></div>
        <div class="frow"><div><label>Linked artwork</label><select id="pArt"><option value="">— none —</option>${artList.map(a => `<option value="${a.id}" ${existing.artwork_id == a.id || existing.artwork_title === a.title ? 'selected' : ''}>${esc(a.title)}</option>`).join('')}</select></div>
        <div><label>Workflow</label><select id="pWorkflow"><option value="draft">Draft</option><option value="imported">Imported (catalog)</option><option value="reviewed">Reviewed</option><option value="published">Published</option></select></div></div>
        <div><label>Description <span style="color:var(--ink-faint)">— stay warm & human</span></label><textarea id="pDesc" class="a-textarea" style="min-height:60px">${esc(existing.description || '')}</textarea></div>
        <label>Variants <span style="color:var(--ink-faint)">(size / color / price / Yoycol SKU / design code)</span></label>
        <div id="vRows">${variants.map((v, i) => `<div class="a-field-row">
          <input class="a-field" data-k="size" data-i="${i}" value="${esc(v.size || '')}" placeholder="Size">
          <input class="a-field" data-k="color" data-i="${i}" value="${esc(v.color || '')}" placeholder="Color">
          <input class="a-field a-field-sm" data-k="price" data-i="${i}" type="number" step="0.01" value="${v.price != null ? v.price : ''}" placeholder="Price">
          <input class="a-field a-field-sm" data-k="yoycol_sku_code" data-i="${i}" value="${esc(v.yoycol_sku_code || '')}" placeholder="Yoycol SKU">
          <input class="a-field a-field-sm" data-k="yoycol_design_code" data-i="${i}" value="${esc(v.yoycol_design_code || '')}" placeholder="Design code">
          <button class="a-btn a-btn-sm a-btn-danger vDel" data-i="${i}">✕</button></div>`).join('') || '<p class="a-empty" id="noV">No variants yet</p>'}</div>
        <div><button class="a-btn a-btn-sm" id="addV">+ Add variant</button>
        <button class="a-btn a-btn-sm" id="fetchYoy" ${existing.yoycol_product_id ? '' : 'style="display:none"'}>⇄ Fetch Yoycol variants & cost</button></div>
        <div class="frow"><div><label>Status</label><select id="pStatus"><option value="draft">Draft</option><option value="published">Published</option></select></div>
        <div style="display:flex;align-items:end"><label><input type="checkbox" id="pFeat" style="width:auto" ${existing.is_featured ? 'checked' : ''}> Featured</label></div></div>
        ${existing.yoycol_product_id ? `<p class="a-lede" style="font-size:.78rem">Yoycol catalog ID <code style="color:var(--gold2)">${esc(existing.yoycol_product_id)}</code> ${existing.yoycol_mapping_id ? '· live mapping #' + existing.yoycol_mapping_id : '· not yet mapped'}</p>` : ''}
        <div class="a-actions"><button class="a-btn">Cancel</button><button class="a-btn a-btn-gold" id="saveP">${id ? 'Save Changes' : 'Create Product'}</button></div>
      </div>`);
    if (existing.product_type) $('#pType').value = existing.product_type;
    $('#pStatus').value = existing.status || 'draft';
    $('#pWorkflow').value = existing.workflow_status || 'draft';
    const bindV = () => $$('.vDel').forEach(b => b.onclick = () => { b.parentNode.remove(); });
    const addRow = (v = {}) => { $('#noV')?.remove(); const n = $$('#vRows .a-field-row').length; $('#vRows').insertAdjacentHTML('beforeend', `<div class="a-field-row">
      <input class="a-field" data-k="size" data-i="${n}" value="${esc(v.size || '')}" placeholder="Size">
      <input class="a-field" data-k="color" data-i="${n}" value="${esc(v.color || '')}" placeholder="Color">
      <input class="a-field a-field-sm" data-k="price" data-i="${n}" type="number" step="0.01" value="${v.price != null ? v.price : ''}" placeholder="Price">
      <input class="a-field a-field-sm" data-k="yoycol_sku_code" data-i="${n}" value="${esc(v.yoycol_sku_code || '')}" placeholder="Yoycol SKU">
      <input class="a-field a-field-sm" data-k="yoycol_design_code" data-i="${n}" value="${esc(v.yoycol_design_code || '')}" placeholder="Design code">
      <button class="a-btn a-btn-sm a-btn-danger vDel" data-i="${n}">✕</button></div>`); bindV(); };
    $('#addV').onclick = () => addRow();
    const fetcher = $('#fetchYoy'); if (fetcher) fetcher.onclick = async () => {
      try {
        const r = await api('/admin/products/' + id + '/fetch-yoycol', { method: 'POST' });
        if (r.variants && r.variants.length) {
          $('#vRows').innerHTML = '';
          r.variants.forEach(v => addRow({ size: v.size, color: v.color, price: v.price, yoycol_sku_code: v.skuCode || v.sku_code }));
          toast('Variants imported from Yoycol', 'ok');
        }
        if (r.basePrice) $('#pCost').value = r.basePrice;
        toast('Fetched Yoycol details', 'ok');
      } catch (e) { toast(e.message, 'err'); }
    };
    bindV();
    $('#saveP').onclick = async () => {
      const rows = $$('#vRows .a-field-row').map(r => ({ size: r.querySelector('[data-k=size]').value, color: r.querySelector('[data-k=color]').value, price: +(r.querySelector('[data-k=price]').value || 0), yoycol_sku_code: r.querySelector('[data-k=yoycol_sku_code]') ? r.querySelector('[data-k=yoycol_sku_code]').value : '', yoycol_design_code: r.querySelector('[data-k=yoycol_design_code]') ? r.querySelector('[data-k=yoycol_design_code]').value : '' }));
      const body = {
        title: $('#pTitle').value.trim(), product_type: $('#pType').value, price: +$('#pPrice').value,
        base_cost: +($('#pCost').value || 0), artwork_id: $('#pArt').value || undefined, description: $('#pDesc').value.trim(),
        category: $('#pType').value, status: $('#pStatus').value, workflow_status: $('#pWorkflow').value, is_featured: $('#pFeat').checked ? 1 : 0,
        variants: rows,
      };
      if (!body.title || !body.price) return toast('Title and price are required', 'err');
      if (id) await api('/admin/products/' + id, { method: 'PUT', body });
      else await api('/admin/products', { method: 'POST', body });
      toast('Product saved'); closeModal(); navigate('products');
    };
  }

  /* ---------------- Orders ---------------- */
  const ORDER_STATUSES = ['placed', 'paid', 'processing', 'submitted_yoycol', 'in_production', 'shipped', 'delivered', 'cancelled', 'failed', 'requires_attention'];
  const statusBadge = o => {
    const cls = o.status === 'shipped' || o.status === 'delivered' ? 'b-pub' : (o.status === 'cancelled' || o.status === 'failed' ? 'b-dim' : o.status === 'requires_attention' ? 'b-warn' : 'b-draft');
    return `<span class="a-badge ${cls}">${esc(o.status)}</span>`;
  };
  register('orders', async (params) => {
    const st = params.st || ''; const pg = params.pg || 1;
    const qs = new URLSearchParams({ status: st, page: pg, limit: 30 });
    const data = await api('/admin/orders?' + qs);
    const rows = data.items.map(o => `<tr>
      <td><strong>${esc(o.order_number)}</strong><div class="sub" style="font-size:.7rem;color:var(--ink-faint)">${esc((o.created_at || '').slice(0, 10))}</div></td>
      <td>${esc(o.shipping_name)}<div class="sub" style="font-size:.7rem;color:var(--ink-faint)">${esc(o.shipping_email)}</div></td>
      <td>${fmtMoney(o.total)}</td>
      <td><span class="a-badge ${pBadge(o.payment_status)}">${esc(o.payment_status)}</span></td>
      <td>${statusBadge(o)}</td>
      <td style="font-size:.74rem;color:var(--ink-faint)">${o.yoycol_order_id ? 'Yoycol #' + esc(o.yoycol_order_id) : (o.fulfillment_status === 'manual_required' ? '<span class="a-badge b-warn">manual</span>' : '—')}</td>
      <td><button data-act="view" data-n="${esc(o.order_number)}" class="a-btn a-btn-sm">Open</button></td></tr>`).join('') || '<tr><td colspan="7" class="a-empty">No orders</td></tr>';
    return `<div class="a-card"><div class="toolbar">
      <select id="oSt"><option value="">All statuses</option>
        ${ORDER_STATUSES.map(s => `<option value="${s}" ${st === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
      </select>
      <button class="a-btn a-btn-sm" id="oGo">Filter</button>
    </div>
    <div style="overflow-x:auto"><table class="a-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Fulfilment</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    ${pager(data.total, pg, '#/orders')}</div>`;
  });

  VIEW_BINDS.orders = () => {
    $('#oGo').onclick = () => navigate('orders', { st: $('#oSt').value });
    $$('[data-act="view"]').forEach(b => b.onclick = () => orderDetail(b.dataset.n));
  };

  async function refreshTrackingFor(number, cb) {
    try {
      const r = await api('/api/admin/orders/' + number + '/refresh-tracking', { method: 'POST', body: {} });
      toast('Tracking refreshed' + (r.label ? ' — ' + r.label : ''), 'ok');
      cb && cb();
    } catch (e) { toast(e.message, 'err'); }
  }

  async function orderDetail(number) {
    const o = await api('/admin/orders/' + number);
    const tl = [['placed', 'Placed'], ['paid', 'Paid'], ['processing', 'Processing'], ['submitted_yoycol', 'Submitted to Yoycol'], ['in_production', 'In Production'], ['shipped', 'Shipped'], ['delivered', 'Delivered']];
    let idx = tl.findIndex(([k]) => k === o.status);
    if (idx < 0) idx = ['cancelled', 'failed', 'requires_attention'].includes(o.status) ? 2 : tl.length - 1;
    if (o.payment_status === 'paid' && idx < 1) idx = 1;
    const timeline = tl.map(([k, label], i) => { const on = i <= idx; return `<span class="tl-node ${on ? 'on' : ''}">${label}</span>`; }).join('<span style="color:var(--line2)">→</span>');
    const items = o.items.map(i => `<tr><td>${esc(i.title)}</td><td>${esc(i.size)}</td><td>${i.quantity}</td><td>${fmtMoney(i.price)}</td></tr>`).join('');
    const manual = o.fulfillment_status === 'manual_required';
    openModal(`
      <div class="a-modal-head"><button class="a-close" onclick="document.querySelector('.a-modal-back').click()">✕</button><h3>Order ${esc(o.order_number)}</h3></div>
      ${manual ? `<div class="a-callout" style="border:1px solid rgba(255,80,110,.4);background:rgba(255,80,110,.06);border-radius:12px;padding:12px;font-size:.85rem">
        ⚠ Requires attention — Yoycol was unavailable, so fulfil this order manually (mark shipped + tracking) or retry submission after fixing credentials.</div>` : ''}
      <div class="timeline">${timeline}</div>
      <div class="stat-split">
        <div><div class="k" style="font-size:.7rem;color:var(--ink-faint);letter-spacing:.14em">CUSTOMER</div>
          <p>${esc(o.shipping_name)}<br>${esc(o.shipping_email)}</p>
          <p class="sub" style="color:var(--ink-faint);font-size:.78rem">${esc(o.shipping_address)}, ${esc(o.shipping_city)}, ${esc(o.shipping_state)} ${esc(o.shipping_zip)}, ${esc(o.shipping_country)}</p></div>
        <div><div class="k" style="font-size:.7rem;color:var(--ink-faint);letter-spacing:.14em">SUMMARY</div>
          <p>Subtotal ${fmtMoney(o.subtotal)} · Shipping ${fmtMoney(o.shipping)}<br><strong>Total ${fmtMoney(o.total)}</strong></p>
          <p class="sub" style="color:var(--ink-faint);font-size:.78rem">Payment: <span class="a-badge ${pBadge(o.payment_status)}">${esc(o.payment_status)}</span><br>
          ${o.yoycol_order_id ? 'Yoycol order: <b>' + esc(o.yoycol_order_no || o.yoycol_order_id) + '</b>' : (manual ? '<b style="color:var(--bad)">manual fulfillment</b>' : 'not submitted')}
          ${o.carrier ? '<br>Carrier: ' + esc(o.carrier) : ''}</p></div>
      </div>
      <table class="a-table" style="margin-top:14px"><thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead><tbody>${items}</tbody></table>
      <div class="a-form" style="margin-top:14px">
        <div class="frow"><div><label>Update status</label>
          <select id="oStatus">${ORDER_STATUSES.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
        <div><label>Tracking number</label><input id="oTrack" value="${esc(o.tracking_number || '')}"></div>
        ${o.carrier ? `<div><label>Carrier</label><input id="oCarrier" value="${esc(o.carrier || '')}"></div>` : ''}</div>
        <div class="a-field-row" style="flex-wrap:wrap">
          ${o.yoycol_order_id ? `<button class="a-btn a-btn-sm" id="oRefresh">⇄ Refresh tracking</button>` : ''}
          ${!o.yoycol_order_id && o.payment_status === 'paid' ? `<button class="a-btn a-btn-sm a-btn-gold" id="oSubmit">⇄ Submit to Yoycol</button>
          <button class="a-btn a-btn-sm" id="oManual">Manual fulfill…</button>` : ''}
          <button class="a-btn a-btn-gold a-btn-sm" id="oSave">Save Changes</button>
        </div>
      </div>`);
    $('#oStatus').value = o.status;
    const rtr = $('#oRefresh'); if (rtr) rtr.onclick = () => refreshTrackingFor(number, () => closeModal());
    const oSub = $('#oSubmit'); if (oSub) oSub.onclick = async () => {
      try {
        const r = await api('/admin/orders/' + number + '/submit-yoycol', { method: 'POST', body: {} });
        toast(r.yoycolOrderId ? 'Submitted to Yoycol — ' + r.yoycolOrderId : 'Submitted', 'ok'); closeModal(); navigate('orders');
      } catch (e) { toast(e.message, 'err'); }
    };
    const oMan = $('#oManual'); if (oMan) oMan.onclick = async () => {
      await api('/admin/orders/' + number + '/manual-fulfill', { method: 'POST', body: { status: 'processing' } });
      toast('Marked for manual fulfillment', 'ok'); closeModal(); navigate('orders');
    };
    $('#oSave').onclick = async () => {
      await api('/admin/orders/' + number, { method: 'PUT', body: { status: $('#oStatus').value, tracking_number: $('#oTrack').value.trim(), carrier: $('#oCarrier') ? $('#oCarrier').value.trim() : undefined } });
      toast('Order updated'); closeModal(); navigate('orders', { st: $('#oStatus').value });
    };
  }

  /* ---------------- Customers ---------------- */
  register('customers', async (params) => {
    const q = params.q || ''; const pg = params.pg || 1;
    const data = await api('/admin/customers?' + new URLSearchParams({ search: q, page: pg, limit: 40 }));
    const rows = data.items.map(u => `<tr>
      <td><strong>${esc(u.name)}</strong></td><td>${esc(u.email)}</td>
      <td>${u.orderCount} orders</td><td>${fmtMoney(u.spent)}</td>
      <td style="color:var(--ink-faint);font-size:.78rem">${esc((u.created_at || '').slice(0, 10))}</td></tr>`).join('') || '<tr><td colspan="5" class="a-empty">No customers yet</td></tr>';
    return `<div class="a-card"><div class="toolbar"><input type="text" id="cSearch" placeholder="Search customers…" value="${esc(q)}">
      <button class="a-btn a-btn-sm" id="cGo">Search</button></div>
      <table class="a-table"><thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Spent</th><th>Joined</th></tr></thead><tbody>${rows}</tbody></table>
      ${pager(data.total, pg, '#/customers')}</div>`;
  });
  VIEW_BINDS.customers = () => {
    $('#cGo').onclick = () => navigate('customers', { q: $('#cSearch').value.trim() });
    $('#cSearch').addEventListener('keydown', e => { if (e.key === 'Enter') $('#cGo').click(); });
  };

  /* ---------------- Messages ---------------- */
  register('messages', async () => {
    const d = await api('/admin/contact');
    const badge = d.unread ? `<span class="a-badge b-feat">${d.unread} unread</span>` : '';
    const rows = d.items.map(m => `<div class="a-msg${m.replied ? '' : ' a-msg-new'}">
      <div class="a-msg-head">
        <strong>${esc(m.name)}</strong> <span style="color:var(--ink-faint)">·</span> <a href="mailto:${esc(m.email)}">${esc(m.email)}</a>
        <span class="a-badge">${esc(m.subject)}</span>
        <span style="margin-left:auto;color:var(--ink-faint);font-size:.76rem">${esc((m.created_at || '').slice(0, 16))}</span>
      </div>
      <p>${esc(m.message)}</p>
      <div class="b-row"><button class="a-btn a-btn-sm" data-msg-reply="${m.id}" data-now="${m.replied ? 1 : 0}">${m.replied ? 'Mark unread' : 'Mark replied'}</button></div>
    </div>`).join('') || '<p class="a-empty">No messages yet — the contact form on the website delivers them here.</p>';
    return `<div class="a-card"><div class="toolbar"><div class="k">Studio Messages</div>${badge}</div>${rows}</div>`;
  });
  VIEW_BINDS.messages = () => {
    $$('[data-msg-reply]').forEach(b => b.onclick = async () => {
      const id = b.dataset.msgReply;
      const now = b.dataset.now === '1' ? 0 : 1;
      try {
        await api('/admin/contact/' + id + '/replied', { method: 'POST', body: { replied: now } });
        toast(now ? 'Marked as replied' : 'Marked as unread', 'ok');
      } catch (e) { toast(e.message, 'err'); }
      navigate('messages');
    });
  };

  /* ---------------- Yoycol ---------------- */
  register('yoycol', async () => {
    const st = await api('/admin/yoycol');
    const cred = await api('/admin/yoycol/credentials');
    const logs = await api('/admin/yoycol/logs?limit=40');
    const errLogs = logs.filter(l => l.status === 'error' && l.retryable);
    const logRows = logs.map(l => `<tr>
      <td>${esc((l.created_at || '').slice(5, 19))}</td>
      <td>${esc((l.entity_id || '').slice(0, 22)) || '—'}</td>
      <td>${esc(l.type)}</td>
      <td><span class="a-badge ${l.status === 'success' || l.status === 'manual' ? 'b-pub' : l.status === 'error' ? 'b-dim' : 'b-draft'}">${esc(l.status)}</span></td>
      <td style="font-size:.78rem">${esc(l.message)}</td>
      ${l.status === 'error' && l.retryable ? `<td><button class="a-btn a-btn-sm" data-retry-type="${esc(l.type)}" data-retry-id="${esc(l.entity_id)}">Retry</button></td>` : '<td></td>'}</tr>`).join('') || '<tr><td colspan="6" class="a-empty">No sync activity yet</td></tr>';

    const connCard = st.connected
      ? `<div class="a-card con-ok"><div class="k">Connection</div><div class="v" style="font-size:1.3rem;color:var(--ok)">● Connected</div>
          <div class="sub">API key + secret present · ${esc(cred.baseUrl || 'https://www.yoycol.com')}</div>
          <div class="b-row" style="margin-top:14px"><button class="a-btn" id="testConn">Test connection</button>
          ${cred.keyConfiguredInEnv ? '<span class="a-badge b-feat">from .env</span>' : ''}</div></div>`
      : `<div class="a-card"><div class="k">Connection</div><div class="v" style="font-size:1.3rem;color:var(--warn)">○ Not connected</div>
          <div class="sub">Store runs in graceful demo mode — orders are queued for a manual review workflow.</div>
          <div class="b-row" style="margin-top:14px"><button class="a-btn" id="testConn">Test connection</button>
          <button class="a-btn a-btn-gold a-btn-sm" data-go="settings">Configure credentials →</button></div></div>`;

    return `<div class="cards">
      ${connCard}
      <div class="a-card"><div class="k">Imported</div><div class="v">${st.productsImported || 0}</div><div class="sub">catalog drafts reviewed</div></div>
      <div class="a-card"><div class="k">Published</div><div class="v" style="color:var(--gold)">${st.productsConnected || 0}</div><div class="sub">live self-store mappings</div></div>
      <div class="a-card"><div class="k">Orders Sent</div><div class="v">${st.ordersSynced || 0}</div><div class="sub">${st.pendingOrders || 0} pending · ${st.manualOrders || 0} manual</div></div>
      <div class="a-card"><div class="k">Sync Errors</div><div class="v" style="color:${st.syncErrors ? 'var(--bad)' : 'var(--ok)'}">${st.syncErrors || 0}</div><div class="sub">${st.lastSync ? 'last ' + esc((st.lastSync || '').slice(0, 19)) : 'no sync yet'}</div></div>
    </div>
    ${st.syncErrors ? `<div class="a-card" style="border-color:rgba(255,80,110,.4)"><div class="a-h2">⚠ Recoverable errors — ${errLogs.length} retry ready</div>
      <div class="b-row">${errLogs.map(l => `<button class="a-btn a-btn-sm" data-retry-type="${esc(l.type)}" data-retry-id="${esc(l.entity_id)}">Retry ${esc(l.type)} ${esc((l.entity_id || '').slice(0, 14))}</button>`).join('')}</div></div>` : ''}
    <div class="a-grid2">
      <div class="a-card"><div class="a-h2">Sync Controls</div>
        <p class="a-lede" style="margin-bottom:16px">${st.connected ? 'Connected to the Yoycol API — you can pull catalog products and push orders.' : 'Yoycol is not configured yet — the store runs in <b>demo mode</b> and paid orders land in <b>Needs Attention</b>. Add credentials in <a href="#/settings">Settings</a> to run the live pipeline.'}</p>
        <div class="a-field-row">
          <button class="a-btn a-btn-gold" id="syncProds">⇄ Import Catalog</button>
          <button class="a-btn" id="syncOrders">⇄ Pull Order Status</button>
          <span id="syncMsg" style="font-size:.8rem;color:var(--ink-faint)"></span>
        </div>
        <details class="a-detail" style="margin-top:14px">
          <summary><b>Import Catalog forward</b></summary>
          <div class="a-form" style="margin-top:8px"><input id="impKw" placeholder="Keyword (blank = first page)">
            <div class="b-row"><button class="a-btn a-btn-sm" id="impGo">Import as drafts</button></div>
            <p class="a-lede" style="font-size:.78rem">Pulls Yoycol catalog products into the store as <b>draft</b> products you review (price, variants, artwork). Only reviewed products with a mapped Yoycol variant SKU can be published.</p></div>
        </details>
        <details class="a-detail" style="margin-top:10px">
          <summary><b>Live mappings</b></summary>
          <div id="mapList" style="margin-top:10px">
            <div class="a-empty">Loading…</div>
          </div>
        </details>
        <div style="margin-top:18px;border-top:1px solid var(--line);padding-top:14px">
          <div class="a-h2" style="font-size:.9rem">Pipeline</div>
          <p class="a-lede" style="font-size:.82rem">Import → Review → <b>Connect artwork</b> → set store price → <b>Preview</b> → <b>Publish</b>. Store products keep their own IDs and store the Yoycol reference, so the storefront never depends on Yoycol IDs. Design/template creation happens in the <b>Yoycol studio</b> (not exposed by their current API).</p>
        </div>
      </div>
      <div class="a-card"><div class="a-h2">Last Events</div><div style="overflow-x:auto"><table class="a-table"><thead><tr><th>Time</th><th>Entity</th><th>Type</th><th>Status</th><th>Message</th><th></th></tr></thead><tbody>${logRows}</tbody></table></div></div>
    </div>`;
  });
  VIEW_BINDS.yoycol = () => {
    const flash = m => { const el = $('#syncMsg'); if (el) el.textContent = m; };
    $('#testConn').onclick = async () => {
      flash('Testing…');
      try {
        const r = await api('/admin/yoycol/test', { method: 'POST', body: {} });
        toast(r.ok ? 'Yoycol connection OK' : 'Test failed — ' + (r.message || 'check credentials'), r.ok ? 'ok' : 'err');
        flash(r.ok ? 'Connected ✓' : 'Failed: ' + (r.message || ''));
        navigate('yoycol');
      } catch (e) { toast(e.message, 'err'); flash('Test error'); }
    };
    $('#syncProds').onclick = async () => { flash('Importing…'); try { const r = await api('/admin/yoycol/sync', { method: 'POST', body: { scope: 'products' } }); flash(`Imported ${r.created || 0} new · ${r.skipped || 0} existing`); toast('Catalog import done', 'ok'); navigate('yoycol'); } catch (e) { flash('Import failed — ' + e.message); toast(e.message, 'err'); } };
    $('#syncOrders').onclick = async () => { flash('Pulling order status…'); try { const r = await api('/admin/yoycol/sync', { method: 'POST', body: { scope: 'orders' } }); flash(`Updated ${r.updated || 0} orders`); toast('Order sync done', 'ok'); navigate('yoycol'); } catch (e) { flash('Sync failed — ' + e.message); toast(e.message, 'err'); } };
    const imp = $('#impGo'); if (imp) imp.onclick = async () => {
      const kw = ($('#impKw') || {}).value || '';
      flash('Importing…');
      try { const r = await api('/admin/yoycol/sync', { method: 'POST', body: { scope: 'products', keyword: kw } }); flash(`Imported ${r.created || 0} · ${r.skipped || 0} already stored`); toast('Catalog import complete', 'ok'); navigate('yoycol'); }
      catch (e) { flash('Import failed — ' + e.message); toast(e.message, 'err'); }
    };
    // Load live self-store mappings into the details block.
    api('/admin/yoycol/mappings').then(m => {
      const el = $('#mapList'); if (!el) return;
      const list = (m.items || []).map(x => `<div style="padding:8px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:10px">
        <span style="font-size:.82rem"><b>${esc(x.productName || x.store_product_name || 'Product')}</b> · ${esc(x.skuCode || x.sku_code || '—')}</span>
        <span class="a-badge b-feat">#${esc(x.productId || x.mappingId || '—')}</span></div>`).join('') || '<p class="a-empty">No live mappings yet</p>';
      el.innerHTML = list;
    }).catch(() => { const el = $('#mapList'); if (el) el.innerHTML = '<p class="a-empty">Could not load mappings (unavailable in demo mode).</p>'; });
    // Retry buttons (RECENTLY added logs + recoverable banner).
    $$('[data-retry-type]').forEach(b => b.onclick = async () => {
      try {
        const r = await api('/admin/yoycol/retry', { method: 'POST', body: { type: b.dataset.retryType, id: b.dataset.retryId ? +b.dataset.retryId : undefined } });
        toast('Retry done', 'ok'); navigate('yoycol');
      } catch (e) { toast(e.message, 'err'); }
    });
  };

  /* ---------------- Analytics ---------------- */
  register('analytics', async () => {
    const a = await api('/admin/analytics');
    const barRows = a.daily.map(d => `<div style="display:flex;gap:8px;align-items:center;font-size:.78rem"><span style="width:52px;color:var(--ink-faint)">${esc((d.day || '').slice(5))}</span><div style="flex:1;background:rgba(212,175,55,.08);border-radius:99px;height:14px"><div style="height:100%;width:${Math.min(100, Math.round(d.views / (Math.max(...a.daily.map(x => x.views), 1)) * 100))}%;background:linear-gradient(90deg,var(--purple),var(--gold));border-radius:99px"></div></div><b style="width:40px;text-align:right">${d.views}</b></div>`).join('') || '<p class="a-empty">No traffic yet</p>';
    const pages = a.topPages.map(p => `<tr><td>${esc(p.page_type)}</td><td>${esc(p.page_id || '—')}</td><td>${p.views}</td></tr>`).join('');
    const events = a.eventsList.slice(0, 12).map(e => `<tr><td style="font-size:.76rem;color:var(--ink-faint)">${esc((e.created_at || '').slice(5, 19))}</td><td class="a-badge b-feat" style="font-size:.62rem">${esc(e.event_type)}</td><td style="font-size:.8rem">${esc(e.page_type)}${e.page_id ? ' · ' + esc(e.page_id) : ''}</td></tr>`).join('');
    const audit = a.audit.slice(0, 10).map(x => `<tr><td style="font-size:.76rem;color:var(--ink-faint)">${esc((x.created_at || '').slice(5, 19))}</td><td style="font-size:.8rem">${esc(x.action)}</td><td style="font-size:.76rem;color:var(--ink-faint)">${esc(x.entity_type)}${x.entity_id ? ' ' + x.entity_id : ''}</td></tr>`).join('');
    return `<div class="cards">
      <div class="a-card"><div class="k">Page Views</div><div class="v">${a.views}</div><div class="sub">privacy-conscious counts</div></div>
      <div class="a-card"><div class="k">Events</div><div class="v">${a.events}</div><div class="sub">views, carts, purchases</div></div>
    </div>
    <div class="a-grid2">
      <div class="a-card"><div class="a-h2">Views · last ${a.daily.length} days</div>${barRows}</div>
      <div class="a-card"><div class="a-h2">Top Pages</div><table class="a-table"><thead><tr><th>Type</th><th>Page</th><th>Views</th></tr></thead><tbody>${pages || '<tr><td colspan="3" class="a-empty">—</td></tr>'}</tbody></table></div>
    </div>
    <div class="a-grid2">
      <div class="a-card"><div class="a-h2">Customer Actions</div><table class="a-table"><tbody>${events || '<tr><td class="a-empty">—</td></tr>'}</tbody></table></div>
      <div class="a-card"><div class="a-h2">Admin Audit Log</div><table class="a-table"><thead><tr><th>Time</th><th>Action</th><th>Entity</th></tr></thead><tbody>${audit || '<tr><td colspan="3" class="a-empty">—</td></tr>'}</tbody></table></div>
    </div>`;
  });

  /* ---------------- Settings ---------------- */
  register('settings', async () => {
    const s = await api('/admin/settings');
    let cred = { hasKey: false, hasSecret: false, baseUrl: '', keyConfiguredInEnv: false, secretConfiguredInEnv: false };
    try { cred = await api('/admin/yoycol/credentials'); } catch (e) {}
    return `<div class="a-card" style="max-width:760px">
      <div class="a-h2">Store & Brand Settings</div>
      <div class="a-form">
        <div class="frow"><div><label>Store name</label><input id="sName" value="${esc(s.store_name || 'Mandala Magic by OM')}"></div>
        <div><label>Tagline</label><input id="sTag" value="${esc(s.tagline || 'Art Created With Intention.')}"></div></div>
        <div><label>Support email</label><input id="sEmail" value="${esc(s.support_email || 'hello@mandalamagicbyom.com')}"></div>
        <label>About the artist <span style="color:var(--ink-faint)">— used on the About page</span></label><textarea id="sAbout" class="a-textarea" style="min-height:90px">${esc(s.about || '')}</textarea>
        <div class="frow"><div><label>Default currency symbol</label><input id="sCur" value="${esc(s.currency || '$')}"></div>
        <div><label>Free shipping threshold ($)</label><input id="sShip" type="number" value="${esc(s.free_shipping_threshold || '75')}"></div></div>
        <div class="a-actions"><button class="a-btn a-btn-gold" id="sSave">Save Settings</button></div>
      </div>
      <div style="border-top:1px solid var(--line);margin-top:10px;padding-top:16px">
        <div class="a-h2">Yoycol Integration</div>
        <p class="a-lede" style="font-size:.82rem">
          ${cred.keyConfiguredInEnv ? '<span class="a-badge b-feat">API key from server .env</span>' : ''} ${cred.secretConfiguredInEnv ? '<span class="a-badge b-feat">secret from server .env</span>' : ''}
          ${!cred.keyConfiguredInEnv && !cred.secretConfiguredInEnv ? '<span class="a-badge b-draft">not configured</span>' : ''}
          — saved credentials are stored <b>encrypted</b> on the server (AES-256-GCM) and never read back to this panel.
        </p>
        <div class="a-form">
          <div class="frow"><div><label>Yoycol API Key ${cred.hasKey || cred.keyConfiguredInEnv ? '✓' : ''}</label><input id="yKey" type="password" placeholder="${cred.hasKey || cred.keyConfiguredInEnv ? '●●●● (saved — leave blank to keep)' : 'e.g. pasted API key'}"></div>
          <div><label>Yoycol API Secret ${cred.hasSecret || cred.secretConfiguredInEnv ? '✓' : ''}</label><input id="ySecret" type="password" placeholder="${cred.hasSecret || cred.secretConfiguredInEnv ? '●●●● (saved — leave blank to keep)' : 'e.g. pasted API secret'}"></div></div>
          <div class="frow"><div><label>Yoycol base URL</label><input id="yBase" value="${esc(cred.baseUrl || 'https://www.yoycol.com')}"></div>
          <div><label></label><button class="a-btn a-btn-gold" id="ySave">Save Credentials</button></div></div>
          <p class="a-lede" style="font-size:.78rem">Design/template creation for a product happens inside the <b>Yoycol studio</b> — the current Yoycol API does not expose an endpoint for it. This dashboard handles catalog import, mapping variants, publishing products, submitting orders and pulling status trackings.</p>
        </div>
      </div>
      <div style="border-top:1px solid var(--line);margin-top:10px;padding-top:16px">
        <p class="a-lede" style="font-size:.8rem"><strong>Security note:</strong> payment provider keys and SMTP credentials live only in the server-side <code style="color:var(--gold2)">.env</code> file. They are never sent to this panel.</p>
      </div>
    </div>`;
  });
  VIEW_BINDS.settings = () => {
    $('#sSave').onclick = async () => {
      await api('/admin/settings', { method: 'PUT', body: {
        store_name: $('#sName').value, tagline: $('#sTag').value, support_email: $('#sEmail').value,
        about: $('#sAbout').value, currency: $('#sCur').value, free_shipping_threshold: $('#sShip').value,
      } });
      toast('Settings saved', 'ok');
    };
    const ySave = $('#ySave'); if (ySave) ySave.onclick = async () => {
      const body = {};
      const k = $('#yKey').value.trim(), sec = $('#ySecret').value.trim(), base = $('#yBase').value.trim();
      if (k) body.apiKey = k;
      if (sec) body.apiSecret = sec;
      if (base) body.baseUrl = base;
      if (!Object.keys(body).length) return toast('Nothing to save', 'err');
      try {
        const r = await api('/admin/yoycol/credentials', { method: 'PUT', body });
        toast('Credentials saved — ' + (r.hasKey ? 'key ✓' : 'key missing') + ' · ' + (r.hasSecret ? 'secret ✓' : 'secret missing'), 'ok');
        navigate('settings');
      } catch (e) { toast(e.message, 'err'); }
    };
  };

  function pager(total, page, base) {
    const pages = Math.max(1, Math.ceil(total / 30));
    return `<div class="pager"><button class="a-btn a-btn-sm" ${page <= 1 ? 'disabled' : ''} onclick="location.hash='${base.replace('#', '')}/pg/${+page - 1}'">←</button>
      <span>${page} / ${pages}</span>
      <button class="a-btn a-btn-sm" ${page >= pages ? 'disabled' : ''} onclick="location.hash='${base.replace('#', '')}/pg/${+page + 1}'">→</button></div>`;
  }

  /* ---------------- hash routing ---------------- */
  function route() {
    const h = location.hash.replace(/^#\//, '') || 'dashboard';
    const parts = h.split('/');
    let name = parts[0]; let params = {};
    if (name === 'artworks') { params.q = parts[1] && parts[1].startsWith('?') ? parts[1].slice(1) : ''; const pgI = parts.indexOf('pg'); if (pgI >= 0) params.pg = +parts[pgI + 1]; }
    if (name === 'products' || name === 'orders' || name === 'customers') { const pgI = parts.indexOf('pg'); if (pgI >= 0) params.pg = +parts[pgI + 1]; }
    if (!views[name]) name = 'dashboard';
    navigate(name, params);
  }
  window.addEventListener('hashchange', route);

  /* ---------------- Auth / shell wiring ---------------- */
  async function boot() {
    try {
      const s = await ensureCsrf();
      if (s.authenticated && s.role === 'admin') showShell(s);
      else showLogin();
    } catch (e) { showLogin(); }
  }

  function persisted(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }

  function showLogin() {
    $('#login').classList.remove('hidden');
    $('#shell').classList.add('hidden');
  }
  function showShell(s) {
    state.user = s; state.csrf = s.csrf;
    $('#login').classList.add('hidden');
    $('#shell').classList.remove('hidden');
    $('#whoAmI').textContent = s.name || 'Admin';
    $('#openStore').onclick = () => window.open('/', '_blank');
    $('#logoutBtn').onclick = async () => { await api('/auth/logout', { method: 'POST' }); localStorage.clear(); location.hash = ''; boot(); };
    if (!location.hash) location.hash = '#/dashboard';
    route();
  }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    $('#loginErr').textContent = '';
    try {
      await ensureCsrf();
      const user = await api('/auth/login', { method: 'POST', body: { email: fd.get('email'), password: fd.get('password') } });
      if (user.role !== 'admin') throw new Error('This account is not an admin');
      toast('Welcome back, Orchid', 'ok');
      boot();
    } catch (err) { $('#loginErr').textContent = err.message || 'Login failed'; }
  });

  $('#burger').onclick = () => $('#shell .a-sidebar').classList.toggle('open');
  $$('.a-nav-btn').forEach(b => b.onclick = () => { $('#shell .a-sidebar').classList.remove('open'); location.hash = '#/' + b.dataset.view; });

  // Dashboard order link helper
  document.addEventListener('click', e => { const link = e.target.closest('.order-link'); if (link) { e.preventDefault(); orderDetail(link.dataset.order); } });

  boot();
})();