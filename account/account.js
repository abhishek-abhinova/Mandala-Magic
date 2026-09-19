(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  let csrf = ''; let me = null; let section = 'overview';

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => '$' + (+n || 0).toFixed(2);

  async function boot() {
    try {
      const s = await api('/public/session', { noCsrf: true });
      csrf = s.csrf;
      if (s.authenticated) { await enter(); }
      else { $('#acAuth').classList.remove('hidden'); $('#acDash').classList.add('hidden'); }
    } catch (e) { toast('Could not reach the studio server', 'err'); }
  }

  async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (csrf) headers['X-CSRF-Token'] = csrf;
    const res = await fetch('/api' + path, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: 'same-origin' });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) { const err = new Error(data.error || res.statusText); err.status = res.status; throw err; }
    return data;
  }

  async function enter() {
    try { me = await api('/account/me'); } catch (e) {}
    $('#acAuth').classList.add('hidden');
    $('#acDash').classList.remove('hidden');
    $('#acName').textContent = me.name || 'Collector';
    $('#acEmail').textContent = me.email || '';
    $('#avatar').textContent = (me.name || 'O').charAt(0).toUpperCase();
    show('overview');
  }

  function show(sec) {
    section = sec;
    $$('.ac-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.sec === sec));
    const view = { overview, orders, wishlist, addresses, profile, security }[sec];
    if (view) view();
  }

  const panel = () => $('#acPanel');

  /* ------- Overview ------- */
  async function overview() {
    panel().innerHTML = `<h2>Welcome back, ${esc(me.name.split(' ')[0])} 🌸</h2>
      <p class="lede">Your collection, orders and intentions — all in one quiet place.</p><div class="ac-loader">Loading your pieces…</div>`;
    try {
      const orders = await api('/account/orders');
      const recent = orders.slice(0, 3);
      const rows = recent.map(o => `<div class="ac-row"><div><img class="ac-thumb" src="/assets/img/logo-mark.svg" alt=""></div>
        <div><strong>${esc(o.order_number)}</strong> · ${esc((o.created_at || '').slice(0, 10))}<br>
        <span style="color:var(--faint);font-size:.8rem">${fmt(o.total)} · ${o.items.length} item(s)</span></div>
        <span class="ac-badge b-${o.payment_status === 'paid' ? 'good' : 'mid'}">${esc(o.payment_status)}</span></div>`).join('');
      panel().innerHTML = `<h2>Welcome back, ${esc(me.name.split(' ')[0])} 🌸</h2>
        <p class="lede">Your collection, orders and intentions — all in one quiet place.</p>
        <div class="ac-cards">
          <div class="ac-card"><div class="k">Orders</div><div class="v">${orders.length}</div><div class="s">across your journey</div></div>
          <div class="ac-card"><div class="k">Collections</div><div class="v">✦</div><div class="s">art carried home</div></div>
        </div>
        <h2 style="font-size:1rem;margin:20px 0 10px">Recent Orders</h2>
        ${rows || '<p class="ac-empty">No orders yet — explore the Daily Mandala and bring a piece home.</p>'}`;
    } catch (e) { panel().innerHTML = '<p class="ac-empty">' + esc(e.message) + '</p>'; }
  }

  /* ------- Orders ------- */
  async function orders() {
    panel().innerHTML = `<h2>My Orders</h2><p class="lede">Every piece, from intention to your door.</p><div class="ac-loader">Loading…</div>`;
    try {
      const list = await api('/account/orders');
      const rows = list.map(o => `<div class="ac-row">
        <div><div class="ac-thumb" style="display:grid;place-items:center;background:rgba(122,63,242,.15)">✦</div></div>
        <div><strong>${esc(o.order_number)}</strong> · ${esc((o.created_at || '').slice(0, 10))}<br>
        <span style="color:var(--faint);font-size:.8rem">${fmt(o.total)} · ${o.items.length} item(s)</span><br>
        ${o.tracking_number ? `<span style="color:var(--gold2);font-size:.78rem">Track: ${esc(o.tracking_number)}</span>` : ''}</div>
        <span class="ac-badge b-${o.payment_status === 'paid' ? 'good' : 'mid'}">${esc(o.payment_status)}</span>
        <button class="ac-btn" data-open="${esc(o.order_number)}">Details</button></div>`).join('') || '<p class="ac-empty">No orders yet. When you shop, they will appear here.</p>';
      panel().innerHTML = `<h2>My Orders</h2><p class="lede">Every piece, from intention to your door.</p>${rows}`;
      $$('[data-open]').forEach(b => b.onclick = () => orderDetail(b.dataset.open));
    } catch (e) { panel().innerHTML = '<p class="ac-empty">' + esc(e.message) + '</p>'; }
  }

  async function orderDetail(number) {
    const o = await api('/account/orders/' + number);
    const tl = [['placed', 'Order Placed'], ['paid', 'Payment Confirmed'], ['processing', 'Processing'], ['submitted_yoycol', 'Submitted to Production'], ['in_production', 'In Production'], ['shipped', 'Shipped'], ['delivered', 'Delivered']];
    let idx = tl.findIndex(([k]) => k === o.status);
    if (idx < 0) idx = ['cancelled', 'failed', 'requires_attention'].includes(o.status) ? 2 : tl.length - 1;
    const timeline = tl.map(([k, label], i) => `<span class="ac-tl ${i <= idx ? 'done' : ''}">${label}</span>`).join('');

    panel().innerHTML = `<h2>Order ${esc(o.order_number)}</h2>
      <p class="lede">${esc(o.status)} · ${esc((o.created_at || '').slice(0, 10))}</p>
      <div class="ac-timeline">${timeline}</div>
      <div class="ac-track" id="acTrack"><span class="ac-loader" style="font-size:.8rem">Loading tracking…</span></div>
      <table class="ac-table"><thead><tr><th>Piece</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>${o.items.map(i => `<tr><td>${esc(i.title)}</td><td>${esc(i.size)}</td><td>${i.quantity}</td><td>${fmt(i.price)}</td></tr>`).join('')}</tbody></table>
      <p style="margin-top:14px">Subtotal ${fmt(o.subtotal)} · Shipping ${fmt(o.shipping)} · <strong>Total ${fmt(o.total)}</strong></p>
      <p style="color:var(--faint);font-size:.82rem">Shipped to ${esc(o.shipping_name)} · ${esc(o.shipping_address)}, ${esc(o.shipping_city)}, ${esc(o.shipping_country)}</p>
      <button class="ac-btn" onclick="location.hash=''">All Orders</button>`;

    // Pull latest tracking/timeline from server (non-blocking).
    api('/account/orders/' + number + '/tracking').then(t => {
      const box = $('#acTrack'); if (!box) return;
      const tl = t.timeline || [];
      if (!tl.length) { box.innerHTML = t.note ? `<p style="color:var(--faint);font-size:.82rem">${esc(t.note)}</p>` : ''; return; }
      const trk = t.tracking ? `<p style="color:var(--gold2);font-size:.84rem;margin:10px 0">${t.tracking.lpName || t.tracking.carrier ? 'Carrier: ' + esc(t.tracking.lpName || t.tracking.carrier) + ' · ' : ''}${esc(t.tracking.waybillCode || t.tracking.tailTrackCode || t.tracking.trackingNumber || '')}${t.tracking.url ? ' · <a href="' + esc(t.tracking.url) + '" target="_blank" rel="noopener">track online ↗</a>' : ''}</p>` : '';
      box.innerHTML = trk + `<details class="ac-detail" style="margin-top:10px"><summary style="cursor:pointer;color:var(--ink-dim);font-size:.82rem">View production & delivery timeline</summary><div style="margin-top:10px">${steps.map((_, i) => '').join('')}</div><div style="margin-top:4px">${tl.map((s, i) => `<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)"><span style="color:var(--gold2);font-size:.72rem;width:16px">${i + 1}</span><div><strong style="font-size:.85rem">${esc(s.orderStatusLabel || s.statusLabel || s.status || 'Update')}</strong><div style="color:var(--faint);font-size:.76rem">${esc((s.createdAt || s.created_at || s.created || '').slice(0, 19))}</div></div></div>`).join('')}</div></details>`;
    }).catch(() => {});
  }

  /* ------- Wishlist ------- */
  async function wishlist() {
    panel().innerHTML = `<h2>Wishlist</h2><p class="lede">Pieces you're saving for later.</p><div class="ac-loader">Loading…</div>`;
    try {
      const items = await api('/account/wishlist');
      const rows = items.map(w => `<div class="ac-row">
        <div><img class="ac-thumb" src="${esc(w.image_url || '/assets/img/logo-mark.svg')}" alt=""></div>
        <div><strong>${esc(w.title || '—')}</strong><br><span style="color:var(--gold2);font-size:.85rem">${w.sale_price != null ? fmt(w.sale_price) : fmt(w.price)}</span></div>
        <a class="ac-btn ac-btn-gold" href="/shop/${esc(w.slug)}" target="_blank">View Piece</a>
        <button class="ac-btn ac-btn-red" data-rm="${w.id}">Remove</button></div>`).join('') || '<p class="ac-empty">Your wishlist is quiet for now.</p>';
      panel().innerHTML = `<h2>Wishlist</h2><p class="lede">Pieces you're saving for later.</p>${rows}`;
      $$('[data-rm]').forEach(b => b.onclick = async () => { try { await api('/account/wishlist/' + b.dataset.rm, { method: 'DELETE' }); toast('Removed from wishlist'); wishlist(); } catch (e) { toast(e.message, 'err'); } });
    } catch (e) { panel().innerHTML = '<p class="ac-empty">' + esc(e.message) + '</p>'; }
  }

  /* ------- Addresses ------- */
  async function addresses() {
    panel().innerHTML = `<h2>Addresses</h2><p class="lede">Where the art travels to.</p><div class="ac-loader">Loading…</div>`;
    try {
      const list = await api('/account/addresses');
      const rows = list.map(a => `<div class="ac-row" style="grid-template-columns:1fr auto">
        <div><strong>${esc(a.label)}</strong>${a.is_default ? ' <span class="ac-badge b-dim">default</span>' : ''}<br>
        <span style="color:var(--dim);font-size:.85rem">${esc(a.name)} · ${esc(a.address_line1)} ${esc(a.address_line2)}, ${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}, ${esc(a.country)}</span></div>
        <button class="ac-btn ac-btn-red" data-del="${a.id}">Remove</button></div>`).join('') || '<p class="ac-empty">No saved addresses.</p>';
      panel().innerHTML = `<h2>Addresses</h2><p class="lede">Where the art travels to.</p>${rows}
      <div style="max-width:520px;margin-top:20px"><h2 style="font-size:1rem;margin-bottom:12px">Add an address</h2>
        <label class="ac-field-label">Label <input class="ac-input" id="aLabel" placeholder="Home" value="Home"></label>
        <label class="ac-field-label">Full name <input class="ac-input" id="aName" placeholder="Name"></label>
        <label class="ac-field-label">Address line 1 <input class="ac-input" id="aAddr" placeholder="Street address"></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <label class="ac-field-label">City<input class="ac-input" id="aCity"></label>
          <label class="ac-field-label">State<input class="ac-input" id="aState"></label></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <label class="ac-field-label">ZIP<input class="ac-input" id="aZip"></label>
          <label class="ac-field-label">Country<input class="ac-input" id="aCountry" value="US"></label></div>
        <button class="ac-btn ac-btn-gold" id="aSave" style="margin-top:14px">Save Address</button></div>`;
      $('#aSave').onclick = async () => {
        try {
          await api('/account/addresses', { method: 'POST', body: { label: $('#aLabel').value, name: $('#aName').value, address_line1: $('#aAddr').value, city: $('#aCity').value, state: $('#aState').value, zip: $('#aZip').value, country: $('#aCountry').value, is_default: list.length === 0 ? 1 : 0 } });
          toast('Address saved'); addresses();
        } catch (e) { toast(e.message, 'err'); }
      };
      $$('[data-del]').forEach(b => b.onclick = async () => { await api('/account/addresses/' + b.dataset.del, { method: 'DELETE' }); toast('Address removed'); addresses(); });
    } catch (e) { panel().innerHTML = '<p class="ac-empty">' + esc(e.message) + '</p>'; }
  }

  /* ------- Profile & security ------- */
  function profile() {
    panel().innerHTML = `<h2>Profile</h2><p class="lede">How you appear across Mandala Magic.</p>
    <div style="max-width:480px"><label class="ac-field-label">Name<input class="ac-input" id="pName" value="${esc(me.name)}"></label>
    <label class="ac-field-label">Email<input class="ac-input" id="pEmail" value="${esc(me.email)}"></label>
    <button class="ac-btn ac-btn-gold" id="pSave" style="margin-top:16px">Save Changes</button>
    <p style="color:var(--faint);font-size:.78rem;margin-top:12px">Member since ${esc((me.created_at || '').slice(0, 10))}</p></div>`;
    $('#pSave').onclick = async () => {
      try { await api('/account/me', { method: 'PUT', body: { name: $('#pName').value, email: $('#pEmail').value } }); toast('Profile updated'); boot(); } catch (e) { toast(e.message, 'err'); }
    };
  }

  function security() {
    panel().innerHTML = `<h2>Security</h2><p class="lede">Change your password and keep your account safe.</p>
    <div style="max-width:480px"><label class="ac-field-label">Current password<input type="password" class="ac-input" id="sCur"></label>
    <label class="ac-field-label">New password (min 8 chars)<input type="password" class="ac-input" id="sNew"></label>
    <button class="ac-btn ac-btn-gold" id="sSave" style="margin-top:16px">Update Password</button></div>`;
    $('#sSave').onclick = async () => {
      try {
        await api('/account/password', { method: 'PUT', body: { current: $('#sCur').value, password: $('#sNew').value } });
        toast('Password updated'); $('#sCur').value = ''; $('#sNew').value = '';
      } catch (e) { toast(e.message, 'err'); }
    };
  }

  /* ------- toast ------- */
  function toast(msg, type = '') {
    const el = document.createElement('div');
    el.className = 'ac-toast' + (type === 'err' ? ' ac-toast-err' : '');
    el.textContent = msg;
    $('#acToasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 3200);
  }

  /* ------- auth wiring ------- */
  $$('.ac-tab').forEach(tab => tab.onclick = () => {
    $$('.ac-tab').forEach(t => t.classList.toggle('active', t === tab));
    const which = tab.dataset.tab;
    $('#acLogin').classList.toggle('hidden', which !== 'login');
    $('#acRegister').classList.toggle('hidden', which !== 'register');
    $('#acReset').classList.add('hidden');
  });

  $('#forgotBtn').onclick = () => {
    $('#acLogin').classList.add('hidden');
    $('#acRegister').classList.add('hidden');
    $('#acReset').classList.remove('hidden');
  };

  async function submit(form) {
    const fd = new FormData(form);
    const body = { email: fd.get('email'), password: fd.get('password') };
    if (form.id === 'registerForm') { body.name = fd.get('name'); body.password = fd.get('password'); }
    await api(form.id === 'registerForm' ? '/auth/register' : '/auth/login', { method: 'POST', body });
  }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault(); $('#acErr').textContent = '';
    try { await submit(e.target); toast('Welcome back ✦'); await boot(); } catch (err) { $('#acErr').textContent = err.message; }
  });
  $('#registerForm').addEventListener('submit', async e => {
    e.preventDefault(); $('#acErr').textContent = '';
    try { await submit(e.target); toast('Welcome to the circle ✦'); await boot(); } catch (err) { $('#acErr').textContent = err.message; }
  });
  $('#resetForm').addEventListener('submit', async e => {
    e.preventDefault(); $('#resetMsg').textContent = '';
    await api('/auth/forgot', { method: 'POST', body: { email: new FormData(e.target).get('email') } });
    $('#resetMsg').textContent = 'If that email exists, a reset link is on its way.';
  });

  // Reset link support: /account?reset=TOKEN&email=...
  (function resetFlow() {
    const q = new URLSearchParams(location.search);
    const token = q.get('reset'); const email = q.get('email');
    if (token) {
      const pw = prompt('Enter a new password (min 8 characters)');
      if (pw) { api('/auth/reset', { method: 'POST', body: { token, password: pw } }).then(() => toast('Password reset — sign in now')).catch(e => toast(e.message, 'err')); }
      history.replaceState({}, '', '/account');
    }
  })();

  $$('.ac-nav-btn[data-sec]').forEach(b => b.onclick = () => show(b.dataset.sec));
  $('#logoutBtn').onclick = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch (e) {} csrf = ''; location.reload(); };

  boot();
})();