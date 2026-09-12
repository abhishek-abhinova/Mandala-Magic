/* ============================================================
   MANDALA MAGIC BY OM — Checkout page
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const money = n => '$' + n.toFixed(2);

  function renderSummary() {
    const lines = MM.q('#coLines');
    const cart = MM.cartRead();
    if (!lines) return;
    if (!cart.length) {
      lines.innerHTML = `<div style="text-align:center;padding:14px 0;color:var(--faint)">Your bag is empty.</div>`;
      MM.q('#coSub').textContent = money(0);
      MM.q('#coShip').textContent = '—';
      MM.q('#coTotal').textContent = money(0);
      const btn = MM.q('#checkoutForm button[type="submit"]');
      if (btn) btn.disabled = true;
      return;
    }
    lines.innerHTML = cart.map((i, n) => {
      const p = MM.findProduct(i.pid);
      if (!p) return '';
      const art = MM.findArt(p.artId);
      return `<div class="co-line">
        <div class="thumb">${MM.artworkSVG(p.artId)}</div>
        <div>
          <div class="nm">${p.name.replace(art ? art.title : '', '').trim() || p.type}</div>
          <div class="vs">${art ? art.title : ''} · ${i.size}${i.color ? ' · ' + i.color : ''} · Qty ${i.qty}</div>
        </div>
        <span style="color:var(--gold-light)">${money(p.price * i.qty)}</span>
      </div>`;
    }).join('');
    const sub = MM.cartSubtotal();
    const ship = MM.shipping();
    MM.q('#coSub').textContent = money(sub);
    MM.q('#coShip').textContent = ship === 0 ? 'Free' : money(ship);
    MM.q('#coTotal').textContent = money(sub + ship);
  }

  renderSummary();

  /* payment gate toggle */
  const gates = MM.qa('.pay-gate .pg');
  gates.forEach(g => g.addEventListener('click', () => {
    gates.forEach(x => x.classList.remove('active'));
    g.classList.add('active');
  }));

  const form = MM.q('#checkoutForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const cart = MM.cartRead();
    if (!cart.length) { MM.toast('Your bag is empty — add something beautiful first.'); return; }
    const sub = MM.cartSubtotal();
    const ship = MM.shipping();
    const order = {
      id: 'MM-' + String(Date.now()).slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString(),
      email: (MM.q('#ceMail') || {}).value || '',
      lineCount: cart.reduce((s, i) => s + i.qty, 0),
      total: sub + ship,
      cart
    };
    try { localStorage.setItem('mm_last_order', JSON.stringify(order)); } catch (err) {}
    MM.cartSave([]);
    MM.refreshCartUI();
    MM.toast('Order placed ✦ welcome to the magic');
    setTimeout(() => { location.href = 'order.html'; }, 650);
  });
};