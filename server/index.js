const config = require('./config');
const { getDb } = require('./db');

async function main() {
  // Run migrations (schema + idempotent column adds + indexes).
  const { runMigrations } = require('./migrations');
  runMigrations(getDb());

  // Seed demo data if the database is empty.
  const { seedIfEmpty } = require('./seed');
  await seedIfEmpty();

  const { createApp } = require('./app');
  const app = createApp();

  app.listen(config.port, config.host, () => {
    console.log(`┌────────────────────────────────────────────────┐`);
    console.log(`│  ✦  Mandala Magic by OM  —  premium storefront  │`);
    console.log(`└────────────────────────────────────────────────┘`);
    console.log(`   Storefront : http://localhost:${config.port}`);
    console.log(`   Artwork SSR: http://localhost:${config.port}/artwork/cosmic-bloom`);
    console.log(`   Admin panel: http://localhost:${config.port}/admin`);
    console.log(`   Account    : http://localhost:${config.port}/account`);
    console.log(`   API        : http://localhost:${config.port}/api/public/artworks`);
  });
}

main().catch(err => { console.error('Fatal startup error:', err); process.exit(1); });