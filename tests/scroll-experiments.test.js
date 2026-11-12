import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { renderScrollPage, selection, counters, pipelineStages } from '../experiments/scroll/generate.js';
import { portfolioNav, escape } from '../eportfolio/pages.js';
import { about, career, welcome, skills } from '../content/eportfolio.js';
import { clamp, progress, paletteInk, tones } from '../experiments/scroll/scroll.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('scroll gallery is a committed no-JS page with shared navigation and sixteen labelled features', () => {
  const html = read('experiments/scroll/index.html');
  assert.equal(html, renderScrollPage());
  assert.ok(html.includes(portfolioNav('experiments')));
  assert.ok(html.includes('Scroll experiments — pick the ones you like by number.'));
  for (let index = 1; index <= 16; index++) {
    const id = `F${String(index).padStart(2, '0')}`;
    assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.includes(`${id} · `));
    assert.ok(html.includes(`href="#${id}"`));
  }
  assert.equal((html.match(/<section /g) || []).length, 16);
  assert.ok(html.includes(escape(welcome)));
  assert.ok(html.includes(escape(about[0].slice(about[0].indexOf('What draws')))));
  career.steps.forEach(([title, text]) => {
    assert.ok(html.includes(escape(title)));
    assert.ok(html.includes(escape(text)));
  });
  selection.forEach(project => {
    assert.ok(html.includes(escape(project.title)));
    assert.ok(html.includes(escape(project.summary)));
  });
  for (const asset of html.matchAll(/src="\/(assets\/[^"#]+)"/g)) assert.ok(existsSync(new URL(`../${asset[1]}`, import.meta.url)), asset[1]);
  assert.ok(!/three|webgl/i.test(html));
  assert.ok(!/<(?:script|link|img)[^>]+(?:src|href)="https?:\/\//i.test(html));
  assert.ok(!read('index.html').includes('/experiments/scroll'));
  assert.ok(!read('projects/index.html').includes('/experiments/scroll'));
});

test('Skills chapter copy matches its headings rather than the career goal', () => {
  const chapter = read('experiments/scroll/index.html').match(/<section [^>]*id="F03"[\s\S]+?<\/section>/)[0];
  assert.ok(chapter.includes(escape(skills.Languages)));
  assert.ok(chapter.includes(escape(skills.Tools)));
  assert.ok(chapter.includes('Achievements &amp; awards'));
  assert.ok(!chapter.includes(escape(career.goal)));
});

test('F15 allows vertical touch scrolling without changing the interactive lab board', () => {
  assert.match(read('experiments/scroll/scroll.css'), /#F15\s+\.chessBoard\s*\{\s*touch-action:\s*pan-y\s*;\s*\}/);
  assert.match(read('lab/chess/lab.css'), /\.chessMount\s+\.chessBoard\{[^}]*touch-action:none/);
});

test('second batch uses sourced counters, labelled future goals and shared static pipeline modes', () => {
  const html = read('experiments/scroll/index.html');
  assert.deepEqual(counters.map(([value]) => value), [2, 5, 12, 2028]);
  assert.equal(pipelineStages.length, 5);
  assert.ok(html.includes('Summer 2027 · internship goal'));
  assert.ok(html.includes('May 2028 · graduation goal'));
  assert.ok(html.includes('Long term · career goal'));
  assert.equal((html.match(/class="spotlight-stage"/g) || []).length, 5);
  assert.ok(read('experiments/scroll/scroll.js').includes("import { pipelineModes } from '../../lab/pipeline.js'"));
  assert.ok(read('experiments/scroll/scroll.js').includes('rotate: false, drag: false'));
  assert.ok(html.includes('Pause marquee'));
});

test('threshold ink retains AA contrast through every chapter crossfade', () => {
  const luminance = rgb => rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  for (let a = 0; a < tones.length; a++) for (let b = 0; b < tones.length; b++) for (let step = 0; step <= 100; step++) {
    const t = step / 100, bg = luminance(tones[a].map((v, i) => v * (1 - t) + tones[b][i] * t));
    const ratio = paletteInk(a, b, t) === 'dark' ? (bg + .05) / .05 : 1.05 / (bg + .05);
    assert.ok(ratio >= 4.5, `${a}/${b}/${t}: ${ratio}`);
  }
});

test('native scroll progress clamps empty, before, within and after ranges', () => {
  assert.equal(clamp(-1), 0);
  assert.equal(clamp(2), 1);
  assert.equal(progress(0, 100, 200), 0);
  assert.equal(progress(200, 100, 200), .5);
  assert.equal(progress(400, 100, 200), 1);
  assert.equal(progress(100, 100, 0), 0);
  assert.equal(progress(101, 100, 0), 1);
  assert.ok(Math.abs(progress(.65, .32, .4) - .825) < .000001);
});
