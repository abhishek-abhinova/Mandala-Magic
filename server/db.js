const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('./config');

let _db = null;

function getDb() {
  if (_db) return _db;
  const dir = path.dirname(config.db.file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  _db = new Database(config.db.file);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
}

function query(sql, params = []) {
  return getDb().prepare(sql).all(...params);
}

function queryOne(sql, params = []) {
  return getDb().prepare(sql).get(...params);
}

function run(sql, params = []) {
  const info = getDb().prepare(sql).run(...params);
  return { lastID: info.lastInsertRowid, changes: info.changes };
}

function transaction(fn) {
  return getDb().transaction(fn)();
}

function close() {
  if (_db) { _db.close(); _db = null; }
}

module.exports = { getDb, query, queryOne, run, transaction, close };
