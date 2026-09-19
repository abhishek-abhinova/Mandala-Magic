const fs = require('fs');
const path = require('path');

// Loads assets/js/data.js (browser global) into a Node object so the backend
// seed can reuse the exact same catalog the frontend ships with.
function loadFrontendData() {
  const file = path.join(__dirname, '..', 'assets', 'js', 'data.js');
  const src = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {}, console };
  const vm = require('vm');
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.MM;
}

module.exports = { loadFrontendData };