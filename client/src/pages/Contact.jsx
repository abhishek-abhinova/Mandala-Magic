import React, { useState } from 'react';
import { useUi, Svg, ICONS } from '../context';
import { fetchSession } from '../lib/api';

const SUBJECTS = ['General question', 'Order help', 'Wholesale / collaboration', 'Commission a mandala', 'Just saying hello'];

const INFO = [
  { icon: ICONS.mail, b: 'Email the Studio', p: 'hello@mandalamagicbyom.com\nGeneral enquiries & support' },
  { icon: ICONS.palette, b: 'Wholesale & Collabs', p: 'orchid@mandalamagicbyom.com\nRetail, licensing & collaborations' },
  { icon: ICONS.brush, b: 'Commissions', p: 'A personal mandala or landscape, drawn with intention for you.' },
  { icon: ICONS.ig, b: 'Daily on Instagram', p: '@mandalamagicbyom — a new artwork every morning.' }
];

export default function ContactPage() {
  const ui = useUi();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus('');
    const fd = new FormData(e.currentTarget);
    try {
      const csrf = await fetchSession();
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.token ? `${csrf.token}::${csrf.user || 'guest'}` : (csrf.csrf_token || '') },
        body: JSON.stringify({
          name: fd.get('cName'),
          email: fd.get('cEmail'),
          subject: fd.get('cSubject'),
          message: fd.get('cMsg')
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus((data.message || data.error || 'Something didn\'t reach the studio — please try again.').toString());
      } else {
        setStatus('Thank you — your note is with Orchid ✦');
        e.currentTarget.reset();
      }
    } catch (err) {
      setStatus('Something didn\'t reach the studio — please try again.');
    }
    setBusy(false);
  };

  return (
    <>
      <header className="page-hero">
        <div className="wrap">
          <span className="eyebrow center reveal">Connect</span>
          <h1 className="display-xl reveal" style={{ '--d': '.1s' }}>Say <span className="grad-gold serif-it">Hello</span></h1>
          <p className="lede reveal" style={{ '--d': '.2s' }}>Questions, collaborations, or just sharing how a mandala found you.</p>
        </div>
      </header>

      <section className="sec sec-tight" style={{ paddingTop: 6 }} aria-label="Contact">
        <div className="wrap">
          <div className="cont-grid">
            <div className="cont-info stagger">
              <div className="glass" style={{ padding: 'clamp(24px,3vw,36px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {INFO.map(row => (
                  <div key={row.b} className="cont-row">
                    <div className="ic"><Svg d={row.icon} /></div>
                    <div><b>{row.b}</b><p>{row.p.split('\n').map((l, i) => <React.Fragment key={i}>{l}<br /></React.Fragment>)}</p></div>
                  </div>
                ))}
              </div>
              <p className="daily-note" style={{ fontSize: '.84rem' }}>Orchid reads every message. A response usually arrives within a day or two.</p>
            </div>

            <form className="glass" id="contactForm" style={{ padding: 'clamp(26px,3vw,38px)', display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={submit}>
              <div className="eyebrow">Send a Message</div>
              <div className="form-2col">
                <div className="field">
                  <label htmlFor="cName">Your name</label>
                  <input id="cName" name="cName" type="text" required placeholder="A beautiful soul" autoComplete="name" />
                </div>
                <div className="field">
                  <label htmlFor="cEmail">Email address</label>
                  <input id="cEmail" name="cEmail" type="email" required placeholder="you@example.com" autoComplete="email" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="cSubject">Subject</label>
                <select id="cSubject" name="cSubject" defaultValue="General question">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="cMsg">Your message</label>
                <textarea id="cMsg" name="cMsg" rows="6" required placeholder="Tell Orchid what's on your heart…" style={{ padding: '15px 18px', borderRadius: 14, border: '1px solid var(--stroke-soft)', background: 'rgba(10,6,24,.65)', color: 'var(--white)', fontSize: '.95rem', resize: 'vertical', fontFamily: 'inherit' }}></textarea>
              </div>
              <button className="btn btn-gold magnetic" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send Message'}</button>
              {status && <p className="daily-note" style={{ textAlign: 'center', fontSize: '.82rem', color: 'var(--gold-pale)', margin: 0 }}>{status}</p>}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}