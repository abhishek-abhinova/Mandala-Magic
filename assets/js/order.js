/* ============================================================
   MANDALA MAGIC BY OM — Order confirmation
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const money = n => '$' + n.toFixed(2);
  let order = null;
  try { order = JSON.parse(localStorage.getItem('mm_last_order') || 'null'); } catch (e) {}

  const num = MM.q('#ordNum');
  const lines = MM.q('#ordLines');
  if (num) num.textContent = order ? order.id : '—';

  if (order && lines && Array.isArray(order.cart) && order.cart.length) {
    lines.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:16px">
        <span class="lb-cat">Order summary</span>
        <span class="daily-note" style="font-size:.74rem">Placed ${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      ${order.cart.map(i => {
        const p = MM.findProduct(i.pid);
        if (!p) return '';
        return `<div class="co-line">
          <div class="thumb">${MM.artworkSVG(p.artId)}</div>
          <div>
            <div class="nm">${p.name}</div>
            <div class="vs">${i.size}${i.color ? ' · ' + i.color : ''} · Qty ${i.qty}</div>
          </div>
          <span style="color:var(--gold-light)">${money(p.price * i.qty)}</span>
        </div>`;
      }).join('')}
      <div class="co-total">
        <div class="r grand"><span>Total</span><span class="amnt">${money(order.total)}</span></div>
      </div>
      <div class="daily-meta" style="margin-top:16px">
        <span class="daily-date">${String(order.lineCount || 0)} item${order.lineCount === 1 ? '' : 's'}</span>
        <span class="daily-date">Made to order</span>
        <span class="daily-date">${order.email ? 'Receipt sent to ' + order.email : ''}</span>
      </div>`;
  } else if (lines) {
    lines.innerHTML = `<div style="text-align:center;padding:16px 0" class="daily-note">No recent order found in this browser.</div>`;
  }
};