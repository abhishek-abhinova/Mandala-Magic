import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog, useCart, useUi, Svg, ICONS, money } from '../context';
import { COLOR_MAP } from '../lib/icons';

export default function ProductPage() {
  const { id } = useParams();
  const cat = useCatalog();
  const cart = useCart();
  const ui = useUi();
  const p = cat.findProduct(id);
  const [size, setSize] = useState(p && p.sizes && p.sizes.length ? p.sizes[0] : 'One Size');
  const [num, setNum] = useState(1);

  const art = p ? cat.findArt(p.artId) : null;

  const related = useMemo(() => {
    if (!p) return [];
    const same = cat.products.filter(x => x.id !== p.id && (x.artId === p.artId || x.type === p.type));
    const sorted = same.slice().sort((a, b) => (a.artId === p.artId ? -1 : 0) - (b.artId === p.artId ? -1 : 0));
    const pool = sorted.length >= 4 ? sorted : [...sorted, ...cat.products.filter(x => x.id !== p.id && !same.includes(x))];
    return pool.slice(0, 4);
  }, [p, cat.products]);

  if (!p) {
    return (
      <section className="sec" style={{ paddingTop: 'calc(var(--nav-h) + 56px)' }} aria-label="Product not found">
        <div className="wrap center" style={{ padding: '60px 0' }}>
          <span className="eyebrow center">Lost in the Gallery</span>
          <h1 className="display-m" style={{ margin: '12px 0 20px' }}>This piece drifted <span className="grad-gold serif-it">away</span></h1>
          <p className="lede" style={{ margin: '0 auto 28px', maxWidth: '46ch' }}>The product you're looking for isn't shoppable right now — but the gallery is full of magic still waiting.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn btn-gold magnetic" to="/shop">Back to the Shop</Link>
            <Link className="btn btn-ghost" to="/gallery">Explore the Gallery</Link>
          </div>
        </div>
      </section>
    );
  }

  const colorHex = p.colors && p.colors.length ? (COLOR_MAP[p.colors[0].toLowerCase()] || '#241245') : '#241245';
  const addIt = () => {
    const r = cart.add(p.id, { size, qty: num });
    if (r) ui.toast('Added to bag — ' + r.label, true);
  };

  return (
    <>
      <section className="sec" style={{ paddingTop: 'calc(var(--nav-h) + 40px)' }} aria-label="Product details">
        <div className="wrap">
          <div className="pd-card">
            <div className="pd-media">
              <div className="pd-art-frame" data-tilt data-gold data-glare data-para="0">
                <button className="pd-art" data-view={p.artId} aria-label={'View the artwork ' + (art ? art.title : '')}>
                  <div className="pd-art-svg" style={{ background: `radial-gradient(circle at 50% 42%, ${colorHex}55, ${colorHex}11 70%)` }} dangerouslySetInnerHTML={{ __html: cat.artworkSVG(p.artId) }} />
                </button>
                <span className="pd-badge">{p.type}</span>
              </div>
            </div>

            <div className="pd-info">
              <span className="pd-cat">Product — {p.type}</span>
              <h1 className="pd-title">{p.name || ((art ? art.title : '') + ' ' + p.type)}</h1>
              <div className="pd-price">{money(p.price)}</div>
              {p.desc && <p className="pd-desc">{p.desc}</p>}

              {p.sizes.length > 1 && (
                <div className="pd-size">
                  <span className="pd-lbl">Size</span>
                  <div className="pd-chips">
                    {p.sizes.map(s => (
                      <button key={s} className={'chip' + (size === s ? ' active' : '')} onClick={() => setSize(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pd-cta">
                <button className="btn btn-gold pd-add" onClick={addIt}>Add to Bag · {money(p.price)}</button>
                <button className={'icon-btn pd-wish' + (ui.wishlistHas(p.id) ? ' on' : '')} data-wish={p.id} aria-label="Toggle wishlist">
                  <Svg d={ui.wishlistHas(p.id) ? ICONS.heartFill : ICONS.heart} />
                </button>
              </div>

              {art && (
                <div className="pd-artist">
                  <div className="pd-artist-mini" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(p.artId) }} />
                  <div>
                    <span className="pd-lbl">The Artwork</span>
                    <button className="pd-artist-name" data-view={art.id} aria-label={'View ' + art.title}>
                      <strong>{art.title}</strong> {art.date && <span>· {art.date}</span>}
                    </button>
                    {art.intention && <p className="pd-int" >“{art.intention}”</p>}
                  </div>
                </div>
              )}

              <div className="pd-trust">
                <div className="row"><Svg d={ICONS.lock} /> <span><b>Studio checkout.</b> No card details collected — Orchid's studio confirms every order personally by email.</span></div>
                <div className="row"><Svg d={ICONS.truck} /> <span><b>Made to order · Free shipping over $65.</b> Premium quality, created only when you choose it.</span></div>
                <div className="row"><Svg d={ICONS.leaf} /> <span><b>Supports an independent artist.</b> Every order keeps the daily practice alive.</span></div>
              </div>
            </div>
          </div>

          <section className="sec-tight" aria-labelledby="relatedH">
            <div className="intro-head">
              <span className="eyebrow center">More Magic</span>
              <h2 className="display-m" id="relatedH">You May Also <span className="grad-gold serif-it">Love</span></h2>
            </div>
            <div className="shop-grid" id="relatedGrid">
              {related.map(rp => {
                const rart = cat.findArt(rp.artId);
                return (
                  <div key={rp.id} className="product-card">
                    <div className="pc-media">
                      <button className="pc-art" data-pd={rp.id} aria-label={'View ' + (rp.name || rp.type)}>
                        <div className="mockup-wrap" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(rp.artId) }} />
                        <span className="pc-type">{rp.type}</span>
                      </button>
                      <button className={'pc-wish' + (ui.wishlistHas(rp.id) ? ' on' : '')} data-wish={rp.id} aria-label="Toggle wishlist"><Svg d={ui.wishlistHas(rp.id) ? ICONS.heartFill : ICONS.heart} /></button>
                      <button className="pc-view" data-view={rp.artId} aria-label="View artwork"><Svg d={ICONS.eye} /></button>
                    </div>
                    <div className="pc-body">
                      <Link className="nm" to={'/product/' + rp.id}>{rp.name || ((rart ? rart.title : '') + ' ' + rp.type)}</Link>
                      <div className="pc-row">
                        <span className="pc-price">{money(rp.price)}</span>
                        <button className="btn btn-gold btn-sm" data-addq={rp.id}>Add — {money(rp.price)}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}