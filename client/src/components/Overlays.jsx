import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog, useCart, useUi, Svg, ICONS, money, PRODUCT_TYPES } from '../context';
import { esc } from '../lib/icons';

/* ============================ MOBILE MENU ============================ */
export function Mmenu() {
  const ui = useUi();
  const links = [
    { to: '/', t: 'Home' }, { to: '/gallery', t: 'Art Gallery' }, { to: '/shop', t: 'Shop' },
    { to: '/daily', t: 'Daily Mandala' }, { to: '/about', t: 'About Orchid' },
    { to: '/collections', t: 'Collections' }, { to: '/contact', t: 'Contact' }
  ];
  if (!ui.menuOpen) return null;
  return (
    <div className="mmenu wrap-m hid open" id="mmenu">
      <div className="mm-top">
        <span className="mm-big serif-it">Menu</span>
        <button className="icon-btn" id="mmClose" aria-label="Close menu" onClick={() => ui.setMenuOpen(false)}>
          <Svg d={ICONS.x} />
        </button>
      </div>
      <div className="mm-links">
        {links.map(l => (
          <Link key={l.to} to={l.to} end={l.to === '/'} onClick={() => ui.setMenuOpen(false)}>{l.t}</Link>
        ))}
        <a href="/account/index.html">My Account</a>
      </div>
      <div className="mm-foot">
        <Link className="btn btn-gold" to="/shop" onClick={() => ui.setMenuOpen(false)}>Shop the Art</Link>
        <div className="mm-social">
          <a className="icon-btn" href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram"><Svg d={ICONS.ig} /></a>
          <a className="icon-btn" href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook"><Svg d={ICONS.fb} /></a>
          <a className="icon-btn" href="https://x.com" target="_blank" rel="noopener" aria-label="X (Twitter)"><Svg d={ICONS.tw} /></a>
        </div>
      </div>
    </div>
  );
}

/* ============================ SEARCH ============================ */
export function SearchOverlay() {
  const ui = useUi();
  const cat = useCatalog();
  const [q, setQ] = useState('');
  if (!ui.searchOpen) return null;

  const query = q.trim().toLowerCase();
  const arts = query ? cat.artworks
    .filter(a => (a.title + a.intention + a.note + a.cat + a.date).toLowerCase().includes(query))
    .slice(0, 4) : [];
  const prods = query ? cat.products
    .filter(p => (p.name + p.type + p.tags.join(' ')).toLowerCase().includes(query))
    .slice(0, 4) : [];

  return (
    <div className="overlay search-overlay open" id="searchOv" onClick={e => { if (e.target === e.currentTarget) ui.setSearchOpen(false); }}>
      <div className="ov-inner" style={{ '--ovd': '.12s' }}>
        <button className="ov-x" data-ovclose aria-label="Close search" onClick={() => ui.setSearchOpen(false)}>
          <Svg d={ICONS.x} />
        </button>
        <div className="orama">
          <span className="ov-gold">Find your art</span>
          <h2>Search <em>Orchid's</em> world</h2>
          <div className="orama-form">
            <div className="input-wrap">
              <span className="iw-ic"><Svg d={ICONS.search} /></span>
              <input className="input input-lg" id="sInput" type="search" placeholder="Try “mandala”, “landscape”, “T-shirt”…" autoFocus autoComplete="off" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <button className="btn btn-gold" id="sBtn" aria-label="Search"><Svg d={ICONS.search} /></button>
          </div>
          <div className="s-results" id="sResults">
            {!query && <div className="sr-hint">Type to explore Orchid's collection — artwork, prints and apparel.</div>}
            {query && !arts.length && !prods.length && <div className="sr-hint">Nothing found for “{q}”. Try another word ✦</div>}
            {arts.map(a => (
              <Link key={'a' + a.id} className="search-item" to={'/gallery#view-' + a.id} onClick={() => { ui.setSearchOpen(false); }}>
                <span className="si-media" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(a.id) }} />
                <span className="si-txt"><strong>{a.title || 'Untitled'}</strong><small>Artwork · {a.date || a.cat}</small></span>
                <span className="si-arrow"><Svg d={ICONS.arrow} /></span>
              </Link>
            ))}
            {prods.map(p => {
              const art = cat.findArt(p.artId);
              return (
                <Link key={'p' + p.id} className="search-item" to={'/product/' + p.id} onClick={() => { ui.setSearchOpen(false); }}>
                  <span className="si-media" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(p.artId) }} />
                  <span className="si-txt"><strong>{p.name || (art ? art.title + ' ' + p.type : p.type)}</strong><small>{p.type} · {money(p.price)}</small></span>
                  <span className="si-arrow"><Svg d={ICONS.arrow} /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ CART DRAWER ============================ */
export function CartDrawer() {
  const ui = useUi();
  const cart = useCart();
  const cat = useCatalog();
  if (!cart.drawer) return null;

  const svgOf = pid => cat.artworkSVG(pid);

  return (
    <div className="overlay cart-overlay open" id="cartOverlay">
      <div className="cart-backdrop" data-cartclose aria-hidden="true"></div>
      <aside className="cart-drawer open" id="cartDrawer" aria-label="Shopping bag" role="dialog" aria-modal="true">
        <div className="cd-head">
          <div className="cd-title"><Svg d={ICONS.bag} /><h3>Your Bag</h3><span className="cd-count">{cart.count} {cart.count === 1 ? 'item' : 'items'}</span></div>
          <button className="icon-btn" data-cartclose aria-label="Close bag" onClick={cart.closeCart}><Svg d={ICONS.x} /></button>
        </div>
        <div className="cd-scroll">
          {!cart.cart.length && (
            <div className="cart-empty">
              <span className="cart-empty-mandala" aria-hidden="true"><Svg d={ICONS.palette} /></span>
              <h3>Your bag is empty.</h3>
              <p>Discover a piece made with intention, just for you.</p>
              <Link className="btn btn-gold" to="/shop" onClick={cart.closeCart}>Explore the Shop</Link>
            </div>
          )}
          {cart.cart.map(item => {
            const p = cat.findProduct(item.pid);
            const artId = p ? p.artId : item.pid;
            const art = cat.findArt(artId);
            const name = p ? (p.name || art.title + ' ' + p.type) : art.title;
            const artTitle = art ? art.title : '';
            const label = p && art ? (name.replace(artTitle, '').trim() || p.type) : (p ? p.type : '');
            return (
              <div className="cart-item" key={item.key}>
                <div className="ci-inner">
                  <div className="ci-media" dangerouslySetInnerHTML={{ __html: svgOf(artId) }} />
                  <div className="ci-info">
                    <div className="ci-title"><strong>{label || name}</strong><span>{artTitle}</span></div>
                    <div className="ci-meta">{item.size}{item.color ? ' · ' + (item.color.charAt(0).toUpperCase() + item.color.slice(1)) : ''}</div>
                    <div className="ci-row">
                      <div className="ci-qty">
                        <button data-q={item.key} data-d="-1" aria-label="Decrease quantity">−</button>
                        <span>{item.qty}</span>
                        <button data-q={item.key} data-d="1" aria-label="Increase quantity">+</button>
                      </div>
                      <button className="ci-rm" data-rm={item.key} aria-label={'Remove ' + (label || name)}>✕</button>
                    </div>
                  </div>
                  <div className="ci-price">{money((p ? p.price : 0) * item.qty)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cd-foot">
          <div className="cart-summary">
            <div className="cs-line"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
            <div className="cs-line"><span>Shipping</span><span>Calculated at checkout</span></div>
            <div className="cs-total"><span>Total</span><span>{money(cart.subtotal)}</span></div>
            <Link className="btn btn-gold w-full" to="/checkout" onClick={cart.closeCart}>Checkout</Link>
            <p className="cs-note">
              <button data-continue onClick={cart.closeCart}>Continue shopping</button> — free shipping on orders over <strong>$65</strong> <em>✦</em>
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ============================ AVOIDABLE HELPERS ============================ */
function availChips(artId, cat, LinkWrap) {
  return PRODUCT_TYPES.map(t => {
    const p = cat.products.find(x => x.artId === artId && x.type === t);
    if (!p) return <span key={t} className="avail-line" style={{ pointerEvents: 'none', opacity: 0.3 }}>{t}</span>;
    return <a key={t} className="avail-line" href={'/product/' + p.id}><span className="dot"></span>{t}</a>;
  });
}

/* ============================ LIGHTBOX ============================ */
export function Lightbox() {
  const ui = useUi();
  const cat = useCatalog();
  const cart = useCart();
  const lb = ui.lightbox;

  React.useEffect(() => {
    if (!lb) return;
    const key = e => { if (e.key === 'Escape') ui.closeLightbox(); };
    document.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = '';
    };
  }, [lb]);

  if (!lb) return null;

  const closeBtn = <button className="lb-close" data-lbclose aria-label="Close" onClick={ui.closeLightbox}><Svg d={ICONS.x} /></button>;

  let body = null;
  if (lb.kind === 'product') {
    const p = lb.p;
    const art = lb.art;
    const title = p.name && art ? p.name.replace(art.title + ' ', '').replace(art.title, '') : (p.name || '');
    const addIt = () => {
      const r = cart.add(p.id);
      if (r) ui.toast('Added to bag — ' + r.label, true);
      ui.closeLightbox();
    };
    body = (
      <div className="lb-info">
        <span className="lb-cat">{art ? art.title + ' · ' : ''}{p.type}</span>
        <h2 className="lb-title">{title}</h2>
        <div className="lb-meta">{'$' + p.price.toFixed(2)}{p.sizes.length ? ' · ' + p.sizes.length + ' sizes' : ''}</div>
        {p.desc && <p className="lb-note">{p.desc}</p>}
        <div className="lb-div"></div>
        <span className="lb-label">Available Sizes</span>
        <div className="size-opts">{p.sizes.map(s => <span key={s} className="size-opt" style={{ cursor: 'default' }}>{s}</span>)}</div>
        <div className="lb-actions" style={{ marginTop: 10 }}>
          <button className="btn btn-gold btn-sm" onClick={addIt}>Add to Cart · ${p.price.toFixed(2)}</button>
          <Link className="btn btn-ghost btn-sm" to={'/product/' + p.id} onClick={ui.closeLightbox}>Full Details</Link>
        </div>
      </div>
    );
  } else {
    const art = lb.art;
    const style = (art.cat || '').charAt(0).toUpperCase() + (art.cat || '').slice(1);
    body = (
      <div className="lb-info">
        <span className="lb-cat">{style} · {art.date || ''}{art.featured ? ' · Featured' : ''}</span>
        <h2 className="lb-title">{art.title}</h2>
        {art.intention && <p className="lb-intention">“{art.intention}”</p>}
        {art.note && <p className="lb-note">{art.note}</p>}
        <div className="lb-div"></div>
        <span className="lb-label">Artist's Note</span>
        <p className="lb-note">{art.note || 'An intention written in light.'}</p>
        <div className="lb-div"></div>
        <span className="lb-label">LOVE THIS DESIGN?</span>
        <div className="products-avail">{availChips(art.id, cat)}</div>
        <div className="lb-actions" style={{ marginTop: 6 }}>
          <Link className="btn btn-gold btn-sm" to={'/shop?art=' + art.id} onClick={ui.closeLightbox}>Shop This Artwork</Link>
          <Link className="btn btn-ghost btn-sm" to="/gallery" onClick={ui.closeLightbox}>View Full Gallery</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="lightbox open" id="lightbox" onClick={e => { if (e.target === e.currentTarget) ui.closeLightbox(); }}>
      <div className="lb-card" id="lightboxInner">
        <div className="lb-art">
          <div dangerouslySetInnerHTML={{ __html: cat.artworkSVG(lb.kind === 'product' ? lb.p.artId : lb.art.id) }} />
          {closeBtn}
        </div>
        {body}
      </div>
    </div>
  );
}

/* ============================ TOASTS ============================ */
export function ToastStack() {
  const ui = useUi();
  return (
    <div className="toast-stack" id="toastStack">
      {ui.toasts.map(t => (
        <div className="toast" key={t.id}><p dangerouslySetInnerHTML={{ __html: t.html }} /></div>
      ))}
    </div>
  );
}