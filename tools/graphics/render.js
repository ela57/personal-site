import { createRenderer } from '../../lab/renderer.js';
import { renderChessPosition } from '../../lab/chess/board.js';
import { puzzles } from '../../lab/chess/puzzles.js';
import { Chess } from '../../vendor/chess.js';
import { backtest } from '../../lab/strategy/engine.js';
import { projects } from '../../content/projects.js';
import { theme, volatilityPairs, publicStacks, leadershipFacts } from './model.js';

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const n = value => Number(value.toFixed(3));
const fmt = value => Number(value).toLocaleString('en-US');
const pct = value => `${(value * 100).toFixed(0)}%`;
const clamp = value => Math.max(0, Math.min(1, value));
const text = (x, y, value, cls = '', extra = '') => `<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(value)}</text>`;
const mix = (a, b, t) => {
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const aa = rgb(a), bb = rgb(b);
  return `rgb(${aa.map((v, i) => Math.round(v + (bb[i] - v) * t)).join(',')})`;
};
const line = (x1, y1, x2, y2, color = theme.mist, opacity = .3, dash = '') => `<path d="M${x1},${y1}L${x2},${y2}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const path = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)},${n(y)}`).join(' ');
const curve = (points, color, width = 3, extra = '') => `<path d="${path(points)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" ${extra}/>`;
const box = (x, y, w, h, accent, label, size = 27) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${theme.background}" stroke="${accent}" stroke-opacity=".65"/>${text(x + w / 2, y + h / 2 + size * .34, label, '', `text-anchor="middle" style="font-size:${size}px"`)}`;
const frame = (caption, note, accent, subject) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-label="${esc(caption)}">
<defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${theme.mist}" stroke-opacity=".055" stroke-width="1"/></pattern></defs>
<rect width="1600" height="1000" fill="${theme.background}"/><rect width="1600" height="1000" fill="url(#grid)"/>
<rect x="40.5" y="40.5" width="1519" height="919" fill="none" stroke="${theme.mist}" stroke-opacity=".28"/>
${subject}${line(84, 868.5, 1516, 868.5, accent, .55)}
<g id="footer">${text(84, 924, caption, 'caption', `style="fill:${accent}"`)}${text(1516, 924, note, 'note', 'text-anchor="end"')}</g>
</svg>`;

async function read(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

async function meshFrame(options = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;left:-10000px;top:0;width:1000px;height:700px';
  document.body.append(canvas);
  let renderer;
  try {
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Renderer did not produce a frame')), 5000);
      renderer = createRenderer(canvas, {
        rotate: false, drag: false, rx: .45, ry: .5, scale: .7, ...options,
        onFrame: value => { clearTimeout(timeout); resolve(value); },
      });
    });
  } finally { renderer?.destroy(); canvas.remove(); }
}

function mesh(frame, x, y, w, h, color, depth = false) {
  const faces = frame.faces.filter(face => face.facing && face.points.length >= 3).sort((a, b) => b.z - a.z);
  const points = faces.flatMap(face => face.points);
  const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
  const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
  const scale = Math.min(w / (maxX - minX), h / (maxY - minY));
  return `<g transform="translate(${n(x + (w - (maxX - minX) * scale) / 2)},${n(y + (h - (maxY - minY) * scale) / 2)}) scale(${n(scale)}) translate(${-n(minX)},${-n(minY)})">${faces.map(face => {
    const intensity = depth ? .15 + .85 * Math.round(clamp(1 - (face.z - 2.6) / 4.4) * 6) / 6 : .18 + face.lit * .82;
    return `<polygon points="${face.points.map(p => p.map(n).join(',')).join(' ')}" fill="${mix(theme.background, color, intensity)}" stroke="${color}" stroke-opacity=".55" stroke-width="1.2"/>`;
  }).join('')}</g>`;
}

function axes({ x, y, w, h, xLabel, yLabel, xTicks, yTicks }) {
  return yTicks.map(([t, label]) => line(x, y + h * t, x + w, y + h * t, theme.mist, .16) + text(x - 20, y + h * t + 8, label, 'axis', 'text-anchor="end"')).join('') +
    xTicks.map(([t, label]) => text(x + w * t, y + h + 45, label, 'axis', 'text-anchor="middle"')).join('') +
    text(x + w / 2, y + h + 104, xLabel, 'small', 'text-anchor="middle"') + text(x, y - 35, yLabel, 'small');
}

async function build() {
  const [spy, session] = await Promise.all([read('/lab/strategy/data/spy.json'), read('/prototypes/data/poker-session.json')]);
  const rows = spy.data, series = backtest(rows), pairs = volatilityPairs(rows), stacks = publicStacks(session);
  const facts = leadershipFacts(projects);
  const rendered = await meshFrame();
  const cards = [];
  const add = (id, caption, note, accent, subject, sources, metrics, description) => cards.push({ id, caption, note, accent, svg: frame(caption, note, accent, subject), sources, metrics, description });

  add('renderer', '01 · SOFTWARE RENDERER', `${rendered.faces.length} triangles · Canvas 2D illustration`, theme.ember,
    text(100, 118, 'MODEL → VIEW → PROJECTION', 'small') + mesh(rendered, 370, 160, 860, 650, theme.ember) +
    text(100, 770, 'CULL', 'small') + text(100, 808, 'SORT / LIGHT', 'small'),
    ['lab/renderer.js', 'lab/pipeline.js'], { triangles: rendered.faces.length, vertices: rendered.screen.length, pose: { rx: .45, ry: .5 }, shading: 'existing face.lit / ambient .18 + diffuse .82' },
    'Projected mesh and Lambert values captured from createRenderer.onFrame; flat palette recolouring of the browser illustration, not the original Python output.');

  const depths = [3.6, 4.8, 6];
  let thermal = text(100, 118, 'VIEW-SPACE DEPTH → ILLUSTRATIVE HEAT', 'small');
  for (const [i, camZ] of depths.entries()) {
    thermal += mesh(await meshFrame({ camZ }), 108 + i * 470, 230, 444, 430, theme.ember, true);
    thermal += text(330 + i * 470, 735, `z = ${camZ.toFixed(1)}`, 'note', 'text-anchor="middle"');
  }
  for (let i = 0; i < 7; i++) thermal += `<rect x="${600 + i * 56}" y="790" width="48" height="15" fill="${mix(theme.background, theme.ember, .15 + .85 * i / 6)}"/>`;
  thermal += text(570, 806, 'FAR', 'note', 'text-anchor="end"') + text(1015, 806, 'NEAR', 'note');
  add('thermal', '02 · THERMAL SHADER / ILLUSTRATIVE', 'palette-mapped depth · not Unity output', theme.ember, thermal,
    ['lab/renderer.js', 'lab/pipeline.js', 'lab/thermal.js'], { cameraDepths: depths, bands: 7, normalizedDepthRange: [2.6, 7], originalHlslAvailable: false },
    'Three actual renderer mesh projections. View-space face depths map to seven forest/ember bands. The Unity/HLSL source and original shader ramp are absent; no Unity output is claimed.');

  const scatterPlot = { x: 200, y: 230, w: 1220, h: 470 };
  const volMax = Math.ceil(Math.max(...pairs.map(p => p.volatility)) * 10) / 10;
  const returnMax = Math.ceil(Math.max(...pairs.map(p => Math.abs(p.nextReturn))) * 100) / 100;
  let scatter = text(100, 118, '20-SESSION VOLATILITY / NEXT-SESSION RETURN', 'small');
  scatter += axes({ ...scatterPlot, xLabel: 'ANNUALISED CLOSE-TO-CLOSE VOLATILITY', yLabel: 'NEXT-SESSION ADJUSTED RETURN', xTicks: [0, .25, .5, .75, 1].map(t => [t, pct(volMax * t)]), yTicks: [0, .25, .5, .75, 1].map(t => [t, pct(returnMax * (1 - 2 * t))]) });
  scatter += pairs.map(p => `<circle cx="${n(scatterPlot.x + p.volatility / volMax * scatterPlot.w)}" cy="${n(scatterPlot.y + (returnMax - p.nextReturn) / (2 * returnMax) * scatterPlot.h)}" r="2.3" fill="${theme.mist}" fill-opacity=".38"/>`).join('');
  add('volatility', '03 · SPY VOLATILITY', `${fmt(pairs.length)} pairs · close-to-close`, theme.mist, scatter,
    ['lab/strategy/data/spy.json', 'prototypes/finance.js', 'tools/graphics/model.js'], { sessions: rows.length, pairs: pairs.length, window: 20, first: pairs[0].date, last: pairs.at(-1).date, returnConvention: 'next adjusted simple return; 20 close-to-close log returns, sample SD × sqrt(252)' },
    'Every eligible bundled adjusted-close pair, with no trimming or invented regression result. This is not a reproduction of the notebook’s OHLC/Garman–Klass estimator or 2000-onward sample.');

  const pricePlot = { x: 180, y: 220, w: 1240, h: 480 };
  const maxPrice = Math.ceil(Math.max(...rows.map(row => row[1])) / 100) * 100;
  const px = i => pricePlot.x + i / (rows.length - 1) * pricePlot.w;
  const py = value => pricePlot.y + (1 - value / maxPrice) * pricePlot.h;
  let strategy = text(100, 118, 'SPY / 20-SESSION SMA / 100-SESSION SMA', 'small');
  strategy += axes({ ...pricePlot, xLabel: 'BUNDLED SPY · ADJUSTED CLOSES', yLabel: 'ADJUSTED PRICE / DATASET UNITS', xTicks: [0, .25, .5, .75, 1].map(t => [t, rows[Math.round(t * (rows.length - 1))][0].slice(0, 4)]), yTicks: [0, .25, .5, .75, 1].map(t => [t, fmt(maxPrice * (1 - t))]) });
  strategy += curve(rows.map((row, i) => [px(i), py(row[1])]), theme.mist, 2, 'stroke-opacity=".55"');
  for (const [values, dash] of [[series.fast, ''], [series.slow, '12 9']]) strategy += curve(values.flatMap((value, i) => value === null ? [] : [[px(i), py(value)]]), theme.lake, 3, `stroke-dasharray="${dash}"`);
  const indexByDate = new Map(rows.map((row, i) => [row[0], i]));
  for (const marker of series.markers) {
    const i = indexByDate.get(marker.time), x = px(i), y = py(rows[i][1]), sign = marker.side === 'buy' ? 1 : -1;
    strategy += `<path d="M${n(x - 5)},${n(y + 17 * sign)}H${n(x + 5)}L${n(x)},${n(y + 6 * sign)}Z" fill="${theme.lake}"/>`;
  }
  strategy += text(1420, 156, 'SOLID 20 / DASHED 100 · ▲ BUY / ▼ SELL', 'note', 'text-anchor="end"');
  add('strategy', '04 · STRATEGY SANDBOX', `${fmt(rows.length)} sessions · 20/100 SMA`, theme.lake, strategy,
    ['lab/strategy/data/spy.json', 'lab/strategy/engine.js'], { sessions: rows.length, fills: series.markers.length, short: 20, long: 100, costBps: 5, first: rows[0][0], last: rows.at(-1)[0] },
    'Entire bundled SPY adjusted-close series, engine-default 20/100 SMAs and executed next-close fill markers. Educational historical simulation, not live performance or executable quotes.');

  const puzzle = puzzles.find(puzzle => puzzle.id === 'smothered-sacrifice'), game = new Chess(puzzle.fen);
  const sideToMove = game.turn() === 'w' ? 'WHITE' : 'BLACK';
  for (const san of puzzle.solution) game.move(san, { strict: true });
  if (!game.isCheckmate()) throw new Error('Puzzle line did not finish in checkmate');
  const board = `<foreignObject x="760" y="145" width="660" height="660"><div xmlns="http://www.w3.org/1999/xhtml" class="chessMount"><div class="chessBoard" role="grid" aria-label="${esc(puzzle.title)}">${renderChessPosition(puzzle.fen)}</div></div></foreignObject>`;
  const chess = text(100, 118, 'VERIFIED PUZZLE POSITION', 'small') + text(130, 350, puzzle.title, 'heading', 'style="font-size:64px"') + text(130, 430, `${sideToMove} TO MOVE`, 'small') + text(130, 485, `Mate in ${puzzle.mateIn}`, 'note') + line(130, 530, 610, 530, theme.moss, .6) + text(130, 588, 'GEOMETRIC PIECES / CC0', 'small') + board;
  add('chess', '05 · CHESS PUZZLES', `${puzzles.length} verified puzzles · mate in ${puzzle.mateIn}`, theme.moss, chess,
    ['lab/chess/puzzles.js', 'lab/chess/board.js', 'lab/chess/lab.css', 'lab/chess/PIECES-LICENSE', 'vendor/chess.js'], { puzzle: puzzle.id, fen: puzzle.fen, solution: puzzle.solution, solutionEndsInMate: game.isCheckmate(), displayedPosition: 'initial', count: puzzles.length },
    'Initial position of Invite the rook, rendered by the existing shared board renderer. The bundled SAN solution is executed strictly and checked for checkmate before capture.');

  const stackPlot = { x: 180, y: 220, w: 1240, h: 480 };
  const maxChips = Math.ceil(Math.max(...stacks.flatMap(row => [row.start, row.end])) / 1000) * 1000;
  const sx = hand => stackPlot.x + (hand - stacks[0].hand) / (stacks.at(-1).hand - stacks[0].hand) * stackPlot.w;
  const sy = value => stackPlot.y + (1 - value / maxChips) * stackPlot.h;
  let poker = text(100, 118, 'PUBLIC END-OF-HAND STACK / DETERMINISTIC RUN', 'small');
  poker += axes({ ...stackPlot, xLabel: 'HAND NUMBER', yLabel: 'HERO STACK / CHIPS', xTicks: [0, .25, .5, .75, 1].map(t => [t, stacks[Math.round(t * (stacks.length - 1))].hand]), yTicks: [0, .25, .5, .75, 1].map(t => [t, fmt(maxChips * (1 - t))]) });
  poker += line(stackPlot.x, sy(stacks[0].start), stackPlot.x + stackPlot.w, sy(stacks[0].start), theme.mist, .45, '7 9');
  poker += curve(stacks.map(row => [sx(row.hand), sy(row.end)]), theme.ember, 4);
  poker += stacks.filter(row => row.eliminated).map(row => line(sx(row.hand), stackPlot.y - 15, sx(row.hand), stackPlot.y + 12, theme.ember, .8)).join('');
  poker += text(1420, 156, `START ${fmt(stacks[0].start)} / END ${fmt(stacks.at(-1).end)}`, 'note', 'text-anchor="end"');
  add('poker', '06 · POKER PRACTICE', `${stacks.length} hands · public chip totals only`, theme.ember, poker,
    ['prototypes/data/poker-session.json', 'tools/export_poker.py', 'tools/graphics/model.js'], { hands: stacks.length, firstHand: stacks[0].hand, lastHand: stacks.at(-1).hand, firstStack: stacks[0].start, finalStack: stacks.at(-1).end, run: session.source, privateCardsRead: false },
    'Public end-of-hand hero chip totals only; ticks mark public elimination hands. No poker-run.json, observations, private hole cards, showdown hands or offline equity are loaded. This run is not evidence of playing strength.');

  let manager = text(100, 118, 'GTSF / QUANT SECTOR / ROLE SCHEMATIC', 'small');
  manager += text(800, 330, 'PYTHON PORTFOLIO CONTROLLER', 'heading', 'text-anchor="middle" style="font-size:57px"');
  manager += box(120, 470, 390, 130, theme.moss, facts.manager.strategies.toUpperCase(), 23);
  manager += line(510, 535, 640, 535, theme.moss, .8) + box(640, 470, 320, 130, theme.moss, 'CONTROLLER', 28);
  manager += line(960, 535, 1040, 535, theme.moss, .8) + line(1040, 405, 1040, 755, theme.moss, .8);
  for (const [i, label] of facts.manager.functions.entries()) {
    const y = 360 + i * 175;
    manager += line(1040, y + 45, 1090, y + 45, theme.moss, .8) + box(1090, y, 390, 90, theme.moss, label.toUpperCase(), 24);
  }
  add('portfolio-manager', '07 · GTSF PORTFOLIO MANAGER', `${facts.manager.dates} · Quant Sector`, theme.moss, manager,
    ['content/projects.js', 'content/eportfolio.js', 'tools/graphics/model.js'], facts.manager,
    'Typographic role schematic using only the existing Portfolio Manager facts: two independent strategies, a central Python controller, capital allocation, rebalancing and risk constraints. Not a performance or architecture measurement.');

  let buddies = text(100, 118, 'PRESIDENT / CHESS BUDDIES / METRO ATLANTA', 'small');
  const values = [[facts.buddies.children, 'CHILDREN REACHED'], [facts.buddies.team, 'PERSON VOLUNTEER TEAM'], [facts.buddies.events, 'EVENTS EACH SCHOOL YEAR'], [facts.buddies.schools, 'SCHOOLS']];
  for (const [i, [value, label]] of values.entries()) {
    const x = 160 + i % 2 * 740, y = 400 + Math.floor(i / 2) * 330;
    buddies += text(x, y, value, '', 'style="font-size:154px;font-weight:500;letter-spacing:-4px"') + text(x + 4, y + 60, label, 'small');
  }
  buddies += line(800, 210, 800, 810, theme.mist, .25) + line(120, 510, 1480, 510, theme.mist, .25);
  add('chess-buddies', '08 · CHESS BUDDIES', `${facts.buddies.dates} · President`, theme.mist, buddies,
    ['content/projects.js', 'content/eportfolio.js', 'tools/graphics/model.js'], facts.buddies,
    'Leadership facts from content/projects.js (its body references the supplied About copy). More than 50 children, a six-person volunteer team, more than 60 events each school year, two schools.');

  window.graphics = cards;
  window.showGraphic = async id => {
    const card = cards.find(card => card.id === id);
    if (!card) throw new Error(`Unknown graphic ${id}`);
    document.querySelector('#art').innerHTML = card.svg;
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  };
  window.graphicsReady = true;
}

build().catch(error => { window.graphicsError = error.stack; });
