const fs = require('fs');
const path = require('path');

// Shared, idempotent schema migration used both at server startup and via the
// standalone `npm run migrate` command.

function runMigrations(db) {
  // Fresh-install schema (CREATE IF NOT EXISTS — safe to run every boot).
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  // Idempotent column adds for databases created before these columns existed.
  const hasColumn = (table, col) => db.prepare(`PRAGMA table_info(${table})`).all().some(r => r.name === col);
  const addColumn = (table, col, ddl) => { if (!hasColumn(table, col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`); };

  addColumn('artworks', 'production_file', "TEXT DEFAULT ''");
  addColumn('products', 'workflow_status', "TEXT DEFAULT 'draft'");
  addColumn('products', 'yoycol_mapping_id', 'INTEGER');
  addColumn('products', 'base_cost', 'REAL DEFAULT 0');
  addColumn('products', 'base_currency', "TEXT DEFAULT 'USD'");
  addColumn('product_variants', 'yoycol_sku_code', "TEXT DEFAULT ''");
  addColumn('product_variants', 'yoycol_design_code', "TEXT DEFAULT ''");
  addColumn('orders', 'fulfillment_status', "TEXT DEFAULT 'none'");
  addColumn('orders', 'yoycol_order_no', "TEXT DEFAULT ''");
  addColumn('orders', 'yoycol_status_label', "TEXT DEFAULT ''");
  addColumn('orders', 'carrier', "TEXT DEFAULT ''");
  addColumn('yoycol_sync_logs', 'entity_id', "TEXT DEFAULT ''");
  addColumn('yoycol_sync_logs', 'retryable', 'INTEGER DEFAULT 0');

  // Contact messages from the storefront form.
  const hasTable = (table) => db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
  if (!hasTable('contact_messages')) {
    db.exec(`CREATE TABLE contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT 'General question',
      message TEXT NOT NULL,
      replied INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  };

  // Backfill product_artwork_links from the legacy one-to-one products.artwork_id.
  db.exec(`INSERT OR IGNORE INTO product_artwork_links (product_id, artwork_id)
           SELECT id, artwork_id FROM products WHERE artwork_id IS NOT NULL AND artwork_id != 0`);

  // Status / listing indexes for a 900+ artwork gallery with hot lookup paths.
  db.exec(`
CREATE INDEX IF NOT EXISTS idx_artworks_status_date ON artworks(status, artwork_date DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_slug ON artworks(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_yoycol ON products(yoycol_product_id);
CREATE INDEX IF NOT EXISTS idx_product_links_artwork ON product_artwork_links(artwork_id);
CREATE INDEX IF NOT EXISTS idx_product_links_product ON product_artwork_links(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_type ON yoycol_sync_logs(type, status);
`);
}

module.exports = { runMigrations };