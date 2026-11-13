import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { volatilityPairs, publicStacks, leadershipFacts, theme } from '../tools/graphics/model.js';
import { projects } from '../content/projects.js';
import { puzzles } from '../lab/chess/puzzles.js';
import { Chess } from '../vendor/chess.js';
import { backtest } from '../lab/strategy/engine.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const json = path => JSON.parse(read(path));
const spy = json('lab/strategy/data/spy.json');
const manifest = json('assets/graphics/manifest.json');
const card = id => manifest.graphics.find(graphic => graphic.id === id);
const sha = data => createHash('sha256').update(data).digest('hex');

function webpSize(buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
  for (let i = 12; i + 8 <= buffer.length;) {
    const length = buffer.readUInt32LE(i + 4);
    if (buffer.toString('ascii', i, i + 4) === 'VP8L') {
      assert.equal(buffer[i + 8], 0x2f);
      const bits = buffer.readUInt32LE(i + 9);
      return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }
    i += 8 + length + (length & 1);
  }
  throw new Error('Expected lossless WebP');
}

test('all eight graphics have full/small lossless outputs, common framing and current provenance', () => {
  assert.deepEqual(manifest.graphics.map(graphic => graphic.id), ['renderer', 'thermal', 'volatility', 'strategy', 'chess', 'poker', 'portfolio-manager', 'chess-buddies']);
  assert.equal(manifest.design.background, '#13201b');
  const seen = new Set();
  for (const [i, graphic] of manifest.graphics.entries()) {
    assert.match(graphic.caption, new RegExp(`^0${i + 1} · [A-Z /]+$`));
    assert.ok(graphic.note.length > 0);
    assert.ok(Object.values(theme).includes(graphic.accent));
    assert.deepEqual(graphic.files.map(file => [file.width, file.height]), [[1600, 1000], [800, 500]]);
    for (const file of graphic.files) {
      const bytes = read(file.path);
      assert.deepEqual(webpSize(bytes), [file.width, file.height]);
      assert.equal(sha(bytes), file.sha256, `Stale output: ${file.path}`);
      assert.ok(!seen.has(file.path));
      seen.add(file.path);
    }
    for (const source of graphic.sources) assert.equal(sha(read(source.path)), source.sha256, `Stale source: ${source.path}`);
  }
  const html = read('tools/graphics/render.html').toString();
  const js = read('tools/graphics/render.js').toString();
  assert.match(html, /font-family:Archivo/);
  assert.match(html, /font-family:Plex/);
  assert.match(js, /width="1600" height="1000"/);
  assert.match(js, /pattern id="grid"/);
  assert.match(js, /x="40\.5" y="40\.5"/);
  assert.match(js, /createRenderer\(canvas/);
  assert.match(js, /renderChessPosition\(puzzle.fen\)/);
  for (const page of ['index.html', 'projects/index.html', 'projects/destinations.html', 'content/projects.js']) assert.ok(!read(page).toString().includes('assets/graphics/'), `${page} must remain unwired in phase 1`);
});

test('volatility pairs use past/current 20 log returns and only the next adjusted simple return', () => {
  const pairs = volatilityPairs(spy.data), returns = spy.data.slice(1, 21).map((row, i) => Math.log(row[1] / spy.data[i][1]));
  const mean = returns.reduce((sum, value) => sum + value, 0) / 20;
  const expected = Math.sqrt(returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / 19 * 252);
  assert.equal(pairs.length, spy.data.length - 21);
  assert.equal(pairs[0].date, spy.data[20][0]);
  assert.equal(pairs[0].nextDate, spy.data[21][0]);
  assert.ok(Math.abs(pairs[0].volatility - expected) < 1e-12);
  assert.equal(pairs[0].nextReturn, spy.data[21][1] / spy.data[20][1] - 1);
  assert.equal(pairs.at(-1).date, spy.data.at(-2)[0]);
  assert.equal(pairs.at(-1).nextDate, spy.data.at(-1)[0]);
  assert.equal(card('volatility').metrics.pairs, pairs.length);
  assert.equal(card('strategy').metrics.fills, backtest(spy.data).markers.length);
});

test('volatility handles empty/short/flat data and rejects invalid prices, dates, order and windows', () => {
  assert.deepEqual(volatilityPairs([]), []);
  assert.deepEqual(volatilityPairs(spy.data.slice(0, 20)), []);
  assert.ok(volatilityPairs(spy.data.slice(0, 24).map(([date]) => [date, 100])).every(pair => pair.volatility === 0 && pair.nextReturn === 0));
  for (const data of [[['bad', 100]], [['2020-01-01', 0]], [['2020-01-01', Infinity]], [['2020-01-02', 100], ['2020-01-01', 101]]]) assert.throws(() => volatilityPairs(data), RangeError);
  for (const window of [1, 0, 2.5]) assert.throws(() => volatilityPairs(spy.data, window), RangeError);
});

test('poker projects only public numeric stack fields and never serializes observations or cards', () => {
  const source = json('prototypes/data/poker-session.json'), stacks = publicStacks(source);
  assert.equal(stacks.length, 200);
  assert.equal(stacks[0].start, source.hands[0].hero_start);
  assert.equal(stacks.at(-1).end, source.hands.at(-1).hero_end);
  assert.deepEqual(publicStacks({ hands: [{ number: 1, hero_start: 100, hero_end: 90, hole_cards: ['PRIVATE'], observations: ['PRIVATE'], eliminations: ['seat'] }] }), [{ hand: 1, start: 100, end: 90, eliminated: 1 }]);
  assert.deepEqual(publicStacks({ hands: [] }), []);
  assert.throws(() => publicStacks({}), TypeError);
  for (const hands of [[{ number: 1, hero_start: -1, hero_end: 1 }], [{ number: 1, hero_start: 1, hero_end: NaN }], [{ number: 2, hero_start: 1, hero_end: 2 }, { number: 1, hero_start: 2, hero_end: 1 }]]) assert.throws(() => publicStacks({ hands }), RangeError);
  assert.deepEqual(card('poker').metrics.run, source.source);
  assert.equal(card('poker').metrics.privateCardsRead, false);
  assert.ok(!card('poker').sources.some(source => source.path.includes('poker-run')));
  assert.ok(!read('tools/graphics/render.js').toString().includes("read('/prototypes/data/poker-run.json')"));
});

test('leadership metrics are sourced and extraction fails if facts are absent or changed', () => {
  const facts = leadershipFacts(projects);
  assert.deepEqual(card('portfolio-manager').metrics, facts.manager);
  assert.deepEqual(card('chess-buddies').metrics, facts.buddies);
  assert.deepEqual(facts.buddies, { dates: 'Aug 2022–May 2024', children: '50+', team: 'SIX', events: '60+', schools: 'TWO' });
  assert.throws(() => leadershipFacts([]), /Missing sourced/);
  const changed = structuredClone(projects);
  changed.find(project => project.id === 'chess-buddies').body[0] = 'No verified numeric claims.';
  assert.throws(() => leadershipFacts(changed), /Source copy no longer matches/);
});

test('chess preview is a real verified initial position, thermal is explicitly illustrative', () => {
  const puzzle = puzzles.find(puzzle => puzzle.id === card('chess').metrics.puzzle);
  assert.equal(card('chess').metrics.fen, puzzle.fen);
  const game = new Chess(puzzle.fen);
  for (const san of puzzle.solution) game.move(san, { strict: true });
  assert.ok(game.isCheckmate());
  assert.equal(card('chess').metrics.count, puzzles.length);
  assert.equal(card('renderer').metrics.triangles, 20);
  assert.equal(card('renderer').metrics.vertices, 12);
  assert.match(card('thermal').caption, /ILLUSTRATIVE/);
  assert.match(card('thermal').note, /not Unity output/);
});
