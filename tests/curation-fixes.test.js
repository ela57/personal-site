import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { niceDomain } from '../prototypes/chart-domain.js';
import { timelineData } from '../dev/timeline-ribbon.js';
import { prototypes, scoreKeys } from '../content/prototypes.js';
import { techniques } from '../dev/motion-poses.js';

test('nice axes fit the complete positive cluster without forcing a distant zero', () => {
  const d = niceDomain([.14, .15, .17, .21]);
  assert.ok(d.min > 0 && d.min < .14 && d.max > .21);
  assert.ok(d.ticks.length >= 4 && d.ticks.length <= 9);
  assert.equal(d.ticks[0], d.min);
  const near = niceDomain([.001, .01, .1]); assert.equal(near.min, 0);
  const signed = niceDomain([-.05, .1]); assert.ok(signed.min < -.05 && signed.max > .1);
  const negative = niceDomain([-.3, -.2]); assert.ok(negative.max < 0);
  const flat = niceDomain([.2, .2]); assert.ok(flat.min < .2 && flat.max > .2);
  assert.deepEqual(niceDomain([]).ticks, [0,.25,.5,.75,1]);
  assert.throws(() => niceDomain([NaN]), RangeError);
});

test('ribbon sampling includes endpoints, year posts and a continuous date marker', () => {
  const rows = [['2001-01-01', 10], ['2005-01-03', 20], ['2010-01-04', 30], ['2011-01-03', 40]];
  const data = timelineData(rows, 2);
  assert.deepEqual(data.samples.map(p => p.index), [0,2,3]);
  assert.deepEqual(data.years.map(p => p.year), ['2001','2005','2010','2011']);
  assert.equal(data.atProgress(0).date, rows[0][0]); assert.equal(data.atProgress(1).date, rows.at(-1)[0]);
  assert.equal(data.atProgress(.5).x, -45);
  assert.ok(data.atProgress(.5).y > data.samples[0].y);
  assert.equal(data.atProgress(NaN).x, -90);
  assert.equal(timelineData(rows, 40).samples.length, 2);
  for (const bad of [[], [['2000-01-01',1]], [['bad',1],['2001-01-01',2]], [['2000-01-01',NaN],['2001-01-01',2]]]) assert.throws(() => timelineData(bad), RangeError);
  assert.throws(() => timelineData(rows, 0), RangeError);
});

test('recorded late-session sawtooth is retained with public fold explanations', () => {
  const hands = JSON.parse(readFileSync(new URL('../prototypes/data/poker-session.json', import.meta.url))).hands;
  for (let i = 1; i < hands.length; i++) assert.equal(hands[i].hero_start, hands[i - 1].hero_end);
  for (const hand of hands.filter(h => h.number >= 185)) {
    assert.equal(hand.hero_end, hand.number % 2 ? 590 : 790);
    assert.match(hand.note, /Heads-up:.*folded the small blind/);
    assert.match(hand.note, /200 chips net/);
  }
});

test('curation inventory retains every registry rating and all eight camera studies', () => {
  const text = readFileSync(new URL('../docs/journey/CURATION.md', import.meta.url),'utf8');
  for (const p of prototypes) assert.ok(text.includes(`| ${p.id} | ${scoreKeys.map(k => p.scores[k].value).join('/')} |`), p.id);
  for (const t of techniques) assert.ok(text.includes(`| ${t.id} | — |`), t.id);
});
