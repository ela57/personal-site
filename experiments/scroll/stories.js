import { Chess } from '../../vendor/chess.js';
import { renderChessPosition } from '../../lab/chess/board.js';
import { backtest } from '../../lab/strategy/engine.js';

export function buildChessFrames(puzzle) {
  const game = new Chess(puzzle.fen), black = game.turn() === 'b';
  const frame = (label, lastMove = null) => ({
    fen: game.fen(), label,
    html: renderChessPosition(game.fen(), { black, lastMove, finished: game.isCheckmate() }),
  });
  const frames = [frame(`Initial position · ${black ? 'Black' : 'White'} to move`)];
  for (const san of puzzle.solution) {
    const move = game.move(san, { strict: true });
    frames.push(frame(`${move.color === 'w' ? 'White' : 'Black'} · ${move.san}`, move));
  }
  if (puzzle.solution.length && !game.isCheckmate()) throw new Error('Puzzle solution must finish in checkmate.');
  return frames;
}

export function buildSpyChart(data) {
  const { rows, markers } = backtest(data);
  if (!rows.length) return { path: '', points: [], markers: [], min: 0, max: 0 };
  const prices = rows.map(row => row[1]), min = Math.min(...prices), max = Math.max(...prices);
  const first = Date.parse(rows[0][0]), span = Date.parse(rows.at(-1)[0]) - first;
  let length = 0, previous = null;
  const points = rows.map(([date, price], i) => {
    const x = Number((60 + (Date.parse(date) - first) / (span || 1) * 880).toFixed(2));
    const y = Number((max === min ? 220 : 380 - (price - min) / (max - min) * 320).toFixed(2));
    if (i) length += Math.hypot(x - previous.x, y - previous.y);
    previous = { x, y };
    return { date, price, x, y, length };
  });
  function normalized(point) { return length ? point.length / length : 0; }
  const byDate = new Map(points.map(point => [point.date, point]));
  return {
    path: points.map((point, i) => `${i ? 'L' : 'M'}${point.x},${point.y}`).join(' '),
    points, min, max,
    markers: markers.map(marker => ({ ...marker, ...byDate.get(marker.time), progress: normalized(byDate.get(marker.time)) })),
  };
}
