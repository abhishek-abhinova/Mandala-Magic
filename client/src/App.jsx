import React, { useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { useCatalog, useCart, useUi } from './context';
import { Nav, Footer, Preloader, AmbientElements } from './components/Chrome';
import { Mmenu, SearchOverlay, CartDrawer, Lightbox, ToastStack } from './components/Overlays';
import { useAmbient, useRouteAmbient } from './lib/ambient';
import HomePage from './pages/Home';
import GalleryPage from './pages/Gallery';
import ShopPage from './pages/Shop';
import DailyPage from './pages/Daily';
import AboutPage from './pages/About';
import CollectionsPage from './pages/Collections';
import ProductPage from './pages/Product';
import OrderPage from './pages/Order';
import CheckoutPage from './pages/Checkout';
import ContactPage from './pages/Contact';
import NotFoundPage from './pages/NotFound';

function Shell() {
  const nav = useNavigate();
  const cat = useCatalog();
  const cart = useCart();
  const ui = useUi();
  const location = useLocation();

  useAmbient();

  /* Global chrome delegation — mirrors the legacy document-level handler. */
  useEffect(() => {
    function onClick(e) {
      const t = e.target;
      const closest = t.closest ? t.closest.bind(t) : () => null;

      let el = closest('[data-ovclose]');
      if (el) { ui.setSearchOpen(false); return; }

      el = closest('[data-cartclose]');
      if (el) { cart.closeCart(); return; }

      el = closest('[data-cartopen]');
      if (el) { cart.openCart(); return; }

      el = closest('[data-continue]');
      if (el) { cart.closeCart(); return; }

      el = closest('[data-routemode]');
      if (el) { e.preventDefault(); return; }

      el = closest('[data-q][data-d]');
      if (el) { const it = cart.cart.find(i => i.key === el.dataset.q); if (it) cart.setQty(it.key, it.qty + parseInt(el.dataset.d, 10)); return; }

      el = closest('[data-rm]');
      if (el) { cart.remove(el.dataset.rm); return; }

      el = closest('[data-wish]');
      if (el) { ui.toggleWish(el.dataset.wish); return; }

      el = closest('[data-addq]');
      if (el) { cart.add(el.dataset.addq); ui.closeLightbox(); return; }

      el = closest('[data-view]');
      if (el) { console.log('[dbg] data-view', el.dataset.view); ui.openArt(el.dataset.view); return; }

      el = closest('[data-pd]');
      if (el) { ui.openProduct(el.dataset.pd); return; }

      el = closest('[data-shopart]');
      if (el) { e.preventDefault(); nav('/shop?art=' + encodeURIComponent(el.dataset.shopart)); return; }

      el = closest('[data-lbclose]');
      if (el) { ui.closeLightbox(); return; }

      el = closest('#lightbox');
      if (el && t.id === 'lightbox') { ui.closeLightbox(); return; }
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [ui, cart]);

  /* Escape closes overlays. */
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (ui.lightbox) ui.closeLightbox();
      else if (cart.drawer) cart.closeCart();
      else if (ui.searchOpen) ui.setSearchOpen(false);
      else if (ui.menuOpen) ui.setMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ui.lightbox, cart.drawer, ui.searchOpen, ui.menuOpen]);

  /* Deep-link lightboxes (#view-<id>) + scroll restoration on route change. */
  useEffect(() => {
    const h = location.hash;
    if (h.indexOf('#view-') === 0) {
      const id = h.slice(6);
      if (cat.findArt(id)) {
        ui.openArt(id);
        window.history.replaceState(null, '', location.pathname);
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  useRouteAmbient(location.pathname);

  return (
    <>
      <AmbientElements />
      <Preloader />
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav />
      <Mmenu />
      <SearchOverlay />
      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/index" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <Lightbox />
      <ToastStack />
    </>
  );
}

export default function App() {
  return <Shell />;
}