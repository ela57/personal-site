export const clamp = value => Math.max(0, Math.min(1, value));
export const progress = (scroll, start, distance) => clamp((scroll - start) / Math.max(.000001, distance));

if (typeof document !== 'undefined') {
  const root = document.documentElement;
  const sections = [...document.querySelectorAll('.experiment')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 719px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const active = new Set();
  const ink = document.querySelector('.ink-copy');
  const words = ink.textContent.trim().split(/\s+/).map(word => {
    const span = document.createElement('span');
    span.className = 'ink-word';
    span.textContent = word;
    return span;
  });
  ink.replaceChildren(...words.flatMap((word, index) => index ? [document.createTextNode(' '), word] : [word]));
  const lines = [...document.querySelectorAll('.rise-line')];
  const cards = [...document.querySelectorAll('.career-card')];
  const track = document.querySelector('.gallery-track');
  const gallery = document.querySelector('.gallery-window');
  const mask = document.querySelector('.expand-mask');
  const caption = document.querySelector('.expansion-pin figcaption');
  const palette = [...document.querySelectorAll('.palette > div')];
  const rail = [...document.querySelectorAll('.feature-rail a')];
  const preview = document.querySelector('.cursor-preview');
  const previewImage = preview.querySelector('img');
  let geometry = [], lineTops = [], cardTops = [], travel = 0, height = innerHeight, width = innerWidth, headerHeight = 0;
  let frame = 0, needsMeasure = true, lastTime = 0, current = '';
  let previewLink = null, pointer = null, position = { x: 0, y: 0 }, target = { x: 0, y: 0 }, previewOpacity = 0;

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function measure(scroll) {
    width = innerWidth;
    height = innerHeight;
    headerHeight = document.querySelector('.eportfolio-header').offsetHeight;
    document.body.style.setProperty('--header-height', `${headerHeight}px`);
    const style = getComputedStyle(gallery);
    travel = Math.max(0, track.scrollWidth - gallery.clientWidth + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight));
    document.querySelector('#F04').style.setProperty('--gallery-travel', `${travel}px`);
    geometry = sections.map(section => {
      const rect = section.getBoundingClientRect();
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
    needsMeasure = false;
  }

  function resetEffects() {
    [...words, ...lines, ...cards, track, mask, caption].forEach(element => {
      element.style.removeProperty('transform');
      element.style.removeProperty('opacity');
    });
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
  }

  function render(time) {
    frame = 0;
    const scroll = window.scrollY;
    if (needsMeasure) measure(scroll);
    paintPalette(scroll);
    if (!reduced.matches) {
      if (active.has(sections[0])) {
        const g = geometry[0];
        const p = progress(scroll, g.top, g.height - height);
        words.forEach((word, index) => { word.style.opacity = .2 + .8 * clamp(p * (words.length + 6) - index); });
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
        card.style.transform = `scale(${1 - p * .045})`;
        card.style.opacity = 1 - p * .16;
      });
      if (active.has(sections[6])) {
        const g = geometry[6];
        const p = progress(scroll, g.top, g.height - height);
        mask.style.transform = `scale(${.64 + .48 * p})`;
        caption.style.opacity = progress(p, .32, .4);
        caption.style.transform = `translateY(${(1 - p) * 22}px)`;
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
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target));
    schedule();
  }, { rootMargin: '50% 0px 50% 0px' });
  sections.forEach(section => observer.observe(section));
  function resize() { needsMeasure = true; schedule(); }
  function preferenceChange() { resetEffects(); previewLink = null; resize(); }
  reduced.addEventListener('change', preferenceChange);
  narrow.addEventListener('change', preferenceChange);
  fine.addEventListener('change', preferenceChange);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize);
  window.addEventListener('pageshow', resize);
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
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { previewLink = null; schedule(); } });
  root.classList.add('enhanced');
  schedule();
}
