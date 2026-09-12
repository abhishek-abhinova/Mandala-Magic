/* Tiny static file server for previewing the site. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.json': 'application/json', '.ico': 'image/x-icon', '.txt': 'text/plain'
};

const PORT = process.env.PORT || 4173;
http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  /* resolve both exact paths and friendly variants (extensionless, trailing slash) */
  const candidates = [urlPath];
  if (!path.extname(urlPath)) {
    if (urlPath.endsWith('/')) {
      candidates.push(urlPath + 'index.html', urlPath.slice(0, -1) + '.html');
    } else {
      candidates.push(urlPath + '.html', urlPath + '/index.html');
    }
  }
  for (const cand of candidates) {
    const file = path.join(ROOT, cand);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      const idx = path.join(file, 'index.html');
      if (fs.existsSync(idx)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(idx));
        return;
      }
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><meta charset="utf-8"><title>404 — Mandala Magic</title><style>body{font-family:system-ui;background:#0f0b1e;color:#f3e2c8;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center}code{background:#221a3a;padding:2px 8px;border-radius:6px}a{color:#d4af37}</style><main><h1>404</h1><p><code>' +
    urlPath + '</code> could not be found.</p><p><a href="/index.html">Return to the storefront</a></p></main>');
}).listen(PORT, () => console.log('Serving Mandala Magic by OM at http://localhost:' + PORT + '/'));

module.exports = { ROOT };