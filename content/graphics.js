export const graphics = {
  renderer: ['renderer', 'Flat-shaded icosahedron projected by the site’s Canvas renderer, with a wireframe overlay.'],
  thermal: ['thermal', 'Illustrative renderer meshes at three depths, mapped to seven flat ember heat bands; not Unity output.'],
  vol: ['volatility', 'Bundled SPY: 20-session close-to-close realised volatility versus next-session adjusted return, 5,468 pairs.'],
  strategy: ['strategy', 'SPY adjusted closes with 20- and 100-session moving averages and simulated next-close buy and sell fills.'],
  chess: ['chess', 'Verified Invite the rook puzzle: White to move and mate in two, drawn with the shared geometric chess pieces.'],
  poker: ['poker', 'Hero end-of-hand chip totals across 200 public poker-session hands, including losses; no private cards.'],
  'portfolio-manager': ['portfolio-manager', 'GTSF role schematic: two independent strategies, a Python controller, capital allocation, rebalancing and risk constraints.'],
  'chess-buddies': ['chess-buddies', 'Chess Buddies: more than 50 children, a six-person volunteer team, more than 60 events each school year, two schools.'],
};

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
export const previewAssets = id => graphics[id] ? [800, 1600].map(width => `assets/graphics/${graphics[id][0]}-${width}.webp`) : [];
export function previewPicture(id, sizes = '(max-width: 899px) 100vw, 50vw', imageClass = '') {
  const graphic = graphics[id];
  if (!graphic) return '';
  const [name, alt] = graphic, base = `/assets/graphics/${name}`;
  return `<picture class="project-preview"><source type="image/webp" srcset="${base}-800.webp 800w, ${base}-1600.webp 1600w" sizes="${escape(sizes)}"><img src="${base}-800.webp" width="1600" height="1000" alt="${escape(alt)}"${imageClass ? ` class="${imageClass}"` : ''} loading="lazy" decoding="async"></picture>`;
}
