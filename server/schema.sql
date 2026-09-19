-- Mandala Magic by OM — Database Schema (SQLite / MySQL-compatible)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  avatar_url TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS artworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  intention TEXT DEFAULT '',
  artist_note TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  production_file TEXT DEFAULT '',
  category TEXT DEFAULT 'mandala',
  artwork_date TEXT DEFAULT '',
  is_featured INTEGER DEFAULT 0,
  is_daily_mandala INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  views INTEGER DEFAULT 0,
  palette TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  published_at TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'product',
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  sale_price REAL,
  artwork_id INTEGER,
  category TEXT DEFAULT '',
  product_type TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  workflow_status TEXT DEFAULT 'draft',
  is_featured INTEGER DEFAULT 0,
  yoycol_product_id TEXT DEFAULT '',
  yoycol_mapping_id INTEGER,
  base_cost REAL DEFAULT 0,
  base_currency TEXT DEFAULT 'USD',
  image_url TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_artwork_links (
  product_id INTEGER NOT NULL,
  artwork_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (product_id, artwork_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  size TEXT DEFAULT 'One Size',
  color TEXT DEFAULT '',
  price REAL,
  stock INTEGER DEFAULT -1,
  external_variant_id TEXT DEFAULT '',
  yoycol_sku_code TEXT DEFAULT '',
  yoycol_design_code TEXT DEFAULT '',
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collection_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'product',
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'placed',
  payment_status TEXT DEFAULT 'pending',
  fulfillment_status TEXT DEFAULT 'none',
  subtotal REAL DEFAULT 0,
  shipping REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  total REAL DEFAULT 0,
  shipping_name TEXT DEFAULT '',
  shipping_email TEXT DEFAULT '',
  shipping_address TEXT DEFAULT '',
  shipping_city TEXT DEFAULT '',
  shipping_state TEXT DEFAULT '',
  shipping_zip TEXT DEFAULT '',
  shipping_country TEXT DEFAULT '',
  billing_name TEXT DEFAULT '',
  billing_email TEXT DEFAULT '',
  yoycol_order_id TEXT DEFAULT '',
  yoycol_order_no TEXT DEFAULT '',
  yoycol_status_label TEXT DEFAULT '',
  carrier TEXT DEFAULT '',
  tracking_number TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  variant_id INTEGER,
  title TEXT NOT NULL,
  size TEXT DEFAULT '',
  color TEXT DEFAULT '',
  quantity INTEGER DEFAULT 1,
  price REAL DEFAULT 0,
  external_item_id TEXT DEFAULT '',
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  method TEXT DEFAULT 'card',
  amount REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  label TEXT DEFAULT 'Home',
  name TEXT DEFAULT '',
  address_line1 TEXT DEFAULT '',
  address_line2 TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  country TEXT DEFAULT '',
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  item_type TEXT DEFAULT 'product',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL DEFAULT '',
  user_id INTEGER,
  product_id INTEGER NOT NULL,
  variant_id INTEGER,
  quantity INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS yoycol_sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT DEFAULT '',
  request_data TEXT DEFAULT '{}',
  response_data TEXT DEFAULT '{}',
  entity_id TEXT DEFAULT '',
  retryable INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT '',
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT DEFAULT '',
  order_id TEXT DEFAULT '',
  payload TEXT DEFAULT '{}',
  processed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT DEFAULT '',
  entity_id INTEGER,
  data TEXT DEFAULT '{}',
  ip TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_type TEXT DEFAULT '',
  page_id TEXT DEFAULT '',
  url TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  user_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  page_type TEXT DEFAULT '',
  page_id TEXT DEFAULT '',
  data TEXT DEFAULT '{}',
  user_id INTEGER,
  session_id TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
