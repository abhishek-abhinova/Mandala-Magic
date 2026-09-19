import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalog, useCart, Svg, ICONS, money } from '../context';
import { lastOrderWrite } from '../lib/store';

const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France', 'Everywhere else'];

export default function CheckoutPage() {
  const cat = useCatalog();
  const cart = useCart();
  const nav = useNavigate();

  const subtitle = cart.subtotal;
  const shipping = cart.subtotal === 0 || cart.subtotal >= 75 ? 0 : cart.shipping;

  const placeOrder = e => {
    e.preventDefault();
    if (!cart.cart.length) {
      cart.openCart();
      return;
    }
    const fd = new FormData(e.currentTarget);
    const id = 'MM-' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 90 + 10);
    const lines = cart.cart.map(i => ({ key: i.key, pid: i.pid, qty: i.qty, size: i.size, color: i.color }));
    lastOrderWrite({ id, lines, total: subtitle + shipping });

    /* Future: POST /api/store/orders with session CSRF token. For now the studio
       confirms checkout manually (no payment gateway credentials configured). */
    cart.clear();
    cart.closeCart();
    nav('/order');
  };

  return (
    <>
      <header className="page-hero">
        <div className="wrap">
          <span className="eyebrow center">Secure Checkout</span>
          <h1 className="display-xl reveal" style={{ '--d': '.1s' }}>Almost <span className="grad-gold serif-it">Yours</span></h1>
          <p className="lede reveal" style={{ '--d': '.2s' }}>Simple, distraction-free, and as calm as the art itself.</p>
        </div>
      </header>

      <section className="sec sec-tight" style={{ paddingTop: 6 }} aria-label="Checkout">
        <div className="wrap">
          <div className="co-grid">
            <form id="checkoutForm" className="co-card glass" style={{ gap: 28 }} onSubmit={placeOrder}>
              <div>
                <div className="step-num">01 — Contact</div>
                <div style={{ height: 14 }}></div>
                <div className="field">
                  <label htmlFor="ceMail">Email address</label>
                  <input id="ceMail" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
                </div>
              </div>
              <div>
                <div className="step-num">02 — Shipping</div>
                <div style={{ height: 14 }}></div>
                <div className="form-2col">
                  <div className="field">
                    <label htmlFor="cfName">First name</label>
                    <input id="cfName" name="fname" type="text" required placeholder="First name" autoComplete="given-name" />
                  </div>
                  <div className="field">
                    <label htmlFor="clName">Last name</label>
                    <input id="clName" name="lname" type="text" required placeholder="Last name" autoComplete="family-name" />
                  </div>
                </div>
                <div className="field" style={{ marginTop: 16 }}>
                  <label htmlFor="cAddr">Address</label>
                  <input id="cAddr" name="addr" type="text" required placeholder="Street & number" autoComplete="street-address" />
                </div>
                <div className="form-2col" style={{ marginTop: 16 }}>
                  <div className="field">
                    <label htmlFor="cCity">City</label>
                    <input id="cCity" name="city" type="text" required placeholder="City" autoComplete="address-level2" />
                  </div>
                  <div className="field">
                    <label htmlFor="cZip">Postal code</label>
                    <input id="cZip" name="zip" type="text" required placeholder="Postal code" autoComplete="postal-code" />
                  </div>
                </div>
                <div className="form-2col" style={{ marginTop: 16 }}>
                  <div className="field">
                    <label htmlFor="cCountry">Country</label>
                    <select id="cCountry" name="country" defaultValue="United States">
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="cPhone">Phone (optional)</label>
                    <input id="cPhone" name="phone" type="tel" placeholder="+1 555 000 0000" autoComplete="tel" />
                  </div>
                </div>
              </div>
              <div>
                <div className="step-num">03 — Payment</div>
                <div style={{ height: 14 }}></div>
                <div className="pay-hint">
                  <div className="pay-hint-key"><Svg d={ICONS.lock} /></div>
                  <div>
                    <b>Studio-managed payment</b>
                    <p>Your order is placed securely with the Mandala Magic studio. We confirm your payment and print-on-demand fulfillment personally — no card details are collected on this website, and nothing is ever stored.</p>
                    <p className="sm">You'll receive an order confirmation email, followed by a personal note from the studio to arrange payment and shipping. Live card payments become available the moment Orchid activates his payment provider.</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="step-num">04 — Review & Place</div>
                <div style={{ height: 14 }}></div>
                <div className="secure-badge"><Svg d={ICONS.lock} /> Secured studio checkout</div>
                <div style={{ marginTop: 20 }}>
                  <button className="btn btn-gold btn-block" type="submit">Place Order & Complete</button>
                </div>
                <p className="daily-note" style={{ fontSize: '.78rem', textAlign: 'center', marginTop: 14 }}>A studio member confirms every order personally.</p>
              </div>
            </form>

            <aside className="co-summary-card glass co-card" id="coSummary" aria-label="Order summary">
              <h2>Order Summary</h2>
              <div id="coLines">
                {cart.cart.length === 0 && <p className="daily-note" style={{ fontSize: '.82rem' }}>Your bag is empty — add a little magic first.</p>}
                {cart.cart.map(item => {
                  const p = cat.findProduct(item.pid);
                  const art = p ? cat.findArt(p.artId) : null;
                  const name = p ? (p.name || (art ? art.title + ' ' + p.type : p.type)) : item.pid;
                  return (
                    <div key={item.key} className="co-line">
                      <span className="co-line-qty">×{item.qty}</span>
                      <span className="co-line-name">{name}{item.size ? <small> · {item.size}</small> : ''}</span>
                      <span className="co-line-price">{money((p ? p.price : 0) * item.qty)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="co-total">
                <div className="r"><span>Subtotal</span><span id="coSub">{money(cart.subtotal)}</span></div>
                <div className="r"><span>Shipping</span><span id="coShip">{cart.subtotal && cart.subtotal >= 75 ? 'Free' : shipping ? money(shipping) : 'Free'}</span></div>
                <div className="r"><span>Estimated tax</span><span id="coTax">Computed at checkout</span></div>
                <div className="r grand"><span>Total</span><span className="amnt" id="coTotal">{money(cart.subtotal + shipping)}</span></div>
              </div>
              <p className="daily-note" style={{ fontSize: '.76rem' }}>Made to order · Printed & fulfilled through our trusted print-on-demand partner · Free shipping over $75</p>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}