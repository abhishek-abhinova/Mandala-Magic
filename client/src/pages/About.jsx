import React from 'react';
import { Link } from 'react-router-dom';
import { useCatalog, Svg, ICONS } from '../context';

const PHILOSOPHY = [
  { icon: ICONS.leaf, h: 'Intention in Every Object', p: 'Orchid hopes that whatever you carry away — a print, a hoodie, a cushion — carries a little of the morning it was made.' },
  { icon: ICONS.palette, h: 'Art Should Be Livable', p: "Art doesn't belong behind glass. It belongs in kitchens, living rooms, and long walks." },
  { icon: ICONS.heart, h: 'Every Day Is a New Canvas', p: 'There is always another circle to draw. That is the whole philosophy.' }
];

const METRICS = [
  { n: '27', l: 'Years of Creation' },
  { n: '900+', l: 'Artworks in Archive' },
  { n: '1', l: 'New Mandala Every Day' },
  { n: '100%', l: 'Original Art' }
];

export default function AboutPage() {
  const cat = useCatalog();
  const sorted = cat.artworks.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const artGolden = sorted.find(a => (a.title || '').toLowerCase().indexOf('intention') > -1) || sorted[0];
  const artLand = sorted.find(a => a.cat === 'landscape') || sorted[1] || sorted[0];

  return (
    <>
      <header className="page-hero">
        <div className="wrap">
          <span className="eyebrow center reveal">The Artist</span>
          <h1 className="display-xl reveal" style={{ '--d': '.1s' }}>Meet <span className="grad-gold serif-it">Orchid Mandala</span></h1>
          <p className="lede reveal" style={{ '--d': '.2s' }}>An artist, a daily ritual, and twenty-seven years of drawing with intention.</p>
        </div>
      </header>

      <section className="sec sec-tight" aria-label="Orchid's story">
        <div className="wrap-narrow">
          <p className="about-verse center reveal">"I don't make art to escape the world — <span className="hl">I make it to meet it more gently.</span> Every mandala is a single honest feeling, drawn in a circle."</p>
          <hr className="rule-gold" style={{ maxWidth: 320, margin: '36px auto' }} />
        </div>
      </section>

      <section className="sec sec-tight" style={{ paddingTop: 0 }} aria-label="The journey">
        <div className="wrap">
          <div className="grid-2">
            <div className="reveal-l">
              <span className="eyebrow">The Practice</span>
              <h2 className="display-m" style={{ margin: '16px 0 18px' }}>One Circle, Every Morning</h2>
              <p className="lede">In 1999, Orchid made a simple promise to himself: draw one mandala a day as a way of naming what he hoped the day could be. No audience, no product, no plan.</p>
              <p className="lede" style={{ marginTop: 14 }}>Twenty-seven years later, over nine thousand circles have accumulated — a quiet lifetime of intentions. What he never expected was that the world would want them, wear them, and hang them on their walls.</p>
              <div className="story-points" style={{ margin: '22px 0 0' }}>
                {['Daily Mandalas', 'Digital Landscapes', 'Sacred Geometry', 'Colour Rituals'].map(c => <span key={c} className="chip">{c}</span>)}
              </div>
            </div>
            <div>
              {artGolden && (
                <div className="art-frame reveal-r" data-tilt data-gold data-glare onClick={() => undefined}>
                  <button className="about-art" data-view={artGolden.id} aria-label={'View ' + artGolden.title}>
                    <div style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: cat.artworkSVG(artGolden.id) }} />
                  </button>
                  <div className="story-fig-caption">Golden Intention — the day the practice found its name</div>
                </div>
              )}
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 'clamp(50px,7vw,90px)' }}>
            <div className="art-frame reveal-l" data-tilt style={{ order: 1 }}>
              {artLand && <button className="about-art" data-view={artLand.id} aria-label={'View ' + artLand.title}><div style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: cat.artworkSVG(artLand.id) }} /></button>}
              <div className="story-fig-caption" style={{ marginTop: 18 }}>Path of Light — a landscape from the “quiet place” collection</div>
            </div>
            <div className="reveal-r" style={{ order: 2 }}>
              <span className="eyebrow">Inspiration</span>
              <h2 className="display-m" style={{ margin: '16px 0 18px' }}>Where the Magic Lives</h2>
              <p className="lede">Orchid finds most of his art in the spaces between things: the hush before sunrise, the weight of a word he hasn't said, the way light falls on water. His digital landscapes are imagined places; his mandalas are feelings that learned to draw.</p>
              <p className="lede" style={{ marginTop: 14 }}>And occasionally, a whole universe arrives all at once — those become the pieces you'll find in the Cosmic Dreams collection.</p>
              <div className="story-cta-row" style={{ marginTop: 28 }}>
                <Link className="btn btn-gold magnetic" to="/gallery">See the Artwork</Link>
                <Link className="btn btn-ghost" to="/daily">Today's Mandala</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec sec-tight" style={{ paddingTop: 20 }} aria-label="By the numbers">
        <div className="wrap">
          <div className="glass grid-4" style={{ padding: 'clamp(24px,3vw,40px)' }}>
            {METRICS.map((m, i) => (
              <div key={m.l} className="metric reveal" style={{ '--d': (i * 0.1) + 's' }}>
                <div className="m-num">{m.n}</div>
                <div className="m-lbl">{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec-tight" style={{ paddingTop: 20 }} aria-label="Philosophy">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center">A Simple Belief</span>
            <h2 className="display-m">Why Share the <span className="grad-gold serif-it">Magic?</span></h2>
          </div>
          <div className="grid-3 stagger">
            {PHILOSOPHY.map(t => (
              <div key={t.h} className="tile wstep">
                <div className="icon"><Svg d={t.icon} /></div>
                <h3>{t.h}</h3>
                <p>{t.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec-tight" style={{ paddingTop: 20 }} aria-label="Contact Orchid">
        <div className="wrap-narrow center">
          <div className="glass" style={{ padding: 'clamp(30px,4vw,50px)' }}>
            <h2 className="display-m">A Note From Orchid</h2>
            <p className="serif-it" style={{ fontSize: '1.25rem', color: 'var(--gold-light)', margin: '18px 0' }}>"Thank you for making this dream real."</p>
            <p className="lede" style={{ margin: '0 auto' }}>Writing to Orchid is lovely. Questions, ideas for prints, collaborations, or simply sharing how a mandala found you — it all lands in his inbox with care.</p>
            <div style={{ marginTop: 26 }}>
              <Link className="btn btn-gold magnetic" to="/contact">Write to Orchid</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}