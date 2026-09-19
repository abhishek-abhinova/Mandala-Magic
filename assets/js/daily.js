/* ============================================================
   MANDALA MAGIC BY OM — Daily Mandala page
   (Widget renders through app.js; only the shop button needs
   pointing at today's real artwork.)
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const artId = MM.config.dailyArtwork ? MM.config.dailyArtwork.artId : '';
  if (!artId) return;
  const link = document.querySelector('a[href="shop.html?art=cosmic-bloom"]');
  if (link) link.href = 'shop.html?art=' + artId;
};