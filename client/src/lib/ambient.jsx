/* Ambient effects + motion — faithful port of assets/js/app.js non-catalog behaviour. */
import React from 'react';

export const $ = (s, c) => (c || document).querySelector(s);
export const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

function initParticles() {
  try {
    const cv = $('#bgParticles');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let W, H, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const palettesFor = th => th === 'dark'
      ? [['155, 93, 229', 0.5], ['212, 175, 55', 0.4], ['46, 196, 182', 0.35], ['241, 91, 181', 0.3], ['247, 230, 181', 0.5]]
      : [['122, 63, 242', 0.2], ['212, 175, 55', 0.32], ['46, 196, 182', 0.22], ['241, 91, 181', 0.14], ['165, 124, 46', 0.26]];
    let PALETTES = palettesFor(document.documentElement.dataset.theme);
    window.__MMrelight = function () {
      try { PALETTES = palettesFor(document.documentElement.dataset.theme); if (typeof seed === 'function') seed(); } catch (e) {}
    };
    let parts = [];
    let orbs = [];
    let cxp = -400, cyp = -400;
    try { window.addEventListener('mousemove', e => { cxp = e.clientX; cyp = e.clientY; }, { passive: true }); } catch (e) {}

    function size() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      const n = Math.max(34, Math.min(96, Math.round(W * H / 21000)));
      parts = Array.from({ length: n }, () => {
        const near = Math.random() < 0.34;
        return {
          x: Math.random() * W, y: Math.random() * H,
          r: near ? 1.1 + Math.random() * 2.1 : 0.5 + Math.random() * 1.2,
          vx: (Math.random() - 0.5) * (near ? 0.5 : 0.22), vy: (Math.random() - 0.5) * (near ? 0.5 : 0.22) - (near ? 0.1 : 0.04),
          c: PALETTES[Math.floor(Math.random() * PALETTES.length)],
          tw: Math.random() * Math.PI * 2, tws: (near ? 0.02 : 0.008) + Math.random() * 0.02,
          near, base: near ? 0.35 : 0.3
        };
      });
      orbs = Array.from({ length: 3 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 120 + Math.random() * 200,
        c: PALETTES[Math.floor(Math.random() * 3)][0],
        o: 0.05 + Math.random() * 0.05,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r) o.x = W + o.r; if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r; if (o.y > H + o.r) o.y = -o.r;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.c}, ${o.o})`);
        g.addColorStop(1, `rgba(${o.c}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const p of parts) {
        const dxp = p.x - cxp, dyp = p.y - cyp;
        const d2 = dxp * dxp + dyp * dyp;
        const radius = 140;
        if (p.near && d2 < radius * radius) {
          const d = Math.sqrt(d2) || 1;
          p.x += (dxp / d) * 1.6;
          p.y += (dyp / d) * 1.6;
        }
        p.x += p.vx; p.y += p.vy;
        p.tw += p.tws;
        if (p.x < -4) p.x = W + 4; if (p.x > W + 4) p.x = -4;
        if (p.y < -4) p.y = H + 4; if (p.y > H + 4) p.y = -4;
        const a = (p.base + 0.5 * (0.5 + 0.5 * Math.sin(p.tw))) * +p.c[1];
        ctx.fillStyle = `rgba(${p.c[0]}, ${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    size(); seed(); tick();
    window.addEventListener('resize', () => { size(); seed(); });
  } catch (err) { /* decorative */ }
}

function initCursorGlow() {
  const el = $('#cursorGlow');
  if (!el || window.matchMedia('(hover: none)').matches) return;
  let tx = innerWidth / 2, ty = innerHeight / 3, x = tx, y = ty;
  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function anim() {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08;
    el.style.transform = `translate3d(${x - 280}px, ${y - 280}px, 0)`;
    requestAnimationFrame(anim);
  })();
}

function initCursorFX() {
  const ring = $('#cursorRing'), dot = $('#cursorDot');
  if (!ring || !dot || window.matchMedia('(hover: none)').matches) return;
  let tx = innerWidth / 2, ty = innerHeight / 3;
  let rx = tx, ry = ty, dx = tx, dy = ty;
  const HOVER = 'a[href], button, [data-tilt], .magnetic, .chip, input, select, textarea, .daily-prev, .avail-line';
  let hovered = false;
  document.addEventListener('mouseover', e => {
    const h = !!(e.target instanceof Element && e.target.closest && e.target.closest(HOVER));
    ring.classList.toggle('is-hover', h);
    hovered = h;
  });
  document.addEventListener('mouseout', e => {
    if (!hovered) return;
    if (e.target instanceof Element && e.target.closest && e.target.closest(HOVER)) {
      ring.classList.remove('is-hover');
      hovered = false;
    }
  });
  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function anim() {
    rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16;
    dx += (tx - dx) * 0.5; dy += (ty - dy) * 0.5;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(anim);
  })();
  const leave = () => ring.classList.add('is-hidden');
  const enter = () => ring.classList.remove('is-hidden');
  document.addEventListener('mouseleave', leave);
  document.addEventListener('mouseenter', enter);
}

export function initReveal() {
  const els = $$('.reveal, .reveal-l, .reveal-r, .reveal-zoom, .stagger, .cnt-reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(ent => {
      if (ent.isIntersecting) { ent.target.classList.add('in'); io.unobserve(ent.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
}

function initTilt() {
  if (window.matchMedia('(hover: none)').matches) return;
  $$('[data-tilt], .tilt').forEach(el => {
    let raf;
    const reset = () => {
      el.style.transform = '';
      el.style.boxShadow = '';
      el.style.setProperty('--go', '0');
      el.style.setProperty('--gx', '50%');
      el.style.setProperty('--gy', '50%');
    };
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - 0.5;
      const my = (e.clientY - r.top) / r.height - 0.5;
      const px = ((e.clientX - r.left) / r.width) * 100;
      const py = ((e.clientY - r.top) / r.height) * 100;
      el.style.transition = 'transform 0.1s ease';
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${(-my * 7).toFixed(2)}deg) rotateY(${(mx * 7).toFixed(2)}deg) translateY(-4px)`;
        if (el.dataset.gold) el.style.boxShadow = `0 ${26 + Math.abs(mx * my) * 60}px 80px -30px rgba(0,0,0,0.85), 0 0 ${20 + Math.abs(mx) * 40}px ${Math.abs(my) * 20}px rgba(212,175,55,0.3)`;
        if (el.dataset.glare) {
          el.style.setProperty('--gx', px + '%');
          el.style.setProperty('--gy', py + '%');
          el.style.setProperty('--go', '1');
        }
      });
    });
    el.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.transition = 'transform 0.6s cubic-bezier(0.22, 0.9, 0.28, 1), box-shadow 0.6s ease';
      reset();
    });
  });
}

function initMagnetic() {
  if (window.matchMedia('(hover: none)').matches) return;
  $$('.magnetic').forEach(el => {
    el.addEventListener('mouseenter', () => { el.classList.add('is-pulled'); });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.32;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.32;
      el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
    });
    el.addEventListener('mouseleave', () => {
      el.classList.remove('is-pulled');
      el.style.transform = '';
    });
  });
}

function initMouseParallax() {
  if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = $$('[data-mp]');
  if (!els.length) return;
  let tx = 0, ty = 0, x = 0, y = 0;
  window.addEventListener('mousemove', e => {
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });
  (function anim() {
    x += (tx - x) * 0.06; y += (ty - y) * 0.06;
    for (const el of els) {
      const depth = parseFloat(el.dataset.mp) || 12;
      el.style.translate = `${(-x * depth).toFixed(1)}px ${(-y * depth).toFixed(1)}px`;
    }
    requestAnimationFrame(anim);
  })();
}

function initToTop() {
  const b = $('#toTop');
  if (!b) return;
  const onScroll = () => b.classList.toggle('show', window.scrollY > 700);
  window.addEventListener('scroll', onScroll, { passive: true });
  b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initScrollMotion() {
  const bar = $('#scrollProgress i');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paras = reduced ? [] :
    ['.hero-art-wrap', '.story-figure', '.daily-art', '.page-bg-orb', '.hero-orb', '.collection-large', '.pd-media', '.mood-strip']
      .flatMap(s => $$(s, document))
      .filter(el => el.dataset.para !== '0')
      .map(el => ({ el, s: parseFloat(el.dataset.para) || -0.14 }));
  const zoomEl = reduced ? null : $('#heroArt');
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = window.innerHeight;
    if (bar) {
      const m = document.documentElement;
      const h = m.scrollHeight - vh;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }
    for (const p of paras) {
      const r = p.el.getBoundingClientRect();
      if (r.bottom < -140 || r.top > vh + 140) { if (p.el.style.translate) p.el.style.translate = ''; continue; }
      const y = (r.top + r.height / 2 - vh / 2) * p.s;
      p.el.style.translate = y ? `0 ${y.toFixed(1)}px` : '0 0px';
    }
    if (zoomEl) {
      const r = zoomEl.getBoundingClientRect();
      const c = r.top + r.height / 2 - vh / 2;
      const k = Math.max(0, 1 - Math.abs(c) / (vh * 0.9));
      zoomEl.style.scale = (1 + (1 - k) * 0.14).toFixed(4);
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  if (bar || paras.length || zoomEl) {
    frame();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }
}

function initCounters() {
  const els = $$('.m-num');
  if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('counted'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(ent => {
      if (!ent.isIntersecting) return;
      const el = ent.target;
      io.unobserve(el);
      const m = (el.textContent || '').match(/^([\d.]+)([+\-%]*)$/);
      if (!m) { el.classList.add('counted'); return; }
      const target = parseFloat(m[1]);
      const suf = m[2];
      const t0 = performance.now();
      const dur = 1400;
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        el.textContent = val + suf;
        if (p < 1) requestAnimationFrame(step); else el.classList.add('counted');
      })(t0);
    });
  }, { threshold: 0.5 });
  els.forEach(el => io.observe(el));
}

function initNavScroll() {
  const nav = $('#nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* Body-level chrome that only needs creating once + one-shot effects. */
export function useAmbient() {
  React.useEffect(() => {
    try { initParticles(); } catch (e) {}
    try { initCursorGlow(); } catch (e) {}
    try { initCursorFX(); } catch (e) {}
    try { initMouseParallax(); } catch (e) {}
    try { initTilt(); } catch (e) {}
    try { initMagnetic(); } catch (e) {}
    try { initToTop(); } catch (e) {}
    try { initScrollMotion(); } catch (e) {}
    try { initCounters(); } catch (e) {}
    try { initNavScroll(); } catch (e) {}
  }, []);
}

/* Re-run on route change so newly rendered nodes animate. */
export function useRouteAmbient(pathname) {
  React.useEffect(() => {
    try { initReveal(); } catch (e) {}
    try { initCounters(); } catch (e) {}
    try { initTilt(); } catch (e) {}
    try { initMagnetic(); } catch (e) {}
    const t = setTimeout(() => { try { initScrollMotion(); } catch (e) {} }, 60);
    return () => clearTimeout(t);
  }, [pathname]);
}