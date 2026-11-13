import { createScrollScheduler, progress } from './scroll-scheduler.js';
import { inkWords, paintInk, advanceMarquee, marqueeTransform, paintStack, paintTimeline } from './scroll-effects.js';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 900px)');
const ink = [...document.querySelectorAll('[data-scroll-ink]')].map(element => ({ element, words: inkWords(element) }));
const gallery = document.querySelector('[data-scroll-gallery]');
const track = gallery?.querySelector('.portfolio-gallery-track');
const marquee = document.querySelector('[data-scroll-marquee]');
const rows = [...document.querySelectorAll('.portfolio-marquee .marquee-row')];
const toggle = marquee?.querySelector('.marquee-toggle');
const timeline = document.querySelector('[data-scroll-timeline]');
const path = timeline?.querySelector('.timeline-draw');
const milestones = [...document.querySelectorAll('.portfolio-timeline li')];
const stack = document.querySelector('[data-scroll-stack]');
const cards = [...document.querySelectorAll('[data-scroll-stack] > li')];
const active = new Set();
let boxes = new Map(), cardTops = [], widths = [], travel = 0, height = innerHeight, header = 0;
let lastTime = 0, lastScroll = null, velocity = 0, phase = 0, paused = false;
const scheduler = createScrollScheduler(render, { measure });
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target));
  scheduler.schedule();
}, { rootMargin: '50% 0px' });
const targets = [...ink.map(item => item.element), gallery, marquee, timeline, stack].filter(Boolean);
targets.forEach(element => observer.observe(element));

function measure() {
  height = innerHeight;
  header = document.querySelector('.eportfolio-header')?.offsetHeight || 0;
  root.style.setProperty('--scroll-header', `${header}px`);
  gallery?.classList.toggle('gallery-live', desktop.matches && !reduced.matches);
  if (gallery) {
    const window = gallery.querySelector('.portfolio-gallery-window');
    travel = Math.max(0, track.scrollWidth - window.clientWidth);
    gallery.style.setProperty('--gallery-travel', `${travel}px`);
    gallery.style.setProperty('--gallery-height', `${gallery.querySelector('.portfolio-gallery-pin').offsetHeight}px`);
  }
  const rects = targets.map(element => element.getBoundingClientRect());
  const stackRect = stack?.getBoundingClientRect();
  const gap = stack ? parseFloat(getComputedStyle(stack).rowGap) : 0;
  widths = rows.map(row => row.scrollWidth / 2);
  const scroll = window.scrollY;
  boxes = new Map(targets.map((element, i) => [element, { top: rects[i].top + scroll, height: rects[i].height }]));
  let top = stackRect ? stackRect.top + scroll : 0;
  cardTops = cards.map(card => { const natural = top; top += card.offsetHeight + gap; return natural; });
  return scroll;
}

function render(time, scroll) {
  const dt = Math.min(64, Math.max(1, time - (lastTime || time - 16)));
  const instantaneous = lastScroll === null ? 0 : Math.max(-1, Math.min(1, (scroll - lastScroll) / dt / 3));
  velocity += (instantaneous - velocity) * (1 - Math.exp(-dt / 110));
  lastScroll = scroll; lastTime = time;
  if (reduced.matches) return;
  for (const { element, words } of ink) if (active.has(element)) {
    const g = boxes.get(element);
    paintInk(words, progress(scroll + height * .85, g.top, Math.min(height, g.height + height * .2)));
  }
  if (gallery?.classList.contains('gallery-live') && active.has(gallery)) {
    track.style.transform = `translateX(${-travel * progress(scroll, boxes.get(gallery).top - header - 24, travel)}px)`;
  }
  if (timeline && active.has(timeline)) {
    const g = boxes.get(timeline);
    paintTimeline(path, milestones, progress(scroll + height * .65, g.top, g.height));
  }
  if (stack && active.has(stack)) cards.forEach((card, index) => {
    const next = cardTops[index + 1];
    paintStack(card, next === undefined ? 0 : progress(scroll + header + 100, next, height * .3));
  });
  if (marquee && active.has(marquee) && !paused && !document.hidden) {
    phase = advanceMarquee(phase, dt, velocity);
    rows.forEach((row, i) => { row.style.transform = marqueeTransform(phase, widths[i], i, velocity); });
    scheduler.schedule();
  }
}

function preferenceChange() {
  root.classList.toggle('motion-reduced', reduced.matches);
  ink.forEach(({ words }) => words.forEach(word => { word.style.opacity = 1; }));
  [...cards, ...rows, track].filter(Boolean).forEach(element => { element.style.removeProperty('transform'); element.style.removeProperty('opacity'); });
  if (path) paintTimeline(path, milestones, 1);
  if (toggle) {
    toggle.disabled = reduced.matches;
    toggle.setAttribute('aria-pressed', String(paused || reduced.matches));
    toggle.textContent = reduced.matches ? 'Marquee paused (reduced motion)' : paused ? 'Resume marquee' : 'Pause marquee';
  }
  lastScroll = null; lastTime = 0; velocity = 0;
  scheduler.resize();
}
toggle?.addEventListener('click', () => { paused = !paused; preferenceChange(); });
if (toggle) toggle.hidden = false;
gallery?.addEventListener('focusin', event => {
  const card = event.target.closest('.portfolio-gallery-card');
  if (!card || reduced.matches || !desktop.matches) return;
  const rect = card.getBoundingClientRect(), viewport = gallery.querySelector('.portfolio-gallery-window').getBoundingClientRect();
  if (rect.left < viewport.left - 1 || rect.right > viewport.right + 1) {
    const offset = Math.min(travel, card.offsetLeft);
    window.scrollTo({ top: boxes.get(gallery).top - header - 24 + offset, behavior: 'instant' });
    scheduler.schedule();
  }
});
reduced.addEventListener('change', preferenceChange);
desktop.addEventListener('change', preferenceChange);
document.addEventListener('visibilitychange', () => { lastTime = 0; lastScroll = null; });
window.addEventListener('pagehide', event => { if (!event.persisted) observer.disconnect(); });
document.fonts.ready.then(() => scheduler.resize());
document.querySelectorAll('img').forEach(image => image.addEventListener('load', () => scheduler.resize(), { once: true }));
root.classList.add('portfolio-scroll');
preferenceChange();
