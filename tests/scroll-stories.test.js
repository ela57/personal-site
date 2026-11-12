import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from '../vendor/chess.js';
import { renderChessPosition } from '../lab/chess/board.js';
import { backtest } from '../lab/strategy/engine.js';
import { buildChessFrames, buildSpyChart } from '../experiments/scroll/stories.js';
import { scrollPuzzle, chessFrames, spy, spyChart, renderScrollPage } from '../experiments/scroll/generate.js';

test('F15 reuses board markup for each legal solution position through checkmate', () => {
  assert.equal(chessFrames.length, scrollPuzzle.solution.length + 1);
  const game = new Chess(scrollPuzzle.fen);
  assert.equal(chessFrames[0].fen, game.fen());
  scrollPuzzle.solution.forEach((san, i) => {
    const move = game.move(san, { strict: true });
    assert.equal(chessFrames[i + 1].fen, game.fen());
    assert.ok(chessFrames[i + 1].label.endsWith(san));
    assert.equal(chessFrames[i + 1].html, renderChessPosition(game.fen(), { black: false, lastMove: move, finished: game.isCheckmate() }));
  });
  assert.ok(game.isCheckmate());
  assert.equal(new Set(chessFrames.map(frame => frame.fen)).size, chessFrames.length);
  for (const frame of chessFrames) {
    assert.equal((frame.html.match(/role="gridcell"/g) || []).length, 64);
    assert.equal((frame.html.match(/ disabled/g) || []).length, 64);
  }
  assert.ok(renderScrollPage().includes(`data-fen="${game.fen()}" data-ply="5"`));
});

test('chess frame generation supports a static position and rejects invalid or non-mating solutions', () => {
  assert.equal(buildChessFrames({ ...scrollPuzzle, solution: [] }).length, 1);
  assert.throws(() => buildChessFrames({ ...scrollPuzzle, fen: 'invalid' }));
  assert.throws(() => buildChessFrames({ ...scrollPuzzle, solution: ['Ke8'] }));
  assert.throws(() => buildChessFrames({ ...scrollPuzzle, solution: ['Nh6+'] }), /checkmate/);
});

test('shared board renderer preserves interactive square, orientation and hint semantics', () => {
  const html = renderChessPosition(scrollPuzzle.fen, {
    readOnly: false, black: true, focusSquare: 'f7', selected: 'f7', legal: ['h6'],
    next: { from: 'f7', to: 'h6' }, hint: 2, lastMove: { from: 'c4', to: 'c5' },
  });
  assert.ok(html.startsWith('<div role="row"><button type="button" data-square="h1"'));
  assert.ok(!html.includes(' disabled'));
  assert.match(html, /data-square="f7"[^>]*tabindex="0"[^>]*selected[^>]*hint[^>]*aria-selected="true"/);
  assert.match(html, /data-square="h6"[^>]*legal[^>]*hint[^>]*legal destination/);
  assert.match(html, /data-square="c5"[^>]*lastMove/);
});

test('F16 uses every bundled SPY observation and exactly the sandbox default fill annotations', () => {
  assert.equal(spyChart.points.length, spy.data.length);
  assert.equal((spyChart.path.match(/[ML]/g) || []).length, spy.data.length);
  assert.equal(spyChart.points[0].x, 60);
  assert.equal(spyChart.points.at(-1).x, 940);
  assert.equal(spyChart.points.at(-1).price, spy.data.at(-1)[1]);
  assert.deepEqual(spyChart.markers.map(({ time, side }) => ({ time, side })), backtest(spy.data).markers);
  const total = spyChart.points.at(-1).length;
  for (const marker of spyChart.markers) {
    const point = spyChart.points.find(point => point.date === marker.time);
    assert.equal(marker.x, point.x);
    assert.equal(marker.y, point.y);
    assert.equal(marker.progress, point.length / total);
  }
  const html = renderScrollPage();
  assert.ok(html.includes('pathLength="1"'));
  assert.ok(html.includes(spy.description));
  assert.ok(html.includes('not live trading performance'));
});

test('SPY path generation handles empty, one-point and flat series without NaN', () => {
  assert.deepEqual(buildSpyChart([]), { path: '', points: [], markers: [], min: 0, max: 0 });
  for (const rows of [[['2020-01-01', 100]], [['2020-01-01', 100], ['2020-01-02', 100]]]) {
    const chart = buildSpyChart(rows);
    assert.ok(!/NaN|Infinity/.test(chart.path));
    assert.deepEqual(chart.markers, []);
  }
});

test('SPY path generation rejects invalid dates, prices and order rather than fabricating a series', () => {
  for (const rows of [[['invalid', 100]], [['2020-01-01', 0]], [['2020-01-01', NaN]], [['2020-01-02', 100], ['2020-01-01', 101]]]) {
    assert.throws(() => buildSpyChart(rows), RangeError);
  }
});
