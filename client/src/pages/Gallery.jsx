import React, { useMemo, useState } from 'react';
import { useCatalog, useUi, Svg, ICONS } from '../context';

const FILTERS = [
  { k: 'all', t: 'All Works' }, { k: 'mandala', t: 'Mandalas' }, { k: 'landscape', t: 'Digital Landscapes' },
  { k: 'abstract', t: 'Abstract Art' }, { k: 'featured', t: 'Featured Works' }, { k: 'newest', t: 'Newest Creations' }
];
const PAGE = 9;

export default function GalleryPage() {
  const cat = useCatalog();
  const ui = useUi();
  const [filter, setFilter] = useState('all');
  const [shown, setShown] = useState(PAGE);

  const sorted = useMemo(() => cat.artworks.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))), [cat.artworks]);

  const list = useMemo(() => {
    if (filter === 'featured') return sorted.filter(a => a.featured || a.best);
    if (filter === 'newest') return sorted.slice(0, 6);
    if (filter === 'all') return sorted;
    return sorted.filter(a => a.cat === filter);
  }, [sorted, filter]);

  const visible = list.slice(0, shown);

  return (
    <>
      <header className="page-hero">
        <div className="wrap">
          <span className="eyebrow center reveal">The Collection</span>
          <h1 className="display-xl reveal" style={{ '--d': '.1s' }}>The Art <span className="grad-gold serif-it">Gallery</span></h1>
          <p className="lede reveal" style={{ '--d': '.2s' }}>Explore a lifetime of imagination, intention and creativity.</p>
          <p className="daily-note center reveal" style={{ '--d': '.3s', margin: '18px auto 0', maxWidth: '52ch' }}>
            {cat.artworks.length} featured works shown here — and hundreds more waiting in Orchid's archive.
          </p>
        </div>
      </header>

      <section className="sec sec-tight" style={{ paddingTop: 10 }} aria-labelledby="galleryTitle">
        <div className="wrap">
          <div className="filter-bar" id="filterBar">
            {FILTERS.map(f => (
              <button key={f.k} className={'chip' + (filter === f.k ? ' active' : '')} data-filter={f.k} onClick={() => { setFilter(f.k); setShown(PAGE); }}>
                {f.t}
              </button>
            ))}
          </div>
          <p className="art-result-count" id="galCount">{visible.length === list.length ? list.length + ' artworks' : 'Showing ' + visible.length + ' of ' + list.length}</p>
          <div className="masonry" id="galleryGrid">
            {visible.map(a => (
              <div key={a.id} className="pcard reveal">
                <button className="pcard-media" data-view={a.id} aria-label={'View ' + (a.title || a.id)}>
                  <div className="pcard-art" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(a.id) }} />
                  <span className="pcard-flag">{a.cat}</span>
                </button>
                <div className="pcard-info">
                  <h4>{a.title || 'Untitled'}</h4>
                  <span className="pcard-date">{a.date || ''}</span>
                  {a.intention && <span className="pcard-int">{a.intention}</span>}
                  <div className="pcard-ft">
                    <button className={'pcard-wish-btn' + (ui.wishlistHas(a.id) ? ' on' : '')} data-wish={a.id} aria-label="Toggle wishlist"><Svg d={ui.wishlistHas(a.id) ? ICONS.heartFill : ICONS.heart} /></button>
                    {cat.products.some(p => p.artId === a.id) && (
                      <button className="btn btn-gold btn-sm pcard-shop" data-shopart={a.id}>Shop <Svg d={ICONS.arrow} /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {visible.length < list.length && (
            <div className="load-more-wrap">
              <button className="btn btn-ghost" id="loadMore" onClick={() => setShown(s => s + PAGE)}>
                <Svg d={'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>'} />
                Load More Artwork
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}