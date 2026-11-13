import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createScrollScheduler, progress } from '../eportfolio/scroll-scheduler.js';
import { advanceMarquee, marqueeTransform, paintInk, inkRange, paintStack, paintTimeline } from '../eportfolio/scroll-effects.js';
import { chapterPalette, luminance, tones, welcomePalette, welcomeTones } from '../eportfolio/palette.js';
import { graphics, previewPicture } from '../content/graphics.js';
import { galleryProjects } from '../eportfolio/features.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('eight approved responsive previews cover all static lists and available overlay headers', () => {
  for (const page of ['index.html', 'projects/index.html', 'projects/destinations.html']) {
    const html = read(page);
    for (const [id, [name]] of Object.entries(graphics)) {
      assert.ok(html.includes(`${name}-800.webp 800w, /assets/graphics/${name}-1600.webp 1600w`), `${page}: ${id}`);
      assert.ok(html.includes(previewPicture(id, '(max-width: 899px) 100vw, 380px')));
    }
    assert.ok(!/src="\/assets\/(?:shader-cover|chess-preview|strategy-preview)/.test(html));
  }
  for (const page of ['index.html', 'projects/index.html']) {
    const html = read(page);
    assert.ok(html.includes('https://ethan-lam.com/assets/graphics/renderer-1600.webp'));
    for (const slug of ['renderer', 'thermal', 'vol', 'lab-chess', 'lab-strategy']) {
      const template = html.match(new RegExp(`<template id="tpl-${slug}">([\\s\\S]*?)</template>`))[1];
      assert.ok(template.includes(`<figure class="preview-hero">${previewPicture(slug.replace('lab-', ''))}`));
    }
    assert.equal((html.match(/data-scroll-gallery/g) || []).length, 1);
    assert.equal((html.match(/data-scroll-marquee/g) || []).length, 1);
    assert.ok(html.includes('<p data-scroll-ink>'));
    assert.equal(galleryProjects.length, 5);
    galleryProjects.forEach(project => assert.ok(html.includes(`href="${project.links[0].href}"`)));
  }
  assert.equal(previewPicture('unknown'), '');
});

test('primary effects have readable static copy, future goal labels and only opt-in desktop pinning', () => {
  assert.ok(read('about/index.html').includes('<p data-scroll-ink>'));
  const career = read('career/index.html');
  assert.ok(career.indexOf('data-scroll-timeline') < career.indexOf('data-scroll-stack'));
  for (const goal of ['Summer 2027 · internship goal', 'May 2028 · graduation goal', 'Long term · career goal']) assert.ok(career.includes(goal));
  assert.equal((career.match(/style="--index:/g) || []).length, 5);
  const html = read('index.html');
  assert.ok(html.includes('class="skills-readable"'));
  assert.equal((html.match(/class="marquee-copy" aria-hidden="true"/g) || []).length, 4);
  assert.ok(html.includes('aria-pressed="false" hidden>Pause marquee'));
  const css = read('eportfolio/scroll.css');
  assert.ok(css.includes('@media(min-width:900px) and (prefers-reduced-motion:no-preference)'));
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  for (const path of ['eportfolio/scroll.js', 'experiments/scroll/scroll.js']) {
    const js = read(path);
    assert.match(js, /createScrollScheduler/);
    assert.ok(!js.includes('requestAnimationFrame('));
    assert.ok(js.includes('scroll-effects.js'));
    assert.ok(js.includes('if (!event.persisted)'));
  }
});

test('shared scheduler coalesces frames, reads scroll once and preserves persisted pagehide restoration', () => {
  class Window extends EventTarget {
    frames = new Map(); next = 0; scrollY = 250;
    requestAnimationFrame(fn) { this.frames.set(++this.next, fn); return this.next; }
    cancelAnimationFrame(id) { this.frames.delete(id); }
    flush(time) { const queue = [...this.frames.values()]; this.frames.clear(); queue.forEach(fn => fn(time)); }
  }
  const win = new Window(), doc = new EventTarget(), calls = [];
  let measures = 0;
  const scheduler = createScrollScheduler((time, scroll) => calls.push([time, scroll]), { win, doc, measure: () => { measures++; return win.scrollY; } });
  scheduler.schedule(); scheduler.schedule();
  assert.equal(win.frames.size, 1);
  win.flush(16); assert.deepEqual(calls, [[16, 250]]); assert.equal(measures, 1);
  win.scrollY = 350; win.dispatchEvent(new Event('scroll')); win.flush(32);
  assert.deepEqual(calls.at(-1), [32, 350]); assert.equal(measures, 1);
  const hide = new Event('pagehide'); Object.defineProperty(hide, 'persisted', { value: true });
  win.dispatchEvent(hide); scheduler.schedule(); assert.equal(win.frames.size, 0);
  win.dispatchEvent(new Event('pageshow')); win.flush(48); assert.equal(measures, 2);
  win.dispatchEvent(new Event('pagehide')); scheduler.schedule(); assert.equal(win.frames.size, 0);
  win.dispatchEvent(new Event('pageshow')); assert.equal(win.frames.size, 0);
  scheduler.destroy();
});

test('shared effects retain bounded ink/stack/path end states and opposite marquee drift', () => {
  const words = Array.from({ length: 3 }, () => ({ style: {} }));
  paintInk(words, 0); assert.ok(words.every(word => word.style.opacity === .2));
  paintInk(words, 1); assert.ok(words.every(word => word.style.opacity === 1));
  paintInk([], 1);
  assert.ok(advanceMarquee(0, 16, 1) > advanceMarquee(0, 16, 0));
  assert.match(marqueeTransform(100, 500, 0, 0), /translateX\(-100px\)/);
  assert.match(marqueeTransform(100, 500, 1, 0), /translateX\(-400px\)/);
  const card = { style: {} }; paintStack(card, 1); assert.equal(card.style.opacity, .84);
  const path = { style: {} }; paintTimeline(path, [], 1); assert.equal(path.style.strokeDashoffset, 0);
  assert.equal(progress(0, 0, 0), 0);
  assert.equal(progress(100, 0, 0), 1);
});

test('primary ink starts unrevealed at page top and completes at the reading centre', () => {
  for (const [top, paragraphTop, paragraphHeight, viewport] of [[630, 800, 260, 1000], [480, 600, 420, 844], [1500, 1620, 420, 844], [360, 360, 180, 1000]]) {
    const range = inkRange(top, paragraphTop, paragraphHeight, viewport);
    assert.equal(progress(0, range.start, range.distance), 0);
    const end = Math.max(range.start + viewport * .25, paragraphTop + paragraphHeight / 2 - viewport / 2);
    assert.equal(progress(end, range.start, range.distance), 1);
    const words = Array.from({ length: 74 }, () => ({ style: {} }));
    paintInk(words, 0, 0); assert.ok(words.every(word => word.style.opacity === .2));
    paintInk(words, .5, 0); assert.equal(words.filter(word => word.style.opacity === 1).length, 37);
    paintInk(words, 1, 0); assert.ok(words.every(word => word.style.opacity === 1));
  }
  assert.doesNotThrow(() => paintInk([], 0, 0));
});

test('the shared F03 palette retains AA ink throughout its original four tones', () => {
  assert.match(read('experiments/scroll/scroll.js'), /import \{ tones, paletteInk \} from '..\/..\/eportfolio\/palette.js'/);
  assert.deepEqual(chapterPalette(0).background, tones[0]);
  assert.deepEqual(chapterPalette(1).background, tones[3]);
  assert.deepEqual(chapterPalette(-1), chapterPalette(0));
  assert.deepEqual(chapterPalette(2), chapterPalette(1));
  for (let i = 0; i <= 1000; i++) {
    const palette = chapterPalette(i / 1000), bg = luminance(palette.background);
    const ratio = palette.color === '#000000' ? (bg + .05) / .05 : 1.05 / (bg + .05);
    assert.ok(ratio >= 4.5, `${i}: ${ratio}`);
  }
  for (const tone of tones.slice(1)) assert.ok(1.05 / (luminance(tone) + .05) >= 4.5);
});

test('Welcome stays in dark forest and lake tones with light AA ink and blended centred edges', () => {
  assert.deepEqual(welcomeTones, [[19, 32, 27], [19, 44, 35], [24, 55, 68]]);
  assert.deepEqual(welcomePalette(0).background, welcomeTones[0]);
  assert.deepEqual(welcomePalette(.5).background, welcomeTones[1]);
  assert.deepEqual(welcomePalette(1).background, welcomeTones[2]);
  assert.deepEqual(welcomePalette(-1), welcomePalette(0));
  assert.deepEqual(welcomePalette(2), welcomePalette(1));
  for (let i = 0; i <= 1000; i++) {
    const palette = welcomePalette(i / 1000), bg = luminance(palette.background);
    assert.equal(palette.color, '#ece7dc');
    assert.ok(bg < .15);
    assert.ok((luminance([236, 231, 220]) + .05) / (bg + .05) >= 4.5);
  }
  const css = read('eportfolio/scroll.css');
  assert.match(css, /text-align: center; border: 0/);
  assert.match(css, /max-width: 48ch/);
  assert.match(css, /\.hero::after/);
  assert.match(css, /--welcome-blend: linear-gradient/);
  assert.match(css, /linear-gradient\(120deg, #13201b, #132c23 55%, #183744\)/);
  assert.doesNotMatch(css, /#492b23/);
  assert.match(read('eportfolio/scroll.js'), /welcomePalette\(p\)/);
});
