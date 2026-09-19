import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog, useCart, useUi, Svg, ICONS, PRODUCT_TYPES, quoteSVG, money } from '../context';

const VALUE_ITEMS = [
  { icon: ICONS.palette, t: 'UNIQUE ORIGINAL ART', p: 'Every piece is one of a kind — signed, dated and created with a daily intention.' },
  { icon: ICONS.cart, t: 'PREMIUM, MADE TO ORDER', p: 'Printed on demand with premium quality — created for you, only when you choose it.' },
  { icon: ICONS.leaf, t: 'WORLDWIDE SHIPPING', p: 'Art that travels the globe to find a new home — wherever you are.' },
  { icon: ICONS.heart, t: 'SUPPORT AN INDEPENDENT ARTIST', p: 'Every purchase keeps the daily creation alive — one Mandala at a time.' }
];

const CATS = [
  { k: 'Art Print', icon: ICONS.palette, d: 'Gallery-grade giclée prints, archival inks.', q: 'type=Art Print' },
  { k: 'Hoodie', icon: ICONS.brush, d: 'Wear the magic — soft, premium hoodies.', q: 'type=Hoodie' },
  { k: 'T-Shirt', icon: ICONS.leaf, d: 'Everyday wearable art, made to order.', q: 'type=T-Shirt' },
  { k: 'Canvas', icon: ICONS.quote ? ICONS.palette : ICONS.palette, d: 'Stretched canvas, ready to hang.', q: 'type=Canvas' },
  { k: 'Home Decor', icon: ICONS.sun, d: 'Cushions and pieces for every room.', q: 'type=Home Decor' },
  { k: 'Accessories', icon: ICONS.bag, d: 'Totes and gifts that carry the magic.', q: 'type=Accessories' }
];

const TESTIMONIALS = [
  { name: 'Priya R.', where: 'Bangalore, IN', text: 'The Daily Mandala hoodie feels like wearing a quiet, golden morning. The garment itself is beautiful and soft — I live in it.' },
  { name: 'Daniel M.', where: 'Austin, USA', text: 'I bought a print of today’s mandala and framed it the same week. The intention note on the back made me tear up. Truly one of a kind.' },
  { name: 'Amara S.', where: 'London, UK', text: 'Twenty-seven years of daily art, and you can feel every single day of practice in the work. My canvas is the centrepiece of my living room.' }
];

const QUOTE = { t: 'Art is a conversation with the universe. I simply show up every day and listen.', c: 'Orchid Mandala', s: 'CREATING WITH INTENTION SINCE 1999' };

export default function HomePage() {
  const cat = useCatalog();
  const ui = useUi();
  const cart = useCart();

  const daily = cat.config.dailyArtwork;
  const dailyArtId = daily.artId || (cat.artworks[0] && cat.artworks[0].id) || '';
  const loveId = (cat.findArt('cosmic-bloom') && 'cosmic-bloom') || dailyArtId || (cat.artworks[0] && cat.artworks[0].id) || '';

  const sorted = useMemo(() => cat.artworks.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))), [cat.artworks]);
  const byDate = sorted;
  const heroArts = useMemo(() => {
    const base = byDate[0] ? byDate[0].id : '';
    const pool = byDate.filter(a => a.id !== base).slice(0, 3);
    return [base, ...pool.map(a => a.id)].filter(Boolean);
  }, [byDate]);

  const teasers = byDate.filter(a => a.featured || a.best).slice(0, 8);
  const teasersFull = teasers.length >= 6 ? teasers : byDate.slice(0, 8);
  const newestProds = cat.products.slice(0, 8);
  const storyArts = byDate.slice(0, 3);
  const stripArts = (cat.collections[0] && cat.collections[0].members && cat.collections[0].members.slice(0, 5)) || cat.artworks.slice(0, 5);
  const socArts = cat.artworks.slice(0, 8);
  const featuredColl = cat.collections[0];

  /* Hero slideshow */
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (heroArts.length < 2) return;
    const id = setInterval(() => setSlide(s => (s + 1) % heroArts.length), 6000);
    return () => clearInterval(id);
  }, [heroArts.length]);

  const submitNews = e => { e.preventDefault(); ui.toast('Welcome to the magic ✦ You’ll hear from Orchid soon.'); e.currentTarget.reset(); };

  return (
    <>
      {/* -------- HERO -------- */}
      <header className="hero">
        <div className="hero-slides" id="heroSlides" aria-hidden="true">
          {heroArts.map((aid, i) => (
            <div key={aid} className={'hero-slide' + (i === slide ? ' is-on' : '')}>
              <div className="slide-art" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(aid) }} />
              <div className="slide-sheen"></div>
            </div>
          ))}
        </div>
        <div className="hero-shade" aria-hidden="true"></div>
        <div className="hero-vignette" aria-hidden="true"></div>

        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow reveal" style={{ '--d': '.05s' }}>A Studio of Daily Magic</span>
            <h1 className="hero-title reveal" style={{ '--d': '.15s' }}>MANDALA<br />MAGIC <span className="grad-gold serif-it">by OM</span></h1>
            <p className="hero-sub reveal" style={{ '--d': '.3s' }}>Art created with intention.<br />Made to inspire your everyday life.</p>
            <p className="hero-text reveal" style={{ '--d': '.45s' }}>Discover original Mandalas, digital landscapes and beautifully designed products inspired by Orchid Mandala's daily artistic practice.</p>
            <div className="hero-ctas reveal" style={{ '--d': '.6s' }}>
              <Link className="btn btn-royal magnetic" to="/gallery">Explore The Art <Svg d={ICONS.arrow} /></Link>
              <Link className="btn btn-gold magnetic" to="/shop">SHOP THE COLLECTION</Link>
            </div>
            <div className="hero-stats reveal" style={{ '--d': '.75s' }}>27+ YEARS · DAILY CREATION · ART WITH INTENTION</div>
          </div>
        </div>

        <button className="hero-arrow hero-prev" id="heroPrev" aria-label="Previous artwork" onClick={() => setSlide(s => (s - 1 + heroArts.length) % heroArts.length)}><Svg d={'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>'} /></button>
        <button className="hero-arrow hero-next" id="heroNext" aria-label="Next artwork" onClick={() => setSlide(s => (s + 1) % heroArts.length)}><Svg d={'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>'} /></button>
        <div className="hero-dots" id="heroDots" role="tablist" aria-label="Choose hero artwork">
          {heroArts.map((aid, i) => <button key={aid} role="tab" aria-selected={i === slide} className={'hero-dot' + (i === slide ? ' on' : '')} onClick={() => setSlide(i)} />)}
        </div>

        <div className="scroll-hint" aria-hidden="true"><span>Scroll to explore</span><span className="line"></span></div>
      </header>

      {/* -------- VALUE STRIP -------- */}
      <section className="sec sec-tight value-sec" aria-label="Why shop with us">
        <div className="wrap">
          <div className="value-grid stagger">
            {VALUE_ITEMS.map((v, i) => (
              <div key={v.t} className="value-item reveal" style={{ '--d': (i * 0.1) + 's' }}>
                <div className="value-icon"><Svg d={v.icon} /></div>
                <div><h3>{v.t}</h3><p>{v.p}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- MARQUEE -------- */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {['Sacred Geometry', 'Cosmic Dreams', 'Daily Mandalas', 'Art with Intention', 'Wear the Magic', 'Live the Art', 'One Artwork a Day', 'Made to Order'].map(w => [0, 1].map(n => <span key={w + n}>{w}</span>))}
        </div>
      </div>

      {/* -------- TODAY'S MANDALA -------- */}
      <section className="sec sec-tight" aria-labelledby="daily-h">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center reveal">Today's Creation</span>
            <h2 className="display-l reveal" id="daily-h" style={{ '--d': '.1s' }}>The Daily <span className="grad-gold serif-it">Mandala</span></h2>
            <p className="lede reveal" style={{ '--d': '.2s' }}>A new piece of art, every single day — created this morning, yours tonight.</p>
          </div>
          {dailyArtId && (
            <div className="center reveal" style={{ marginTop: 30 }}>
              <button className="daily-hero-card" data-view={dailyArtId} aria-label={'View today\'s mandala: ' + (daily.title || '')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <div className="art-frame" data-tilt style={{ maxWidth: 560, margin: '0 auto' }}>
                  <div className="daily-art" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(dailyArtId) }} />
                </div>
              </button>
              <p className="lede center" style={{ marginTop: 18 }}>
                <span className="chip">{daily.date || 'Today'}</span>{' '}
                <span className="chip">{daily.title}</span>
              </p>
              <div style={{ marginTop: 10 }}>
                <Link className="btn btn-gold magnetic" to="/daily">Explore Today's Creation</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* -------- SHOP BY CATEGORY -------- */}
      <section className="sec" aria-labelledby="cat-h">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center reveal">Endless Ways to Wear the Magic</span>
            <h2 className="display-l reveal" id="cat-h" style={{ '--d': '.1s' }}>Shop by <span className="grad-gold serif-it">Category</span></h2>
            <p className="lede reveal" style={{ '--d': '.2s' }}>From prints to wearables — every category carries the Mandala of the day.</p>
          </div>
          <div className="cat-grid stagger" id="catGrid">
            {CATS.map(c => (
              <Link key={c.k} className="cat-card reveal tilt" to={'/shop?' + c.q} data-tilt data-gold>
                <span className="cat-icon"><Svg d={c.icon} /></span>
                <h3>{c.k}</h3>
                <p>{c.d}</p>
                <span className="cat-link">Shop <Svg d={ICONS.arrow} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* -------- FEATURED ART -------- */}
      <section className="sec" aria-labelledby="gal-h">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center reveal">The Collection</span>
            <h2 className="display-l reveal" id="gal-h" style={{ '--d': '.1s' }}>Art That <span className="grad-gold serif-it">Breathes</span></h2>
            <p className="lede reveal" style={{ '--d': '.2s' }}>From the latest daily Mandala to a lifetime of landscapes — every piece carries an intention written in light.</p>
          </div>
          <div className="masonry stagger" id="teaserGrid">
            {teasersFull.map(a => <ArtTeaser key={a.id} a={a} svg={cat.artworkSVG(a.id)} wild={ui.wishlistHas(a.id)} onWish={() => ui.toggleWish(a.id)} />)}
          </div>
          <div className="load-more-wrap reveal">
            <Link className="btn btn-royal magnetic" to="/gallery">Enter the Full Gallery <Svg d={ICONS.arrow} /></Link>
          </div>
        </div>
      </section>

      {/* -------- NEW ARRIVALS -------- */}
      <section className="sec" aria-labelledby="new-h">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center reveal">Straight from the Studio</span>
            <h2 className="display-l reveal" id="new-h" style={{ '--d': '.1s' }}>New <span className="grad-gold serif-it">Arrivals</span></h2>
            <p className="lede reveal" style={{ '--d': '.2s' }}>The newest creations, ready to carry — fresh from a morning of intention.</p>
          </div>
          <div className="shop-grid stagger" id="newGrid">
            {newestProds.map(p => {
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
                    <Link className="nm" to={'/product/' + p.id}>{p.name || ((art ? art.title : '') + ' ' + p.type)}</Link>
                    <div className="pc-row">
                      <span className="pc-price">{money(p.price)}</span>
                      <button className="btn btn-gold btn-sm" data-addq={p.id}>Add — {money(p.price)}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="load-more-wrap reveal">
            <Link className="btn btn-gold magnetic" to="/shop">Browse Everything in the Shop <Svg d={ICONS.arrow} /></Link>
          </div>
        </div>
      </section>

      {/* -------- CREATE / SHARE / INSPIRE -------- */}
      <section className="sec" aria-labelledby="flow-h">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center reveal">How the Magic Works</span>
            <h2 className="display-l reveal" id="flow-h" style={{ '--d': '.1s' }}>Create. <span className="grad-gold serif-it">Share.</span> Inspire.</h2>
            <p className="lede reveal" style={{ '--d': '.2s' }}>Every day, a new Mandala is born — and within hours it can be on your wall, your shelf, or your favourite hoodie.</p>
          </div>
          <div className="steps stagger">
            <div className="tile wstep reveal" style={{ gridColumn: '1/2' }}>
              <div className="icon"><Svg d={ICONS.brush} /></div>
              <div className="num">01 — CREATE</div><h3>A New Mandala</h3>
              <p>Orchid begins each day by drawing a new Mandala — a quiet ritual that turns intention into art.</p>
            </div>
            <div className="steps-arrow reveal" style={{ gridColumn: '2/3' }} aria-hidden="true"><Svg d={ICONS.arrow} /></div>
            <div className="tile wstep reveal">
              <div className="icon"><Svg d={ICONS.cart} /></div>
              <div className="num">02 — SHOP</div><h3>The Art Goes Live</h3>
              <p>The artwork becomes available on selected products — prints, apparel, decor and more — within the same day.</p>
            </div>
            <div className="steps-arrow reveal" aria-hidden="true"><Svg d={ICONS.arrow} /></div>
            <div className="tile wstep reveal">
              <div className="icon"><Svg d={ICONS.ig} /></div>
              <div className="num">03 — SHARE</div><h3>The World Sees It</h3>
              <p>Orchid shares the artwork on social media, and anyone who sees it can shop it immediately — no hunting required.</p>
            </div>
          </div>
          <div className="center reveal" style={{ marginTop: 44 }}>
            <Link className="btn btn-gold magnetic" to="/daily">Explore Today's Creation</Link>
          </div>
        </div>
      </section>

      {/* -------- COLLECTIONS -------- */}
      <section className="sec" aria-labelledby="coll-h">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center reveal">Curated Worlds</span>
            <h2 className="display-l reveal" id="coll-h" style={{ '--d': '.1s' }}>Explore the <span className="grad-gold serif-it">Collections</span></h2>
            <p className="lede reveal" style={{ '--d': '.2s' }}>Curated worlds woven from twenty-seven years of daily practice.</p>
          </div>
          <div className="col-grid stagger" id="collGrid">
            {cat.collections.map(c => {
              const cover = cat.findArt(c.artId);
              return (
                <Link key={c.id} className="col-card" to={'/collections#coll-' + c.id} data-tilt data-gold>
                  <div className="col-media" style={{ background: `linear-gradient(160deg, ${c.pal[0]}22, ${c.pal[1]}44)` }}>
                    {cover && <div className="coll-art" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(c.artId) }} />}
                    <span className="col-count">{c.members.length} pieces</span>
                  </div>
                  <div className="col-body"><h3>{c.name}</h3><span className="link-arrow">Explore <Svg d={ICONS.arrow} /></span></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------- MEET ORCHID -------- */}
      <section className="sec sec-tight" aria-labelledby="story-h">
        <div className="wrap">
          <div className="meet-grid">
            <div className="story-figure reveal-l">
              <div className="art-frame" data-tilt data-gold data-glare><div id="heroArt" dangerouslySetInnerHTML={{ __html: dailyArtId ? cat.artworkSVG(dailyArtId) : '' }} /></div>
              <div className="story-fig-caption">A Mandala for every morning · 1999 — today</div>
            </div>
            <div className="reveal-r meet-mid">
              <span className="eyebrow">The Artist</span>
              <h2 className="display-l" id="story-h" style={{ margin: '16px 0 20px' }}>Meet <span className="grad-gold serif-it">Orchid Mandala</span></h2>
              <p className="lede">Every morning, Orchid creates a new Mandala as a way of setting an intention for the day. What began as a personal creative practice has grown into a remarkable collection of artwork spanning decades.</p>
              <p className="lede" style={{ marginTop: 14 }}>His art drifts between sacred geometry and dreamlike worlds — always rooted in a single, honest feeling.</p>
              <div className="story-points">
                {['Mandalas', 'Digital Landscapes', 'Abstract Creations', 'Inspirational Designs'].map(c => <span key={c} className="chip">{c}</span>)}
              </div>
              <div className="story-cta-row">
                <Link className="btn btn-gold magnetic" to="/about">Discover Orchid's Story →</Link>
                <span className="siggr" aria-hidden="true">Orchid</span>
              </div>
            </div>
            <div className="meet-right reveal-r" style={{ '--d': '.15s' }}>
              <div className="meet-medallion" aria-hidden="true"></div>
              <div className="art-frame meet-frame"><div className="meet-art" dangerouslySetInnerHTML={{ __html: (byDate[1] && byDate[1].id) ? cat.artworkSVG(byDate[1].id) : '' }} /></div>
              <div className="meet-note"><span className="meet-num">27+</span><span className="meet-yrs">YEARS OF<br />DAILY CREATION</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* -------- QUOTE -------- */}
      <section className="sec quote-sec" aria-labelledby="quote-h">
        <div className="quote-ring" aria-hidden="true"></div>
        <div className="wrap-narrow">
          <blockquote className="quote-block reveal-zoom" id="quote-h">
            <span className="quote-mark serif-it" aria-hidden="true">“</span>
            <p className="quote-text">{QUOTE.t}</p>
            <cite>{QUOTE.c}</cite>
            <span className="quote-sub">{QUOTE.s}</span>
          </blockquote>
        </div>
      </section>

      {/* -------- EVERY MANDALA HAS AN INTENTION -------- */}
      <section className="sec" aria-labelledby="story2-h">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center reveal">Behind the Art</span>
            <h2 className="display-l reveal" id="story2-h" style={{ '--d': '.1s' }}>Every Mandala Has an <span className="grad-gold serif-it">Intention</span></h2>
            <p className="lede reveal" style={{ '--d': '.2s' }}>Each piece begins as a feeling, a prayer, or a single honest word — and carries it forever.</p>
          </div>
          <div className="grid-3 stagger" id="storyGrid">
            {storyArts.map(a => (
              <div key={a.id} className="story-card reveal">
                <button className="story-media" data-view={a.id} aria-label={'View ' + a.title}>
                  <div className="art-frame" data-tilt><div className="story-art" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(a.id) }} /></div>
                </button>
                <div className="story-body">
                  <span className="story-when">{a.date || a.cat}</span>
                  <h3>{a.title}</h3>
                  {a.intention && <p className="story-int">“{a.intention}”</p>}
                  <span className="link-arrow"><button data-view={a.id} aria-label={'View ' + a.title}>View Artwork <Svg d={ICONS.arrow} /></button></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- FEATURED COLLECTION STRIP -------- */}
      <section className="sec sec-tight" aria-labelledby="feat-h">
        <div className="wrap">
          <div className="intro-head" style={{ marginBottom: 20 }}>
            <span className="eyebrow center reveal">Featured Collection</span>
            <h2 className="display-l reveal" id="feat-h" style={{ '--d': '.1s' }}>Framed in Luxury</h2>
            <p className="lede reveal" style={{ '--d': '.2s' }}>Five signature pieces, hung as they would be in a fine gallery.</p>
          </div>
          <div className="strip" id="featStrip" tabIndex="0" aria-label="Featured artworks, scrollable">
            {stripArts.map(aid => {
              const a = cat.findArt(aid);
              if (!a) return null;
              return (
                <button key={aid} className="strip-card" data-view={aid} aria-label={'View ' + a.title}>
                  <div className="art-frame" data-tilt><div className="strip-art" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(aid) }} /></div>
                  <div className="strip-cap"><strong>{a.title}</strong><span>{a.date || ''}</span></div>
                </button>
              );
            })}
          </div>
          <div className="center reveal" style={{ marginTop: 16 }}>
            {featuredColl && <Link className="link-arrow" to={'/collections#coll-' + featuredColl.id}>Explore Collection <Svg d={ICONS.arrow} /></Link>}
          </div>
        </div>
      </section>

      {/* -------- LOVE THIS DESIGN -------- */}
      <section className="sec sec-tight" aria-labelledby="love-h">
        <div className="wrap">
          <div className="love-block reveal-zoom">
            <div>
              <span className="eyebrow">Artwork → Product</span>
              <h3 id="love-h">Love This Design?</h3>
              <p className="lede" style={{ margin: '14px 0 8px' }}>Every Mandala can be carried into your everyday life. The same artwork, beautifully translated onto the objects you love.</p>
              <p className="daily-note" style={{ color: 'var(--faint)', fontSize: '.8rem' }}>Available on:</p>
              <div className="products-avail" id="loveAvail">{PRODUCT_TYPES.map(t => <span key={t} className="chip avail-line"><span className="dot"></span>{t}</span>)}</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 26 }}>
                <Link className="btn btn-gold" to={'/shop?art=' + loveId} id="loveShopLink">Shop This Artwork</Link>
                <Link className="btn btn-ghost" to="/gallery">More Artwork</Link>
              </div>
            </div>
            <div className="art-frame" data-tilt style={{ maxWidth: 420, marginInline: 'auto', width: '100%' }}>
              <div id="loveArt" dangerouslySetInnerHTML={{ __html: loveId ? cat.artworkSVG(loveId) : '' }} />
            </div>
          </div>
        </div>
      </section>

      {/* -------- TESTIMONIALS -------- */}
      <section className="sec" aria-labelledby="tes-h">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center reveal">Kind Words</span>
            <h2 className="display-l reveal" id="tes-h" style={{ '--d': '.1s' }}>Words From the <span className="grad-gold serif-it">Community</span></h2>
            <p className="lede reveal" style={{ '--d': '.2s' }}>A note from those who live with the art.</p>
          </div>
          <div className="tes-grid">
            {TESTIMONIALS.map(t => (
              <figure key={t.name} className="tes-card reveal">
                <span className="tes-mark" async dangerouslySetInnerHTML={{ __html: quoteSVG }} />
                <blockquote><p>{t.text}</p></blockquote>
                <figcaption><strong>{t.name}</strong><span>{t.where}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* -------- NEWSLETTER -------- */}
      <section className="sec sec-tight" aria-labelledby="news-h">
        <div className="wrap-narrow">
          <div className="glass news-card reveal-zoom">
            <h2 className="display-m" id="news-h">Receive a Little <span className="grad-gold serif-it">Magic</span> Every Day</h2>
            <p className="lede" style={{ margin: '14px auto 0' }}>Discover new Mandalas, artwork, collections and special releases from Orchid.</p>
            <form className="form-news" data-news onSubmit={submitNews}>
              <label className="visually-hidden" htmlFor="newsEmail">Email address</label>
              <input className="input" id="newsEmail" type="email" required placeholder="Your email address" autoComplete="email" />
              <button className="btn btn-gold magnetic" type="submit">Join The Magic</button>
            </form>
          </div>
        </div>
      </section>

      {/* -------- SOCIAL -------- */}
      <section className="sec sec-tight" aria-labelledby="soc-h">
        <div className="wrap">
          <div className="intro-head">
            <span className="eyebrow center reveal">Daily on Instagram</span>
            <h2 className="display-l reveal" id="soc-h" style={{ '--d': '.1s' }}>Follow the <span className="grad-gold serif-it">Daily Magic</span></h2>
            <p className="lede reveal" style={{ '--d': '.2s' }}>A new Mandala, every single morning — straight to your feed.</p>
          </div>
          <div className="soc-grid">
            {socArts.map(a => (
              <button key={a.id} className="soc-tile" data-view={a.id} aria-label={'View ' + a.title}>
                <span className="soc-art" dangerouslySetInnerHTML={{ __html: cat.artworkSVG(a.id) }} />
                <span className="soc-hover"><Svg d={ICONS.ig} /><small>{a.title}</small></span>
              </button>
            ))}
          </div>
          <div className="center reveal" style={{ marginTop: 36 }}>
            <a className="btn btn-royal magnetic" href="https://instagram.com" target="_blank" rel="noopener"><Svg d={ICONS.ig} /> Follow the Journey</a>
          </div>
        </div>
      </section>
    </>
  );
}

function ArtTeaser({ a, svg, wild, onWish }) {
  const cat = useCatalog();
  const avail = cat.products.filter(p => p.artId === a.id);
  return (
    <div className="pcard reveal">
      <button className="pcard-media" data-view={a.id} aria-label={'View ' + (a.title || a.id)}>
        <div className="pcard-art" dangerouslySetInnerHTML={{ __html: svg }} />
        <span className="pcard-flag">{a.cat}</span>
      </button>
      <div className="pcard-info">
        <h4 className="replace-none">{a.title || 'Untitled'}</h4>
        <span className="pcard-date">{a.date || ''}</span>
        <span className="pcard-int">{a.intention || ''}</span>
        <div className="pcard-ft">
          <button className={'pcard-wish-btn' + (wild ? ' on' : '')} data-wish={a.id} aria-label="Toggle wishlist"><Svg d={wild ? ICONS.heartFill : ICONS.heart} /></button>
          <button className="btn btn-gold btn-sm pcard-shop" data-shopart={a.id}>Shop <Svg d={ICONS.arrow} /></button>
        </div>
      </div>
      {avail.length > 0 && <span className="pcard-types">{avail.map(x => x.type).join(' · ')}</span>}
    </div>
  );
}