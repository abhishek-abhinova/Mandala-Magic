/* ============================================================
   MANDALA MAGIC BY OM — Contact page
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const form = MM.q('#contactForm');
  if (!form) return;
  const status = document.getElementById('contactStatus');
  let csrf = '';

  // Grab the session CSRF token so the message can be submitted to the studio.
  try {
    fetch('/api/public/session').then(r => r.json()).then(s => { csrf = s.csrf || ''; }).catch(() => {});
  } catch (e) {}

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const payload = {
      name: (MM.q('#cName') || {}).value || '',
      email: (MM.q('#cEmail') || {}).value || '',
      subject: (MM.q('#cSubject') || {}).value || '',
      message: (MM.q('#cMsg') || {}).value || ''
    };
    if (btn) btn.disabled = true;
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Could not send the message');
      if (status) { status.style.display = 'block'; status.textContent = 'Received ✦ Orchid will reply within a day or two.'; }
      MM.toast('Received ✦ Orchid will reply within a day or two.', true);
      form.reset();
    } catch (err) {
      MM.toast(err.message === 'Failed to fetch' ? 'The studio is unreachable right now — email us instead.' : err.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  });
};