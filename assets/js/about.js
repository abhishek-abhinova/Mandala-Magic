/* ============================================================
   MANDALA MAGIC BY OM — About page
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const a1 = MM.q('#aboutArt1');
  if (a1) a1.innerHTML = MM.artworkSVG('golden-intention');
  const a2 = MM.q('#aboutArt2');
  if (a2) a2.innerHTML = MM.artworkSVG('path-of-light');
};