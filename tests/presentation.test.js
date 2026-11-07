import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { imagePoint } from '../lab/lake/annotations.js';
import { revealInterval } from '../lab/words.js';
import { clipDepth, pipelineModes } from '../lab/pipeline.js';
import { fenSquares, chessPreview, strategyPreview } from '../lab/previews.js';
import { puzzles } from '../lab/chess/puzzles.js';

test('annotation targets use image bounds including mat and viewport offsets at every width', () => {
  for (const width of [390, 820, 1440, 1920]) {
    const frame = { left: 40, top: 80, width, height: width * 418 / 768 };
    const image = { left: 56, top: 96, width: width - 32, height: (width - 32) * 418 / 768 };
    const target = imagePoint([.293, .682], image, frame);
    assert.deepEqual(target, [16 + image.width * .293, 16 + image.height * .682]);
    assert.deepEqual(imagePoint([1, 1], image, frame), [16 + image.width, 16 + image.height]);
  }
  assert.deepEqual(imagePoint([], null, null), [0, 0]);
  assert.deepEqual(imagePoint([NaN, 0], {}, {}), [0, 0]);
  assert.deepEqual(imagePoint([1], {}, {}), [0, 0]);
});

test('heading character spacing is 35ms with a 700ms total cap', () => {
  assert.equal(revealInterval(10), 35);
  assert.equal(revealInterval(0), 35);
  assert.ok(revealInterval(150) * 149 + 120 <= 700);
});

test('depth clipping preserves visible triangles and clips both NDC planes', () => {
  const inside = [[0,0,0], [1,0,.5], [0,1,-.5]];
  assert.deepEqual(clipDepth(inside,-1,1), inside);
  const clipped = clipDepth([[0,0,-2], [1,0,2], [0,1,0]], -1,1);
  assert.ok(clipped.length >= 3);
  assert.ok(clipped.every(point => point[2] >= -1 && point[2] <= 1));
  assert.deepEqual(clipDepth([[0,0,3], [1,0,3], [0,1,3]], -1,1), []);
  assert.deepEqual(clipDepth([], -1,1), []);
  assert.throws(() => clipDepth(inside, 1,-1), RangeError);
  assert.equal(new Set(pipelineModes.map(mode => JSON.stringify(mode))).size, 5);
});

test('Lab board is exactly the first bundled puzzle, with static SVG kept in sync', () => {
  const board = fenSquares(puzzles[0].fen);
  assert.equal(board.length, 64); assert.equal(board[6], 'k'); assert.equal(board[60], 'R'); assert.equal(board[62], 'K');
  assert.equal(fenSquares('8/8/8/8/8/8/8/8').filter(Boolean).length, 0);
  assert.throws(() => fenSquares('8/8'), RangeError);
  assert.throws(() => fenSquares('7/88/8/8/8/8/8/8'), RangeError);
  assert.equal(readFileSync(new URL('../assets/chess-preview.svg', import.meta.url), 'utf8'), chessPreview());
});

test('SPY preview contains prices and both bundled-data moving averages, with readable empty/error cases', () => {
  const rows = JSON.parse(readFileSync(new URL('../lab/strategy/data/spy.json', import.meta.url))).data;
  const svg = strategyPreview(rows);
  assert.equal((svg.match(/<path/g) || []).length, 4);
  assert.ok(!svg.includes('NaN'));
  assert.equal(readFileSync(new URL('../assets/strategy-preview.svg', import.meta.url), 'utf8'), svg);
  assert.match(strategyPreview([]), /No price data/);
  assert.throws(() => strategyPreview([['2020-01-01', -1]]), RangeError);
  assert.ok(!strategyPreview([['2020-01-01', 1]]).includes('NaN'));
});
