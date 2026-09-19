import React from 'react';
import { Link } from 'react-router-dom';
import { useCatalog, money } from '../context';
import { lastOrderRead } from '../lib/store';

export default function OrderPage() {
  const cat = useCatalog();
  const order = lastOrderRead();

  const lines = order && order.lines ? order.lines : [];
  const total = order ? order.total : 0;

  return (
    <section className="sec" style={{ paddingTop: 'calc(var(--nav-h) + 40px)' }} aria-label="Order confirmation">
      <div className="wrap-narrow">
        <div className="ord-wrap" id="orderWrap">
          <div className="ord-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.8 2.8L16.5 9" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span className="eyebrow center">Order Confirmed</span>
          <h1 className="display-l">Thank you for carrying a little <span className="grad-gold serif-it">magic</span> home</h1>
          <p className="ord-number">Order #<span id="ordNum">{order && order.id ? order.id : '—'}</span></p>
          <p className="lede">A confirmation email is on its way. Your artwork is being prepared with intention and will be on its way to you soon.</p>

          {lines.length > 0 && (
            <div className="glass" style={{ width: '100%', maxWidth: 560, padding: 'clamp(24px,3vw,36px)', textAlign: 'left' }} id="ordLines">
              {lines.map((l, i) => {
                const p = cat.findProduct(l.pid);
                const art = p ? cat.findArt(p.artId) : null;
                const name = p ? (p.name || (art ? art.title + ' ' + p.type : p.type)) : l.pid;
                return (
                  <div key={l.key || i} className="ord-line">
                    <span className="ord-qty">×{l.qty}</span>
                    <span className="ord-name">{name}{l.size ? <small> · {l.size}</small> : ''}</span>
                    <span className="ord-line-price">{money((p ? p.price : 0) * l.qty)}</span>
                  </div>
                );
              })}
              <div className="ord-total"><span>Total</span><span>{money(total)}</span></div>
            </div>
          )}

          {!order && (
            <div className="glass" style={{ width: '100%', maxWidth: 560, padding: 'clamp(24px,3vw,36px)', textAlign: 'left' }}>
              <p className="lede" style={{ margin: 0 }}>No recent order found here — but the gallery is always open when you're ready to bring a little magic home.</p>
            </div>
          )}

          <div className="pd-trust" style={{ width: '100%', maxWidth: 560, margin: 0 }}>
            <div className="row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3.5 6.5l8.5 6 8.5-6" strokeLinecap="round" /></svg>
              <span><b>What happens next?</b> You'll receive a receipt now, a print confirmation within 1–2 days, and a tracking link the moment your order ships.</span>
            </div>
            <div className="row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z" strokeLinejoin="round" /><path d="M5 19c2-5 5-8 10-11" strokeLinecap="round" /></svg>
              <span><b>Made to order.</b> Printed & fulfilled through our trusted print-on-demand partner.</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
            <Link className="btn btn-gold magnetic" to="/shop">Continue Shopping</Link>
            <Link className="btn btn-ghost" to="/gallery">Explore New Artwork</Link>
          </div>
        </div>
      </div>
    </section>
  );
}