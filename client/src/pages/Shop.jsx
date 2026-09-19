import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCatalog, useCart, useUi, Svg, ICONS, money } from '../context';

const CATS = [
  { k: 'all', t: 'All Products' }, { k: 'prints', t: 'Art Prints' }, { k: 'canvas', t: 'Canvas & Wall Art' },
  { k: 'tshirts', t: 'T-Shirts' }, { k: 'hoodies', t: 'Hoodies' }, { k: 'apparel', t: 'Apparel' },
  { k: 'decor', t: 'Home Decor' }, { k: 'accessories', t: 'Accessories' }, { k: 'gifts', t: 'Gifts' },
  { k: 'featured', t: 'Featured' }
];
const PAGE = 9;

export default function ShopPage() {
  const cat = useCatalog();
  const cart = useCart();
  const ui = useUi();
  const [params] = useSearchParams();
  const artFilter = params.get('art') || '';
  const [catK, setCatK] = useState('all');
  const [shown, setShown] = useState(PAGE);

  const sorted = useMemo(() => cat.products.slice().sort((a, b) => String(b.name).localeCompare(String(a.name))), [cat.products]);

  useEffect(() => { setCatK('all'); setShown(PAGE); }, [artFilter]);

  const list = useMemo(() => {
    let base = sorted;
    if (artFilter) base = base.filter(p => p.artId === artFilter);
    if (catK !== 'all') base = base.filter(p => p.tags.includes(catK));
    return base;
  }, [sorted, artFilter, catK]);

  const visible = list.slice(0, shown);
  const bannerArt = artFilter ? cat.findArt(artFilter) : null;

  return (
    <>
      <header className="page-hero">
        <div className="wrap">
          <span className="eyebrow center reveal">The Shop</span>
          <h1 className="display-xl reveal" style={{ '--d': '.1s' }}>Wear the Magic.<br /><span className="grad-gold serif-it">Live the Art.</span></h1>
          <p className="lede reveal" style={{ '--d': '.2s' }}>Every artwork becomes something you can hold — prints, apparel, decor and gifts, made to order just for you.</p>
        </div>
      </header>

      <section className="sec sec-tight" style={{ paddingTop: 10 }} aria-labelledby="shopTitle">
        <div className="wrap">
          {bannerArt && (
            <div style={{ textAlign: 'center', marginBottom: 26 }} id="artFilterBanner">
              <div className="glass" style={{ padding: '18px 26px', display: 'inline-flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="lb-cat">Showing products featuring</span>
                <b className="serif-it" style={{ fontSize: '1.2rem' }} id="artBannerName">{bannerArt.title}</b>
                <button className="btn btn-ghost btn-sm" id="clearArtFilter" onClick={() => { history.replaceState(null, '', '/shop'); setShown(PAGE); }}>Show everything</button>
              </div>
            </div>
          )}
          <div className="filter-bar" id="catBar">
            {CATS.map(c => (
              <button key={c.k} className={'chip' + (catK === c.k ? ' active' : '')} data-cat={c.k} onClick={() => { setCatK(c.k); setShown(PAGE); }}>
                {c.t}
              </button>
            ))}
          </div>
          <p className="art-result-count" id="shopCount">{list.length + ' products'}</p>
          <div className="shop-grid" id="shopGrid">
            {visible.map(p => {
              const art = cat.findArt(p.artId);
              return (
                <div key={p.id} className="product-card reveal">
                  <div className="pc-media">
                    <button className="pc-art" data-pd={p.id} aria-label={'View ' + (p.name || p.type)}>
                      <div className="mockup-wrap" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(p.artId) }} />
                      <span className="pc-type">{p.type}</span>
                    </button>
                    <button className={'pc-wish' + (ui.wishlistHas(p.id) ? ' on' : '')} data-wish={p.id} aria-label="Toggle wishlist"><Svg d={ui.wishlistHas(p.id) ? ICONS.heartFill : ICONS.heart} /></button>
                    <button className="pc-view" data-view={p.artId} aria-label="View artwork"><Svg d={ICONS.eye} /></button>
                  </div>
                  <div className="pc-body">
                    <a className="nm" href={'/product/' + p.id}>{p.name || ((art ? art.title : '') + ' ' + p.type)}</a>
                    <div className="pc-row">
                      <span className="pc-price">{money(p.price)}</span>
                      <button className="btn btn-gold btn-sm" data-addq={p.id}>Add — {money(p.price)}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {visible.length < list.length && (
            <div className="load-more-wrap">
              <button className="btn btn-ghost" id="shopMore" onClick={() => setShown(s => s + PAGE)}>
                <Svg d={'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>'} />
                Load More Products
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}