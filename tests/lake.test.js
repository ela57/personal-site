import test from 'node:test';
import assert from 'node:assert/strict';
import { coverMapping, scrollState, waterline } from '../lab/lake/math.js';

test('cover mapping matches CSS cover and object position', () => {
  assert.deepEqual(coverMapping(1536, 1024, 1536, 1024), { scale: [1, 1], offset: [0, 0] });
  const portrait = coverMapping(390, 844, 1024, 1536, .5, .5);
  assert.equal(portrait.scale[1], 1);
  assert.ok(Math.abs(portrait.offset[0] - (1 - portrait.scale[0]) / 2) < 1e-9);
  const narrow = coverMapping(900, 900, 1536, 1024);
  assert.ok(Math.abs(narrow.offset[0] - .24) < 1e-9);
});
test('empty, invalid and zero image dimensions do not produce a mapping', () => {
  assert.equal(coverMapping(), null);
  assert.equal(coverMapping(0, 900, 1536, 1024), null);
  assert.equal(coverMapping(900, 900, NaN, 1024), null);
});
test('scroll evolution clamps endpoints and reaches work without a blank screen', () => {
  assert.deepEqual(scrollState(0, 900, 5000), { scale: 1, lift: -0, opacity: 1, veil: 0 });
  const work = scrollState(900, 900, 5000);
  assert.equal(work.scale, 1.06); assert.equal(work.veil, .72); assert.equal(work.opacity, 0);
  assert.equal(scrollState(405, 900, 5000).veil, .72);
  assert.ok(Math.abs(scrollState(10000, 900, 5000).veil - .9) < 1e-9);
  assert.equal(scrollState(-100, 900, 5000).veil, 0);
  assert.ok(Number.isFinite(scrollState(0, 0, 0).veil));
});
test('waterline slopes match the selected images', () => {
  assert.equal(waterline(0, false), .52); assert.equal(waterline(1, false), .547);
  assert.equal(waterline(0, true), .534); assert.equal(waterline(1, true), .542);
});
