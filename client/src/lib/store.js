const store = {
  get(k, d) {
    try { const v = JSON.parse(localStorage.getItem('mm_' + k)); return v == null ? d : v; } catch (e) { return d; }
  },
  set(k, v) { try { localStorage.setItem('mm_' + k, JSON.stringify(v)); } catch (e) {} }
};

export default store;
export const themeGet = () => (store.get('theme', 'light') === 'dark' ? 'dark' : 'light');
export const themeSet = t => store.set('theme', t);
export const cartRead = () => store.get('cart', []);
export const cartSave = c => store.set('cart', c);
export const wishRead = () => store.get('wish', []);
export const wishSave = w => store.set('wish', w);
export const lastOrderRead = () => store.get('last_order', null);
export const lastOrderWrite = o => store.set('last_order', o);