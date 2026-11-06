import { scrollState } from './math.js';
import { createWater } from './water.js';

export function mountLake() {
  const hero = document.querySelector('#top'), scene = document.querySelector('.envScene');
  const image = document.querySelector('#lakeImage'), veil = document.querySelector('.veil');
  const copy = hero.querySelector('.heroCopy'), cue = hero.querySelector('.scrollLine'), scrollCue = hero.querySelector('.scrollCue');
  const words = [...hero.querySelectorAll('.heroWord')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let water = null, raf = 0, height = hero.offsetHeight, aboutTop = 0, visible = true, stopped = false;
  let lastY = scrollY, lastTime = performance.now(), index = 0, timer = 0, due = 0, remaining = 2600, next;
  const letters = words.map(word => {
    const spans = [...word.textContent].map(char => {
      const span = document.createElement('span'); span.className = 'heroChar'; span.textContent = char; return span;
    });
    word.replaceChildren(...spans); return spans;
  });
  function schedule(callback, delay) { next = callback; remaining = delay; resume(); }
  function resume() {
    if (timer || !next || !visible || document.hidden || reduced.matches || stopped) return;
    due = performance.now() + remaining;
    timer = setTimeout(() => { timer = 0; next(); }, remaining);
  }
  function pause() { if (timer) { clearTimeout(timer); timer = 0; remaining = Math.max(0, due - performance.now()); } }
  function enter() {
    words[index].classList.add('is-active');
    const chars = letters[index]; let i = 0;
    chars.forEach(char => char.style.opacity = '0');
    const step = () => { chars[i++].style.opacity = '1'; if (i < chars.length) schedule(step, 40); else schedule(leave, 2720); };
    schedule(step, 40);
  }
  function leave() {
    const order = [...letters[index]];
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let i = 0;
    const step = () => {
      order[i++].style.opacity = '0';
      if (i < order.length) schedule(step, 40);
      else schedule(() => { words[index].classList.remove('is-active'); index = (index + 1) % words.length; enter(); }, 370);
    };
    step();
  }
  function visibility() {
    if (!visible || document.hidden) pause(); else resume();
    cue.style.animationPlayState = visible && !document.hidden ? 'running' : 'paused';
  }
  const heroObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visibility(); });
  heroObserver.observe(hero);
  const navMarker = document.createElement('span');
  navMarker.style.cssText = 'position:absolute;top:22%;left:0;width:1px;height:1px;pointer-events:none';
  hero.append(navMarker);
  const navObserver = new IntersectionObserver(entries => {
    document.querySelector('#nav').classList.toggle('over-veil', entries[0].boundingClientRect.top < 64);
  }, { rootMargin: '-64px 0px 0px' });
  navObserver.observe(navMarker);
  function update(now) {
    raf = 0;
    if (stopped) return;
    const y = scrollY, state = scrollState(y, height, aboutTop);
    const velocity = (y - lastY) / Math.max(.016, (now - lastTime) / 1000);
    lastY = y; lastTime = now;
    scene.style.transform = reduced.matches ? '' : `translateY(${state.lift}px) scale(${state.scale})`;
    copy.style.opacity = String(state.opacity);
    copy.style.transform = reduced.matches ? '' : `translateY(${-Math.min(y / (height * .55), 1) * height * .06}px)`;
    scrollCue.style.opacity = String(state.opacity);
    scrollCue.style.transform = reduced.matches ? '' : copy.style.transform;
    scrollCue.style.visibility = state.opacity === 0 ? 'hidden' : '';
    veil.style.opacity = String(state.veil);
    water?.update(state.veil, velocity);
  }
  function scroll() { if (!raf && !stopped) raf = requestAnimationFrame(update); }
  function resize() { height = hero.offsetHeight; aboutTop = document.querySelector('#about').offsetTop; scroll(); }
  function preference() {
    pause(); water?.destroy(); water = null;
    words.forEach((word, i) => word.classList.toggle('is-active', i === 0));
    letters.flat().forEach(char => char.style.opacity = '1'); index = 0;
    if (!reduced.matches) { water = createWater(scene, image); schedule(leave, 2600); }
    scroll();
  }
  function pagehide(event) {
    if (event.persisted) return;
    stopped = true; pause(); cancelAnimationFrame(raf); water?.destroy(); heroObserver.disconnect(); navObserver.disconnect(); navMarker.remove();
    removeEventListener('scroll', scroll); removeEventListener('resize', resize); removeEventListener('pageshow', scroll);
    document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', preference); removeEventListener('pagehide', pagehide);
  }
  addEventListener('scroll', scroll, { passive: true }); addEventListener('resize', resize);
  addEventListener('pageshow', scroll); addEventListener('pagehide', pagehide);
  document.addEventListener('visibilitychange', visibility); reduced.addEventListener('change', preference);
  resize(); preference();
}
