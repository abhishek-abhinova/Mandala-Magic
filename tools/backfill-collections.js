/* ============================================================
   One-off backfill: link every published artwork to its matching
   collection (by category) so collection pages show real members.
     node tools/backfill-collections.js
   Safe to re-run (clears + rewrites artwork items only).
   ============================================================ */
const { getDb } = require('../server/db');

const db = getDb();
const colCat = { 'sacred-geometry': 'Mandala', 'cosmic-dreams': 'Abstract', 'nature-landscapes': 'Digital Landscape' };

const cols = db.prepare('SELECT id, slug, name FROM collections').all();
let total = 0;
for (const c of cols) {
  const cat = colCat[c.slug];
  db.prepare("DELETE FROM collection_items WHERE collection_id = ? AND item_type = 'artwork'").run(c.id);
  if (!cat) { console.log(c.slug + ': no mapping (skipped)'); continue; }
  const rows = db.prepare("SELECT id FROM artworks WHERE category = ? AND status = 'published'").all(cat);
  const ins = db.prepare('INSERT OR IGNORE INTO collection_items (collection_id,item_id,item_type) VALUES (?,?,?)');
  for (const r of rows) ins.run(c.id, r.id, 'artwork');
  total += rows.length;
  console.log(c.slug + ' → ' + rows.length + ' artworks (' + c.name + ')');
}
console.log('Backfill complete: ' + total + ' collection items linked.');