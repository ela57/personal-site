import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { mountPipeline, pipelineStepIndex } from '../lab/pipeline.js';
import { generatedPages } from '../journey/generate.js';

test('pipeline selection follows the reading line in either direction, including jumps and empty stories', () => {
  const tops = [100, 700, 1300, 1900, 2500];
  for (const offset of [0, 600, 1200, 1800, 2400, 1800, 1200, 600, 0, 4000, -1000]) {
    const expected = Math.max(0, Math.min(4, Math.floor((offset + 420) / 600)));
    assert.equal(pipelineStepIndex(tops.map(top => top - offset), 520), expected);
  }
  assert.equal(pipelineStepIndex([], 520), -1);
});

test('missing or incomplete pipeline markup is a safe no-op', () => {
  for (const section of [null, { querySelectorAll: () => [], querySelector: () => null }]) {
    const cleanup = mountPipeline(() => { assert.fail('No renderer should mount'); }, { querySelector: () => section });
    assert.doesNotThrow(cleanup);
  }
});

test('overlay pipeline uses its scroll root, supports preference changes, and cleans up on close', () => {
  const target = () => {
    const listeners = new Map(), classes = new Set();
    return {
      listeners,
      classList: {
        add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name),
        toggle: (name, on) => on ? classes.add(name) : classes.delete(name)
      },
      addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
      removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
      dispatch(name) { listeners.get(name)?.forEach(fn => fn({})); },
      setAttribute() {}
    };
  };
  const steps = Array.from({ length: 5 }, (_, i) => Object.assign(target(), {
    top: 100 + i * 600, getBoundingClientRect() { return { top: this.top }; },
    querySelector: () => ({ textContent: `Stage ${i + 1}` })
  }));
  const stack = { children: [], append(canvas) { this.children.push(canvas); }, replaceChildren() { this.children = []; } };
  const caption = { textContent: 'Initial caption' };
  const section = Object.assign(target(), {
    querySelectorAll: () => steps,
    querySelector: selector => selector === '.pipelineCanvasStack' ? stack : caption
  });
  const scrollRoot = Object.assign(target(), { clientHeight: 800, getBoundingClientRect: () => ({ top: 80 }) });
  const win = target(), media = Object.assign(target(), { matches: false }), frames = new Map();
  let nextFrame = 0, created = 0, destroyed = 0, disconnected = 0;
  const source = readFileSync(new URL('../lab/pipeline.js', import.meta.url), 'utf8');
  const { mountPipeline: mount } = runInNewContext(`${source.replaceAll('export ', '')}\n({ mountPipeline });`, {
    document: { createElement: target }, window: win, innerHeight: 2000,
    matchMedia: () => media,
    requestAnimationFrame: fn => { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { observe() {} disconnect() { disconnected++; } },
    addEventListener: win.addEventListener.bind(win), removeEventListener: win.removeEventListener.bind(win)
  });
  const flush = () => { const work = [...frames.values()]; frames.clear(); work.forEach(fn => fn()); };
  const current = () => steps.findIndex(step => step.classList.contains('is-current'));
  const cleanup = mount(() => { created++; return { destroy() { destroyed++; } }; }, { querySelector: () => section }, scrollRoot);
  flush();
  assert.equal(created, 5);
  assert.equal(stack.children.length, 5);
  assert.equal(current(), 0);
  for (const offset of [1200, 2400, 600, 0]) {
    steps.forEach((step, i) => { step.top = 100 + i * 600 - offset; });
    scrollRoot.dispatch('scroll'); flush();
    assert.equal(current(), offset / 600);
    assert.ok(stack.children[current()].classList.contains('is-active'));
    assert.match(caption.textContent, new RegExp(`Stage ${current() + 1}$`));
  }
  steps[3].dispatch('focusin');
  assert.equal(current(), 3);
  media.matches = true; media.dispatch('change');
  assert.equal(destroyed, 5);
  assert.equal(stack.children.length, 0);
  assert.equal(section.classList.contains('is-enhanced'), false);
  assert.equal(current(), -1);
  steps[1].dispatch('focusin'); assert.equal(current(), -1);
  media.matches = false; media.dispatch('change'); flush();
  assert.equal(created, 10);
  assert.equal(current(), 0);
  scrollRoot.dispatch('scroll'); cleanup();
  assert.equal(frames.size, 0);
  assert.equal(destroyed, 10);
  assert.equal(disconnected, 1);
  for (const el of [scrollRoot, media, win, ...steps]) for (const listeners of el.listeners.values()) assert.equal(listeners.size, 0);
});

test('renderer overlays reuse all five static stages without enhancing the homepage', () => {
  for (const path of ['index.html', 'projects/index.html']) {
    const html = generatedPages[path];
    const story = html.match(/<section class="pipeline"[\s\S]*?<\/section>/)[0];
    const renderer = html.match(/<template id="tpl-renderer">[\s\S]*?<\/template>/)[0];
    assert.ok(renderer.includes(story.replaceAll('pipelineTitle', 'detailPipelineTitle')));
    assert.equal((renderer.match(/<li tabindex="0">/g) || []).length, 5);
    assert.ok(!html.includes('class="pipeline is-enhanced"'));
  }
  const runtime = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  assert.ok(runtime.includes('pipelineCleanup = mountPipeline(createRenderer, content, detail)'));
  assert.ok(runtime.includes('pipelineCleanup?.(); pipelineCleanup = null'));
  assert.ok(runtime.includes('if (!staticPortfolio) mountPipeline(createRenderer)'));
});
