import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCatalog, useCart, useUi, Svg, ICONS } from '../context';

const NAV_LINKS = [
  { to: '/', t: 'Home' },
  { to: '/gallery', t: 'Art Gallery' },
  { to: '/shop', t: 'Shop' },
  { to: '/daily', t: 'Daily Mandala' },
  { to: '/about', t: 'About Orchid' },
  { to: '/collections', t: 'Collections' },
  { to: '/contact', t: 'Contact' }
];

export function Nav() {
  const ui = useUi();
  const cart = useCart();
  return (
    <nav className="nav" id="nav" aria-label="Main navigation">
      <div className="nav-inner">
        <Link className="nav-logo" to="/" aria-label="Mandala Magic by OM — Home">
          <span className="nav-logo-mark" aria-hidden="true"><img src="/assets/img/navlogo.png" alt="Mandala Magic by OM logo" /></span>
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>{l.t}</NavLink>
          ))}
        </div>
        <div className="nav-actions">
          <button className="icon-btn" id="searchBtn" aria-label="Search artwork and products" onClick={() => ui.setSearchOpen(true)}><Svg d={ICONS.search} /></button>
          <a className="icon-btn" id="acctBtn" aria-label="Account" href="/account/index.html"><Svg d={ICONS.user} /></a>
          <button className="icon-btn" id="cartBtn" aria-label="Open shopping bag" onClick={cart.openCart}>
            <Svg d={ICONS.bag} />
            <span className="count cart-count" style={{ display: cart.count ? 'grid' : 'none' }}>{cart.count}</span>
          </button>
          <button className="icon-btn theme-btn" id="themeBtn" aria-label="Toggle light and dark theme" onClick={ui.toggleTheme}>
            <Svg d={ui.theme === 'dark' ? ICONS.sun : ICONS.moon} />
          </button>
          <Link className="btn btn-gold btn-sm nav-cta magnetic" to="/shop">Shop the Art</Link>
          <button
            className={"icon-btn burger" + (ui.menuOpen ? ' is-open' : '')}
            id="burgerBtn"
            aria-label={ui.menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={ui.menuOpen}
            aria-controls="mmenu"
            onClick={() => ui.setMenuOpen(o => !o)}
          >
            <Svg d={'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="20" height="20"><path d="M3 6h18M3 12h18M9 18h12" stroke-linecap="round"/></svg>'} />
          </button>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  const ui = useUi();
  const submitNews = e => {
    e.preventDefault();
    ui.toast('Welcome to the magic ✦ You’ll hear from Orchid soon.');
    e.currentTarget.reset();
  };
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="foot-brand">
            <img src="/logo.png" alt="Mandala Magic by OM logo" />
            <p className="serif-it" style={{ color: 'var(--gold-light)', fontSize: '1.1rem' }}>“Art created with intention.”</p>
            <p>Twenty-seven years of Mandalas, landscapes and daily art — made to inspire your everyday life.</p>
            <p style={{ marginTop: '1rem', fontSize: '.95rem' }}>Say hello at <a href="mailto:support@mandalamagic.shop" className="foot-email">support@mandalamagic.shop</a></p>
            <div className="foot-social">
              <a className="icon-btn" href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram"><Svg d={ICONS.ig} /></a>
              <a className="icon-btn" href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook"><Svg d={ICONS.fb} /></a>
              <a className="icon-btn" href="https://x.com" target="_blank" rel="noopener" aria-label="X (Twitter)"><Svg d={ICONS.tw} /></a>
            </div>
          </div>
          <div className="foot-col">
            <h4>Explore</h4>
            <Link to="/shop">Shop</Link>
            <Link to="/gallery">Art Gallery</Link>
            <Link to="/daily">Daily Mandala</Link>
            <Link to="/collections">Collections</Link>
          </div>
          <div className="foot-col">
            <h4>Visit</h4>
            <Link to="/about">About Orchid</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/gallery">Artist's Notes</Link>
            <Link to="/daily">Today's Creation</Link>
          </div>
          <div className="foot-col">
            <h4>Good to Know</h4>
            <Link to="/checkout">Shipping</Link>
            <Link to="/contact">Returns</Link>
            <Link to="/contact">Privacy Policy</Link>
            <Link to="/contact">Terms</Link>
            <form className="foot-news form-news" onSubmit={submitNews}>
              <label className="visually-hidden" htmlFor="footEmail">Email</label>
              <input className="input" id="footEmail" type="email" required placeholder="Your email address" autoComplete="email" />
              <button className="btn btn-gold btn-sm" type="submit">Join</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© Mandala Magic by OM. <span className="gold-dot">✦</span> All Rights Reserved.</span>
          <span>Art created with intention · printed on demand, just for you</span>
        </div>
      </div>
    </footer>
  );
}

export function Preloader() {
  const [gone, setGone] = useState(() => {
    try { if (sessionStorage.getItem('mm_intro')) return true; } catch (e) { }
    return false;
  });
  React.useEffect(() => {
    if (gone) return;
    const fade = () => {
      setGone(true);
      try { sessionStorage.setItem('mm_intro', '1'); } catch (e) { }
    };
    let t = setTimeout(fade, 1500);
    window.addEventListener('load', () => { clearTimeout(t); fade(); });
    return () => { clearTimeout(t); window.removeEventListener('load', fade); };
  }, [gone]);
  if (gone) return null;
  return (
    <div className="preloader is-active" id="preloader" aria-hidden="true">
      <div className="pre-mandala"><span className="pre-core"><i></i></span></div>
      <div className="pre-word">MANDALA MAGIC<small>by&nbsp;OM</small></div>
      <div className="pre-bar"><i></i></div>
    </div>
  );
}

/* Fixed ambient layers — created once, styled by style.css. */
export function AmbientElements() {
  return (
    <>
      <canvas id="bgParticles" aria-hidden="true"></canvas>
      <div id="cursorGlow" aria-hidden="true"></div>
      <div id="cursorRing" aria-hidden="true"></div>
      <div id="cursorDot" aria-hidden="true"></div>
      <div className="page-bg-orb orb-1" aria-hidden="true"></div>
      <div className="page-bg-orb orb-2" aria-hidden="true"></div>
      <div className="page-bg-orb orb-3" aria-hidden="true"></div>
      <button id="toTop" className="to-top" aria-label="Back to top"><Svg d={ICONS.arrow} /></button>
      <div id="scrollProgress" className="scroll-progress" aria-hidden="true"><i></i></div>
    </>
  );
}