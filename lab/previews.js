import { puzzles } from './chess/puzzles.js';
import { sma } from './strategy/engine.js';

export function fenSquares(fen) {
  const ranks = fen.split(' ')[0].split('/');
  if (ranks.length !== 8) throw new RangeError('Expected eight ranks.');
  const expanded = ranks.map(rank => Array.from(rank).flatMap(char => /[1-8]/.test(char) ? Array(Number(char)).fill('') : [char]));
  if (expanded.some(rank => rank.length !== 8)) throw new RangeError('Expected eight squares per rank.');
  const squares = expanded.flat();
  if (squares.length !== 64 || squares.some(piece => !/^[prnbqkPRNBQK]?$/.test(piece))) throw new RangeError('Invalid board position.');
  return squares;
}

export function chessPreview() {
  const glyphs = { k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟', K:'♚', Q:'♛', R:'♜', B:'♝', N:'♞', P:'♟' };
  const board = fenSquares(puzzles[0].fen).map((piece, index) => {
    const x = index % 8, y = Math.floor(index / 8), white = piece && piece === piece.toUpperCase();
    return `<rect x="${x}" y="${y}" width="1" height="1" fill="${(x+y)%2 ? '#75816a' : '#e9e5da'}"/>${piece ? `<text x="${x+.5}" y="${y+.82}" text-anchor="middle" font-family="DejaVu Sans,serif" font-size=".9" fill="${white ? '#fffaf0' : '#13201b'}" stroke="#13201b" stroke-width=".018">${glyphs[piece]}</text>` : ''}`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><title>${puzzles[0].title}: White to move</title>${board}</svg>\n`;
}

export function strategyPreview(rows) {
  if (!rows.length) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><title>No price data</title></svg>\n';
  const values = rows.map(row => row[1]);
  if (values.some(value => !Number.isFinite(value) || value <= 0)) throw new RangeError('Expected positive prices.');
  const series = [values, sma(values,20), sma(values,100)];
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const paths = series.map((line, index) => {
    const points = line.flatMap((value, i) => value === null || (i % 8 && i !== line.length - 1) ? [] : [[24 + i / Math.max(1, line.length - 1) * 592, 280 - (value - min) / range * 248]]);
    const d = points.map(([x,y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    return `<path d="${d}" fill="none" stroke="${['#ece7dc','#e3b677','#94aa8d'][index]}" stroke-width="${index ? 2.5 : 1.5}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><title>Bundled SPY adjusted closes, with 20-day and 100-day moving averages</title><path d="M24 280H616M24 156H616M24 32H616" stroke="#ece7dc" opacity=".12"/>${paths}</svg>\n`;
}
