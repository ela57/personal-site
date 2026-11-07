import { scrollState } from './math.js';
import { createWater } from './water.js';

export function mountLake() {
  const hero = document.querySelector('#top'), scene = document.querySelector('.envScene');
  const image = document.querySelector('#lakeImage'), veil = document.querySelector('.veil');
  const copy = hero.querySelector('.heroCopy'), cue = hero.querySelector('.scrollLine'), scrollCue = hero.querySelector('.scrollCue');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let water = null, raf = 0, height = hero.offsetHeight, aboutTop = 0, visible = true, stopped = false;
  let lastY = scrollY, lastTime = performance.now();
  function visibility() {
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
    water?.destroy(); water = null;
    if (!reduced.matches) water = createWater(scene, image);
    scroll();
  }
  function pagehide(event) {
    if (event.persisted) return;
    stopped = true; cancelAnimationFrame(raf); water?.destroy(); heroObserver.disconnect(); navObserver.disconnect(); navMarker.remove();
    removeEventListener('scroll', scroll); removeEventListener('resize', resize); removeEventListener('pageshow', scroll);
    document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', preference); removeEventListener('pagehide', pagehide);
  }
  addEventListener('scroll', scroll, { passive: true }); addEventListener('resize', resize);
  addEventListener('pageshow', scroll); addEventListener('pagehide', pagehide);
  document.addEventListener('visibilitychange', visibility); reduced.addEventListener('change', preference);
  resize(); preference();
}
