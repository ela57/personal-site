export const clamp = value => Math.max(0, Math.min(1, value));
export const progress = (scroll, start, distance) => clamp((scroll - start) / Math.max(.000001, distance));

export function createScrollScheduler(render, { measure = () => window.scrollY, win = window, doc = document } = {}) {
  let frame = 0, dirty = true, suspended = false, destroyed = false;
  const controller = new AbortController();
  const on = (target, event, handler) => target.addEventListener(event, handler, { passive: true, signal: controller.signal });
  function schedule() {
    if (!frame && !suspended && !destroyed && !doc.hidden) frame = win.requestAnimationFrame(tick);
  }
  function tick(time) {
    frame = 0;
    const scroll = dirty ? measure() : win.scrollY;
    dirty = false;
    render(time, scroll);
  }
  function resize() { dirty = true; schedule(); }
  function cancel() { if (frame) win.cancelAnimationFrame(frame); frame = 0; }
  function destroy() { destroyed = true; cancel(); controller.abort(); }
  on(win, 'scroll', schedule);
  on(win, 'resize', resize);
  on(win, 'pageshow', () => { suspended = false; resize(); });
  on(win, 'pagehide', event => { suspended = true; cancel(); if (!event.persisted) destroy(); });
  on(doc, 'visibilitychange', () => doc.hidden ? cancel() : resize());
  return { schedule, resize, destroy };
}
