import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { renderScrollPage, selection } from '../experiments/scroll/generate.js';
import { portfolioNav, escape } from '../eportfolio/pages.js';
import { about, career, welcome } from '../content/eportfolio.js';
import { clamp, progress } from '../experiments/scroll/scroll.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('scroll gallery is a committed no-JS page with shared navigation and seven labelled features', () => {
  const html = read('experiments/scroll/index.html');
  assert.equal(html, renderScrollPage());
  assert.ok(html.includes(portfolioNav('experiments')));
  assert.ok(html.includes('Scroll experiments — pick the ones you like by number.'));
  for (let index = 1; index <= 7; index++) {
    assert.ok(html.includes(`id="F0${index}"`));
    assert.ok(html.includes(`F0${index} · `));
    assert.ok(html.includes(`href="#F0${index}"`));
  }
  assert.equal((html.match(/<section /g) || []).length, 7);
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
  assert.ok(!/three|webgl|https?:\/\//i.test(html));
  assert.ok(!read('index.html').includes('/experiments/scroll'));
  assert.ok(!read('projects/index.html').includes('/experiments/scroll'));
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
