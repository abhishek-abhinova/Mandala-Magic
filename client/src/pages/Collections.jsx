import React from 'react';
import { Link } from 'react-router-dom';
import { useCatalog, useUi, Svg, ICONS } from '../context';

export default function CollectionsPage() {
  const cat = useCatalog();
  const ui = useUi();

  return (
    <>
      <header className="page-hero">
        <div className="wrap">
          <span className="eyebrow center reveal">Curated Worlds</span>
          <h1 className="display-xl reveal" style={{ '--d': '.1s' }}>The <span className="grad-gold serif-it">Collections</span></h1>
          <p className="lede reveal" style={{ '--d': '.2s' }}>Seven worlds woven from twenty-seven years of daily intention.</p>
        </div>
      </header>

      <section className="sec sec-tight" style={{ paddingTop: 6 }} aria-label="Collections">
        <div className="wrap" id="collectionsWrap">
          {cat.collections.map((c, ci) => {
            const cover = cat.findArt(c.artId);
            return (
              <div key={c.id} className="collection-large" id={'coll-' + c.id}>
                <div className="coll-overview">
                  <span className="coll-idx">0{ci + 1}</span>
                  <h2 className="display-m" style={{ margin: '8px 0 12px' }}>{c.name}</h2>
                  <p className="lede">{c.blurb}</p>
                  <span className="coll-count">{c.members.length} pieces</span>
                </div>
                {cover && (
                  <div className="coll-cover reveal-zoom">
                    <button className="coll-cover-btn" data-view={c.artId} aria-label={'View ' + (cover.title || 'artwork')}>
                      <div className="art-frame" data-tilt data-gold data-glare><div className="coll-art" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(c.artId) }} /></div>
                    </button>
                  </div>
                )}
                <div className="coll-members">
                  {c.members.slice(0, 4).map(id => {
                    const a = cat.findArt(id);
                    if (!a) return null;
                    return (
                      <button key={id} className="coll-mini" data-view={id} aria-label={'View ' + a.title}>
                        <div className="art-frame" data-tilt><div className="coll-mini-art" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(id) }} /></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!cat.collections.length && (
            <div className="center" style={{ padding: '60px 0' }}>
              <div className="hero-orb gold" style={{ position: 'relative', display: 'inline-block' }}></div>
              <p className="lede" style={{ marginTop: 20 }}>Collections are being woven… check back soon.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}