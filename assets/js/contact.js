/* ============================================================
   MANDALA MAGIC BY OM — Contact page
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const form = MM.q('#contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    MM.toast('Message sent ✦ Orchid will reply within a day or two.');
    form.reset();
  });
};