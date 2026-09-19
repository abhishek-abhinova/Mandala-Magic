const { getDb } = require('./db');
const { runMigrations } = require('./migrations');

runMigrations(getDb());

console.log('Migration complete.');
process.exit(0);