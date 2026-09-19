/* ============================================================
   MANDALA MAGIC BY OM — About page
   (Artwork picks come from the live catalog.)
   ============================================================ */
window.MM = window.MM || {};
window.MM.pageInit = function () {
  const MM = window.MM;
  const mandala = MM.artworks.find(a => a.cat === 'mandala') || MM.artworks[0];
  const landscape = MM.artworks.find(a => a.cat === 'landscape') || MM.artworks[1] || MM.artworks[0];
  const a1 = MM.q('#aboutArt1');
  if (a1 && mandala) a1.innerHTML = MM.artworkSVG(mandala.id);
  const a2 = MM.q('#aboutArt2');
  if (a2 && landscape) a2.innerHTML = MM.artworkSVG(landscape.id);
};