import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createScrollScheduler, progress } from '../eportfolio/scroll-scheduler.js';
import { advanceMarquee, marqueeTransform, paintInk, paintStack, paintTimeline } from '../eportfolio/scroll-effects.js';
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
