import { pipelineModes } from '../../lab/pipeline.js';
import { createRenderer } from '../../lab/renderer.js';
import { createScrollScheduler, clamp, progress } from '../../eportfolio/scroll-scheduler.js';
import { inkWords, paintInk, advanceMarquee, marqueeTransform, paintStack, paintTimeline } from '../../eportfolio/scroll-effects.js';

export { clamp, progress };
export const tones = [[236, 231, 220], [19, 44, 35], [24, 55, 68], [73, 43, 35]];
export function paletteInk(a, b, t) {
  const rgb = tones[a].map((value, i) => value * (1 - t) + tones[b][i] * t);
  const luminance = values => values.map(value => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const bg = luminance(rgb), dark = 0, light = 1;
  return (bg + .05) / (dark + .05) >= (light + .05) / (bg + .05) ? 'dark' : 'light';
}

if (typeof document !== 'undefined') {
  const root = document.documentElement;
  const sections = [...document.querySelectorAll('.experiment')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 719px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const active = new Set();
  const ink = document.querySelector('.ink-copy');
  const words = inkWords(ink);
  const lines = [...document.querySelectorAll('.rise-line')];
  const cards = [...document.querySelectorAll('.career-card')];
  const track = document.querySelector('.gallery-track');
  const gallery = document.querySelector('.gallery-window');
  const expansions = [...document.querySelectorAll('.expansion-section')];
  const marquee = [...document.querySelectorAll('.marquee-row')];
  const marqueeToggle = document.querySelector('.marquee-toggle');
  const path = document.querySelector('.timeline-draw');
  const milestones = [...document.querySelectorAll('.timeline li')];
  const splitTitles = document.querySelector('.split-titles');
  const splitImages = document.querySelector('.split-images');
  const counters = [...document.querySelectorAll('.counter-value')];
  const layers = [...document.querySelectorAll('.lake-layer, .mist-layer, .name-layer')];
  const spotlight = document.querySelector('.spotlight-track');
  const stages = [...document.querySelectorAll('.spotlight-stage')];
  const stageLabels = [...document.querySelectorAll('.spotlight-progress li')];
  const renderers = [];
  const chessBoard = document.querySelector('#F15 .chessBoard');
  const chessTemplates = [...document.querySelectorAll('.chess-scroll-frame')];
  const chessMoves = [...document.querySelectorAll('.chess-scroll-moves li')];
  const chessCaption = document.querySelector('.chess-scroll-caption');
  const spyLine = document.querySelector('.spy-line');
  const spyMarkers = [...document.querySelectorAll('.spy-marker')];
  const spyStatus = document.querySelector('.spy-current');
  let currentPly = chessTemplates.length - 1;
  let timelineTop = 0, timelineHeight = 0, counterTops = [], marqueeWidths = [];
  let lastScroll = null, velocity = 0, marqueePhase = 0, marqueePaused = false;
  const palette = [...document.querySelectorAll('.palette > div')];
  const rail = [...document.querySelectorAll('.feature-rail a')];
  const preview = document.querySelector('.cursor-preview');
  const previewImage = preview.querySelector('img');
  let geometry = [], lineTops = [], cardTops = [], travel = 0, height = innerHeight, width = innerWidth, headerHeight = 0;
  let lastTime = 0, current = '';
  let previewLink = null, pointer = null, position = { x: 0, y: 0 }, target = { x: 0, y: 0 }, previewOpacity = 0;

  const scheduler = createScrollScheduler(render, { measure });
  function schedule() { scheduler.schedule(); }

  function measure() {
    width = innerWidth;
    height = innerHeight;
    headerHeight = document.querySelector('.eportfolio-header').offsetHeight;
    document.body.style.setProperty('--header-height', `${headerHeight}px`);
    const style = getComputedStyle(gallery);
    travel = Math.max(0, track.scrollWidth - gallery.clientWidth + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight));
    document.querySelector('#F04').style.setProperty('--gallery-travel', `${travel}px`);
    const rects = sections.map(section => section.getBoundingClientRect());
    const scroll = window.scrollY;
    geometry = sections.map((section, index) => {
      const rect = rects[index];
      return { top: rect.top + scroll, height: section.offsetHeight, tone: Number(section.dataset.palette) };
    });
    lineTops = lines.map(line => line.parentElement.getBoundingClientRect().top + scroll);
    const stack = document.querySelector('.career-stack');
    let top = stack.getBoundingClientRect().top + scroll;
    const gap = parseFloat(getComputedStyle(stack).rowGap);
    cardTops = cards.map(card => {
      const naturalTop = top;
      top += card.offsetHeight + gap;
      return naturalTop;
    });
    const timeline = document.querySelector('.timeline svg');
    timelineTop = timeline.getBoundingClientRect().top + scroll;
    timelineHeight = timeline.getBoundingClientRect().height;
    counterTops = counters.map(counter => counter.getBoundingClientRect().top + scroll);
    marqueeWidths = marquee.map(row => row.scrollWidth / 2);
    return scroll;
  }

  function resetEffects() {
    [...words, ...lines, ...cards, track, ...expansions.flatMap(section => [section.querySelector('.expand-mask'), section.querySelector('figcaption')]), ...marquee, splitTitles, splitImages, ...layers, spotlight].forEach(element => {
      element.style.removeProperty('transform');
      element.style.removeProperty('opacity');
    });
    counters.forEach(counter => { counter.textContent = counter.dataset.count; });
    path.style.strokeDashoffset = 0;
    milestones.forEach(milestone => milestone.classList.add('milestone-lit'));
    renderers.splice(0).forEach(renderer => renderer.destroy());
    stages.forEach(stage => { stage.querySelector('canvas')?.remove(); stage.classList.remove('is-live'); });
    velocity = 0; lastScroll = null;
    paintChess(chessTemplates.length - 1);
    spyLine.style.strokeDashoffset = 0;
    spyMarkers.forEach(marker => { marker.style.opacity = 1; });
    spyStatus.textContent = 'All sandbox fills shown.';
  }

  function paintChess(ply) {
    if (ply === currentPly) return;
    currentPly = ply;
    const frame = chessTemplates[ply];
    chessBoard.replaceChildren(frame.content.cloneNode(true));
    chessBoard.dataset.fen = frame.dataset.fen;
    chessBoard.dataset.ply = ply;
    chessCaption.textContent = frame.dataset.caption;
    chessMoves.forEach((move, index) => index + 1 === ply ? move.setAttribute('aria-current', 'step') : move.removeAttribute('aria-current'));
  }

  function paintPalette(scroll) {
    const focus = scroll + height / 2;
    let index = geometry.findIndex(item => focus >= item.top && focus <= item.top + item.height);
    if (index < 0) index = focus < geometry[0].top ? 0 : geometry.length - 1;
    const id = sections[index].id;
    if (id !== current) {
      current = id;
      rail.forEach(link => link.hash === `#${id}` ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
    }
    let next = index;
    let t = 0;
    if (!reduced.matches) {
      const center = geometry[index].top + geometry[index].height / 2;
      if (focus >= center && index < geometry.length - 1) {
        next = index + 1;
        t = progress(focus, center, geometry[next].top + geometry[next].height / 2 - center);
      } else if (focus < center && index > 0) {
        next = index - 1;
        t = progress(center - focus, 0, center - geometry[next].top - geometry[next].height / 2);
      }
    }
    const a = geometry[index].tone, b = geometry[next].tone;
    const lower = Math.min(a, b), upper = Math.max(a, b);
    palette.forEach((layer, tone) => {
      let opacity = tone === 0 || tone === lower ? 1 : 0;
      if (tone === upper) opacity = a === b ? 1 : a < b ? t : 1 - t;
      layer.style.opacity = opacity;
    });
    document.body.dataset.ink = paletteInk(a, b, t);
  }

  function render(time, scroll) {
    const dt = Math.min(64, Math.max(1, time - (lastTime || time - 16)));
    const instantaneous = lastScroll === null ? 0 : Math.max(-1, Math.min(1, (scroll - lastScroll) / dt / 3));
    velocity += (instantaneous - velocity) * (1 - Math.exp(-dt / 110));
    lastScroll = scroll;
    paintPalette(scroll);
    if (!reduced.matches) {
      if (active.has(sections[0])) {
        const g = geometry[0];
        const p = progress(scroll, g.top, g.height - height);
        paintInk(words, p);
      }
      if (active.has(sections[1])) lines.forEach((line, index) => {
        const p = progress(scroll + height * .86, lineTops[index], height * .3);
        line.style.transform = `translateY(${(1 - p) * 110}%)`;
        line.style.opacity = p;
      });
      if (!narrow.matches && active.has(sections[3])) {
        const g = geometry[3];
        track.style.transform = `translateX(${-travel * progress(scroll, g.top, g.height - height)}px)`;
      }
      if (active.has(sections[4])) cards.forEach((card, index) => {
        const next = cardTops[index + 1];
        const p = next === undefined ? 0 : progress(scroll + headerHeight + 100, next, height * .3);
        paintStack(card, p);
      });
      expansions.forEach(section => {
        if (!active.has(section)) return;
        const g = geometry[sections.indexOf(section)];
        const p = progress(scroll, g.top, g.height - height);
        const mask = section.querySelector('.expand-mask'), caption = section.querySelector('figcaption');
        mask.style.transform = `scale(${.64 + .48 * p})`;
        caption.style.opacity = progress(p, .32, .4);
        caption.style.transform = `translateY(${(1 - p) * 22}px)`;
      });
      if (active.has(sections[7]) && !marqueePaused && !document.hidden) {
        marqueePhase = advanceMarquee(marqueePhase, dt, velocity);
        marquee.forEach((row, i) => {
          row.style.transform = marqueeTransform(marqueePhase, marqueeWidths[i] || 1, i, velocity);
        });
      }
      if (active.has(sections[8])) {
        const p = progress(scroll + height * .65, timelineTop, timelineHeight);
        paintTimeline(path, milestones, p);
      }
      if (!narrow.matches && active.has(sections[9])) {
        const g = geometry[9], p = progress(scroll, g.top, g.height - height), distance = 360 * 4;
        splitTitles.style.transform = `translateY(${-p * distance}px)`;
        splitImages.style.transform = `translateY(${(p - 1) * distance}px)`;
      }
      if (active.has(sections[10])) counters.forEach((counter, i) => {
        counter.textContent = Math.round(Number(counter.dataset.count) * progress(scroll + height * .9, counterTops[i], height * .35));
      });
      if (active.has(sections[11])) {
        const g = geometry[11], p = progress(scroll + height, g.top, g.height + height) - .5;
        layers.forEach((layer, i) => { layer.style.transform = `translateY(${p * [42, -60, 24][i]}px)`; });
      }
      if (active.has(sections[13])) {
        if (!renderers.length) stages.forEach((stage, i) => {
          const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); stage.append(canvas);
          if (!canvas.getContext('2d')) { canvas.remove(); return; }
          try {
            renderers.push(createRenderer(canvas, { ...pipelineModes[i], rotate: false, drag: false, ndc: pipelineModes[i].clip, scale: .46 }));
            stage.classList.add('is-live');
          } catch { canvas.remove(); }
        });
        const g = geometry[13], p = progress(scroll, g.top, g.height - height), index = Math.round(p * 4);
        spotlight.style.transform = `translateX(${-p * 400}%)`;
        stageLabels.forEach((label, i) => i === index ? label.setAttribute('aria-current', 'step') : label.removeAttribute('aria-current'));
      }
      if (active.has(sections[14])) {
        const g = geometry[14], p = progress(scroll, g.top, g.height - height);
        paintChess(Math.round(p * (chessTemplates.length - 1)));
      }
      if (active.has(sections[15])) {
        const g = geometry[15], p = progress(scroll, g.top, g.height - height);
        spyLine.style.strokeDashoffset = 1 - p;
        let latest = null;
        spyMarkers.forEach(marker => {
          const reached = p >= Number(marker.dataset.progress);
          marker.style.opacity = reached ? 1 : 0;
          if (reached) latest = marker;
        });
        spyStatus.textContent = p === 1 ? 'All sandbox fills shown.' : latest ? `${latest.dataset.side === 'buy' ? 'Buy' : 'Sell'} · ${latest.dataset.date} · sandbox fill` : 'No sandbox fills reached yet.';
      }
    }
    const show = previewLink && fine.matches && !narrow.matches && !reduced.matches;
    const ease = 1 - Math.exp(-Math.min(64, time - (lastTime || time - 16)) / 75);
    if (show) {
      const previewWidth = Math.min(360, width * .35);
      target = pointer ? { x: Math.min(width - previewWidth - 20, Math.max(20, pointer.x + 26)), y: Math.min(height - 260, Math.max(90, pointer.y - 110)) } : { x: width - previewWidth - 95, y: Math.max(100, height / 2 - 110) };
      position.x += (target.x - position.x) * ease;
      position.y += (target.y - position.y) * ease;
    }
    previewOpacity += ((show ? 1 : 0) - previewOpacity) * ease;
    if (previewOpacity < .001) previewOpacity = 0;
    preview.style.opacity = previewOpacity;
    preview.style.transform = `translate(${position.x}px, ${position.y}px)`;
    lastTime = time;
    if ((show && (Math.abs(target.x - position.x) + Math.abs(target.y - position.y) > .1 || previewOpacity < .999)) || (!show && previewOpacity)) schedule();
    if (!reduced.matches && !marqueePaused && !document.hidden && active.has(sections[7])) schedule();
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target));
    schedule();
  }, { rootMargin: '50% 0px 50% 0px' });
  sections.forEach(section => observer.observe(section));
  function resize() { scheduler.resize(); }
  function preferenceChange() { resetEffects(); previewLink = null; resize(); }
  marqueeToggle.hidden = false;
  marqueeToggle.addEventListener('click', () => {
    marqueePaused = !marqueePaused;
    marqueeToggle.setAttribute('aria-pressed', String(marqueePaused));
    marqueeToggle.textContent = marqueePaused ? 'Resume marquee' : 'Pause marquee';
    schedule();
  });
  document.addEventListener('visibilitychange', () => { lastScroll = null; lastTime = 0; schedule(); });
  window.addEventListener('pagehide', event => { if (!event.persisted) renderers.splice(0).forEach(renderer => renderer.destroy()); });
  reduced.addEventListener('change', preferenceChange);
  narrow.addEventListener('change', preferenceChange);
  fine.addEventListener('change', preferenceChange);
  document.fonts.ready.then(resize);
  document.querySelectorAll('img').forEach(image => image.addEventListener('load', resize, { once: true }));
  document.querySelectorAll('.preview-link').forEach(link => {
    function show(event) {
      if (!link.dataset.preview) { previewLink = null; schedule(); return; }
      previewLink = link;
      previewImage.src = link.dataset.preview;
      pointer = event.type === 'focus' ? null : { x: event.clientX, y: event.clientY };
      if (!previewOpacity) position = { x: width / 2, y: height / 2 };
      schedule();
    }
    function hide() { previewLink = null; schedule(); }
    link.addEventListener('pointerenter', show);
    link.addEventListener('pointermove', event => { pointer = { x: event.clientX, y: event.clientY }; schedule(); });
    link.addEventListener('pointerleave', () => { if (document.activeElement !== link) hide(); });
    link.addEventListener('focus', show);
    link.addEventListener('blur', hide);
  });
  track.querySelectorAll('a').forEach(link => link.addEventListener('focus', () => {
    if (narrow.matches || reduced.matches) return;
    const card = link.closest('.project-card');
    const rect = card.getBoundingClientRect();
    if (rect.left < 0 || rect.right > width) {
      const offset = Math.min(travel, card.offsetLeft - track.offsetLeft);
      window.scrollTo({ top: geometry[3].top + offset, behavior: 'instant' });
    }
  }));
  splitImages.querySelectorAll('a').forEach((link, index) => link.addEventListener('focus', () => {
    if (narrow.matches || reduced.matches) return;
    const g = geometry[9];
    window.scrollTo({ top: g.top + index / 4 * (g.height - height), behavior: 'instant' });
  }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { previewLink = null; schedule(); } });
  root.classList.add('enhanced');
  schedule();
}
