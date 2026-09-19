import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="sec" style={{ paddingTop: 'calc(var(--nav-h) + 60px)' }} aria-label="Page not found">
      <div className="wrap center" style={{ padding: '60px 0' }}>
        <div className="hero-orb gold" style={{ position: 'relative', display: 'inline-block' }}></div>
        <span className="eyebrow center" style={{ marginTop: 24 }}>404 — Lost in the Stars</span>
        <h1 className="display-l" style={{ margin: '12px 0 18px' }}>This page drifted <span className="grad-gold serif-it">off the map</span></h1>
        <p className="lede" style={{ margin: '0 auto 30px', maxWidth: '46ch' }}>The artwork you're looking for has wandered into another gallery — but there's plenty of magic left to find.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="btn btn-gold magnetic" to="/">Back to Home</Link>
          <Link className="btn btn-royal magnetic" to="/gallery">Enter the Gallery</Link>
        </div>
      </div>
    </section>
  );
}