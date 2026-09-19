import React from 'react';

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const money = n => '$' + Number(n).toFixed(2);

/* Renders a raw innerHTML string (inline SVG snippets) safely. */
export function Svg({ d, className, width, height }) {
  if (!d) return null;
  return <span className={className || 'icon-svg'} style={width || height ? { width, height } : undefined} dangerouslySetInnerHTML={{ __html: d }} />;
}

export const ICONS = {
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8h12l-1 12H7L6 8z" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5" stroke-linecap="round"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.4 4.4-5 8-5s6.5 1.6 8 5" stroke-linecap="round"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.6-9.2-9A5.3 5.3 0 0 1 12 6.5 5.3 5.3 0 0 1 21.2 11C19 15.4 12 20 12 20z" stroke-linejoin="round"/></svg>',
  heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M12 20s-7-4.6-9.2-9A5.3 5.3 0 0 1 12 6.5 5.3 5.3 0 0 1 21.2 11C19 15.4 12 20 12 20z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="5.5" r="2.4"/><circle cx="18" cy="18.5" r="2.4"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" stroke-linecap="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2.1-.1-2.1 0-3.6 1.3-3.6 3.7V11H8.3v3h2.4v7h2.8z"/></svg>',
  tw: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 6.5c3-2.6 8.6-2.4 11.4.6.8.9 1.7 1.5 2.9 1.5l1-2A5 5 0 0 0 12 5l5 6-5 6a6.2 6.2 0 0 0-4.5 1.9c-1 1-1.4 2.2-2.9 2.5 2.1-.4 2.5-2 2.9-3.1a6 6 0 0 0 3.4-.8c2.1 1.6 4 3.2 6 5-.5-2.8-2.4-4.4-3.9-6.1C8 11 6.6 9 5 6.5z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 6.5l8.5 6 8.5-6" stroke-linecap="round"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke-linecap="round"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 6h12v11H2z" stroke-linejoin="round"/><path d="M14 9h4l3 3v5h-7" stroke-linejoin="round"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="18" cy="18.5" r="1.8"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z" stroke-linejoin="round"/><path d="M5 19c2-5 5-8 10-11" stroke-linecap="round"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3a9 9 0 1 0 9 9c0-1.4-.8-2-1.8-2H17a2 2 0 0 1-1.5-3.3A2 2 0 0 0 17 4.5c.8 0 .9-.2.9-.5" stroke-linecap="round"/><circle cx="7.5" cy="12" r="1.1" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor"/><circle cx="15" cy="7" r="1.1" fill="currentColor"/></svg>',
  brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14.5 4.5l5 5-9 9H5.5v-5z" stroke-linejoin="round"/><path d="M11 10l3 3M14.5 4.5l1.5-1.5 5 5-1.5 1.5" stroke-linejoin="round"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8h14l-1.2 11H7.2z" stroke-linejoin="round"/><path d="M4 4h2l2 4" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" stroke-linecap="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" stroke-linejoin="round"/></svg>'
};

export const quoteSVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6.5 7C4.6 8.6 3 10.9 3 13.6V19h6v-6H6c0-1.9.9-3.2 2.2-4.2L6.5 7zm11 0c-1.9 1.6-3.5 3.9-3.5 6.6V19h6v-6h-3c0-1.9.9-3.2 2.2-4.2L17.5 7z"/></svg>';

export const PRODUCT_TYPES = ['T-Shirt', 'Hoodie', 'Art Print', 'Canvas', 'Home Decor', 'Accessories'];

export const COLOR_MAP = {
  black: '#12121a', violet: '#5f3a8e', midnight: '#141c40', indigo: '#3d3a9f', teal: '#1f8a7d',
  champagne: '#e8d9a8', gold: '#d4af37', plum: '#5a1f52', rose: '#c26a8e', 'deep purple': '#4a2163',
  'deep blue': '#22336e', sand: '#cdb894', walnut: '#6b4423', natural: '#d9c9a7'
};

export function mockupBody(type) {
  const MOCKPOINTS = {
    shirt: '150,170 300,230 500,230 650,170 715,310 600,380 640,700 160,700 200,380 85,310',
    hoodie: '150,205 300,255 500,255 650,205 715,315 600,385 640,700 160,700 200,385 85,315',
    tote: '170,120 630,120 630,300 655,660 145,660 170,300',
    cushion: '0,0 800,0 800,800 0,800'
  };
  const key = /shirt/i.test(type) ? 'shirt' : /hoodie/i.test(type) ? 'hoodie' : /tote|accessor/i.test(type) ? 'tote' : 'cushion';
  const pts = MOCKPOINTS[key];
  const isFrame = /print|canvas/i.test(type);
  const outline = isFrame ? '' : `<svg class="mock-outline" viewBox="0 0 800 800" aria-hidden="true"><polygon points="${pts}" fill="none" stroke="#f7f3ff" stroke-width="10" stroke-linejoin="round" opacity="0.85"/><polygon points="${pts}" fill="none" stroke="rgba(212,175,55,.55)" stroke-width="2.5" stroke-linejoin="round" transform="translate(0,-4)"/></svg>`;
  return { key, pts, outline, isFrame };
}