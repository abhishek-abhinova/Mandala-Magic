import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { loadCatalog } from './lib/api';
import { cartRead, cartSave, wishRead, wishSave } from './lib/store';
import { esc, money, fmtDate, ICONS, PRODUCT_TYPES, quoteSVG, Svg } from './lib/icons';
import { artworkSVG } from './lib/artsvg';

export { esc, money, fmtDate, ICONS, PRODUCT_TYPES, quoteSVG, Svg };

/* ============================ CATALOG ============================ */
const CatalogCtx = createContext({ ready: false, artworks: [], products: [], collections: [], config: { dailyArtwork: {} }, findArt: () => null, findProduct: () => null, artworkSVG: () => '' });

export function CatalogProvider({ children }) {
  const [state, setState] = useState({ ready: false, artworks: [], products: [], collections: [], config: { dailyArtwork: {} } });
  useEffect(() => {
    let live = true;
    loadCatalog()
      .then(d => {
        if (!live) return;
        setState({ ...d, config: { dailyArtwork: d.dailyArtwork || {} }, ready: true });
      })
      .catch(err => {
        console.error('Catalog load failed — storefront will render empty until the server is reachable.', err);
        if (live) setState(s => ({ ...s, ready: true }));
      });
    return () => { live = false; };
  }, []);

  const value = useMemo(() => {
    const cat = {
      ...state,
      findArt: id => state.artworks.find(a => a.id === id),
      findProduct: id => state.products.find(p => p.id === id),
      artworkSVG: id => {
        const art = state.artworks.find(a => a.id === id);
        return artworkSVG(art, esc);
      }
    };
    return cat;
  }, [state]);

  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>;
}

export const useCatalog = () => useContext(CatalogCtx);

/* ============================ CART ============================ */
const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => cartRead());
  const [drawer, setDrawer] = useState(false);
  const cat = useCatalog();

  const persist = c => { cartSave(c); setCart(c); };

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => {
    const p = cat.findProduct(i.pid);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const shipping = subtotal === 0 ? 0 : subtotal >= 65 ? 0 : 6.5;

  const add = (pid, opts) => {
    opts = opts || {};
    const p = cat.findProduct(pid);
    if (!p) return;
    const size = opts.size || (p.sizes[0] || 'One Size');
    const color = opts.color || (p.colors[0] || '');
    const key = pid + '::' + size + '::' + color;
    const cur = cartRead();
    const found = cur.find(i => i.key === key);
    if (found) found.qty += opts.qty || 1;
    else cur.push({ key, pid, qty: opts.qty || 1, size, color });
    persist(cur);
    const art = cat.findArt(p.artId);
    const label = p.name.replace(art ? art.title : '', '').trim() || p.type;
    return { label, artTitle: art ? art.title : '' };
  };

  const setQty = (key, qty) => {
    let c = cartRead();
    const it = c.find(i => i.key === key);
    if (!it) return;
    it.qty = Math.max(1, qty);
    persist(c);
  };

  const remove = key => persist(cartRead().filter(i => i.key !== key));
  const clear = () => persist([]);
  const openCart = () => setDrawer(true);
  const closeCart = () => setDrawer(false);

  const value = useMemo(() => ({
    cart, drawer, openCart, closeCart, add, setQty, remove, clear,
    count, subtotal, shipping, persistedCount: count
  }), [cart, drawer, subtotal, shipping, count, cat]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);

/* ============================ UI (lightbox / toast / theme / wishlist / search / menu) ============================ */
const UiCtx = createContext(null);

export function UiProvider({ children }) {
  const cat = useCatalog();
  const cart = useCart();
  const [lightbox, setLightbox] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [wish, setWish] = useState(() => wishRead());
  const [theme, setThemeState] = useState(() => (localStorage.getItem('mm_theme') === '"dark"' ? 'dark' : 'light'));
  const idRef = useRef(0);

  const toast = useCallback((msg, added) => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, html: `<span class="tk">${added ? '✦ ' : ''}</span>${msg}` }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const setTheme = t => {
    const next = t === 'dark' ? 'dark' : 'light';
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('mm_theme', JSON.stringify(next)); } catch (e) {}
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute('content', next === 'dark' ? '#05030f' : '#f6f1e7');
    if (window.__MMrelight) { try { window.__MMrelight(); } catch (e) {} }
  };
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const wishlistHas = id => wish.includes(id);
  const toggleWish = pid => {
    let w = wishRead();
    if (w.includes(pid)) { w = w.filter(x => x !== pid); toast('Removed from wishlist'); }
    else { w.push(pid); toast('Saved to your wishlist ' + ICONS.heartFill); }
    wishSave(w);
    setWish(w);
  };

  const openArt = id => {
    const art = cat.findArt(id);
    console.log('[dbg] openArt', id, '->', art && art.title, '| n=', cat.artworks.length, 'first=', cat.artworks[0] && cat.artworks[0].id, 'hasCtx=', !!art);
    if (!art) return;
    setLightbox({ kind: 'art', art });
  };
  const openProduct = pid => {
    const p = cat.findProduct(pid);
    if (!p) return;
    const art = cat.findArt(p.artId);
    setLightbox({ kind: 'product', p, art });
  };
  const closeLightbox = () => setLightbox(null);

  const value = useMemo(() => ({
    lightbox, openArt, openProduct, closeLightbox,
    toasts, toast, menuOpen, setMenuOpen,
    searchOpen, setSearchOpen,
    wish, wishlistHas, toggleWish,
    theme, setTheme, toggleTheme
  }), [lightbox, toasts, menuOpen, searchOpen, wish, theme, cat]);

  return <UiCtx.Provider value={value}>{children}</UiCtx.Provider>;
}

export const useUi = () => useContext(UiCtx);

/* ============================ shared sub-widgets ============================ */
export function Artwork({ id, as }) {
  const cat = useCatalog();
  const art = cat.findArt(id);
  const html = cat.artworkSVG(id);
  if (!art || !html) return null;
  if (html.indexOf('<img') === 0) {
    return <img className={'art-svg' + (as ? ' ' + as : '')} src={art.image} alt={art.title || ''} loading="lazy" />;
  }
  return <div className={as ? as : 'art-svg'} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function AvailLines({ artId, chip }) {
  const cat = useCatalog();
  return PRODUCT_TYPES.map(t => {
    const p = cat.products.find(x => x.artId === artId && x.type === t);
    if (!p) return <span key={t} className="avail-line" style={{ pointerEvents: 'none', opacity: 0.35 }}><span className="dot"></span>{t}</span>;
    return <a key={t} className={chip ? 'chip avail-line' : 'avail-line'} style={chip ? { padding: '8px 14px' } : undefined} href={'/product/' + p.id}><span className="dot"></span>{t}</a>;
  });
}