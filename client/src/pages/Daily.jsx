import React from 'react';
import { Link } from 'react-router-dom';
import { useCatalog, useCart, Svg, ICONS, money } from '../context';

const RITUAL = [
  { t: '06 : 00', h: 'Tea & Silence', p: 'No phone, no noise — just a cup of tea and a blank page.' },
  { t: '07 : 00', h: 'The Mandala', p: 'One circle, one intention, drawn in a single sitting.' },
  { t: '08 : 00', h: 'Shared With You', p: 'The artwork goes live on products before most of the world wakes up.' },
  { t: 'ALL DAY', h: 'It Becomes Yours', p: 'Worn, hung, gifted — the intention travels.' }
];

export default function DailyPage() {
  const cat = useCatalog();
  const cart = useCart();
  const d = cat.config.dailyArtwork;
  const artId = d.artId;
  const art = cat.findArt(artId);
  const avail = cat.products.filter(p => p.artId === artId);

  return (
    <>
      <header className="page-hero">
        <div className="wrap">
          <span className="eyebrow center reveal">Daily Practice</span>
          <h1 className="display-xl reveal" style={{ '--d': '.1s' }}>Today's <span className="grad-gold serif-it">Mandala</span></h1>
          <p className="lede reveal" style={{ '--d': '.2s' }}>A new creation. A new intention. Every day.</p>
        </div>
      </header>

      <section className="sec sec-tight" style={{ paddingTop: 6 }} aria-label="Today's Mandala">
        <div className="wrap">
          {art ? (
            <div className="daily-hero">
              <div className="center">
                <span className="eyebrow center">{d.date}</span>
                <h2 className="display-m" style={{ margin: '10px 0 4px' }}>{d.title || 'Untitled'}</h2>
                {d.intention && <p className="lede center" style={{ maxWidth: '52ch', margin: '0 auto 8px' }}>Intention — {d.intention}</p>}
                {d.note && <p className="daily-note center" style={{ margin: '0 auto 24px', maxWidth: '58ch' }}>{d.note}</p>}
                <button className="daily-art-main" data-view={artId} aria-label={'View ' + (d.title || 'today\'s mandala')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div className="art-frame" data-tilt data-gold data-glare style={{ maxWidth: 620, margin: '0 auto' }}>
                    <div className="daily-art" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(artId) }} />
                  </div>
                </button>
              </div>

              {avail.length > 0 && (
                <div className="daily-avail" style={{ marginTop: 30 }}>
                  <p className="daily-note center">Available on:</p>
                  <div className="avail-chips" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {avail.map(p => (
                      <Link key={p.id} className="chip avail-line" to={'/product/' + p.id}><span className="dot"></span>{p.type} · {money(p.price)}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="center" style={{ padding: '60px 0' }}>
              <div className="hero-orb gold" style={{ position: 'relative', display: 'inline-block' }}></div>
              <p className="lede" style={{ marginTop: 20 }}>Today's creation is on its way from the studio…</p>
            </div>
          )}
        </div>
      </section>

      <section className="sec sec-tight" style={{ paddingTop: 0 }}>
        <div className="wrap center">
          <Link className="btn btn-gold magnetic" to={artId ? '/shop?art=' + artId : '/shop'}>
            <Svg d={ICONS.bag} /> Shop Products From Today's Mandala
          </Link>
          <p className="daily-note" style={{ marginTop: 16 }}>Every artwork in the gallery is shoppable — prints, apparel, decor and more.</p>
        </div>
      </section>

      <section className="sec sec-tight" id="howItWorks" aria-labelledby="howH">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center">Why Every Day?</span>
            <h2 className="display-m" id="howH">The Ritual Behind the <span className="grad-gold serif-it">Routine</span></h2>
            <p className="lede">Drawing a Mandala each morning is how Orchid sets his intention — a quiet, sacred way of beginning. Then he shares the day's art with you, and it becomes yours.</p>
          </div>
          <div className="timeline stagger">
            {RITUAL.map(r => (
              <div key={r.t} className="tile wstep">
                <div className="num">{r.t}</div>
                <h3>{r.h}</h3>
                <p>{r.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}