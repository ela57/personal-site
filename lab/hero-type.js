export function mountHeroType(hero) {
  if (!hero) return () => {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const letters = [...hero.querySelectorAll(".heroLetter")].map(el => ({
    el, cx: 0, cy: 0, size: 1,
    value: [0, 0, 0], velocity: [0, 0, 0], target: [0, 0, 0]
  }));
  let frame = 0, last = 0, visible = false, entered = false, pointer = null;
  const allowed = () => visible && !document.hidden && !reduced.matches;

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    pointer = null;
    letters.forEach(s => {
      s.value.fill(0); s.velocity.fill(0); s.target.fill(0);
      s.el.style.transform = "";
    });
  }

  function measure() {
    const boxes = letters.map(s => {
      const transform = s.el.style.transform;
      s.el.style.transform = "";
      return transform;
    });
    const bounds = letters.map(s => s.el.getBoundingClientRect());
    letters.forEach((s, i) => {
      const r = bounds[i];
      s.cx = r.left + r.width / 2 + scrollX;
      s.cy = r.top + r.height / 2 + scrollY;
      s.size = parseFloat(getComputedStyle(s.el).fontSize);
      s.el.style.transform = boxes[i];
    });
    pointer = null;
  }

  function tick(time) {
    frame = 0;
    if (!allowed()) { reset(); return; }
    const dt = Math.min((time - (last || time - 16)) / 1000, .032);
    last = time;
    let moving = false;
    letters.forEach(s => {
      const dx = pointer ? (s.cx - pointer.x) / s.size : 0;
      const dy = pointer ? (s.cy - pointer.y) / s.size : 0;
      const distance = Math.hypot(dx, dy);
      const influence = pointer ? Math.max(0, 1 - distance / 1.25) : 0;
      s.target = [dx / (distance || 1) * influence * .075,
        dy / (distance || 1) * influence * .075, influence * .055];
      for (let i = 0; i < 3; i++) {
        s.velocity[i] += (240 * (s.target[i] - s.value[i]) - 25 * s.velocity[i]) * dt;
        s.value[i] += s.velocity[i] * dt;
        if (Math.abs(s.target[i] - s.value[i]) > .00015 || Math.abs(s.velocity[i]) > .001) moving = true;
      }
      const [x, y, stretch] = s.value;
      s.el.style.transform = `translate(${x}em, ${y}em) scale(${1 + stretch}, ${1 - stretch})`;
    });
    if (moving) frame = requestAnimationFrame(tick);
    else {
      last = 0;
      if (!pointer) reset();
    }
  }

  function wake() {
    if (allowed() && !frame) frame = requestAnimationFrame(tick);
  }
  function enter() {
    if (entered || !allowed()) return;
    entered = true;
    if (!fine.matches) {
      letters.forEach((s, i) => { s.value[1] = .045; s.velocity[1] = -.04 * (i + 1); });
      wake();
    }
  }
  hero.addEventListener("pointermove", e => {
    if (!fine.matches || e.pointerType === "touch" || !allowed()) return;
    pointer = { x: e.clientX + scrollX, y: e.clientY + scrollY };
    wake();
  }, options);
  hero.addEventListener("pointerleave", () => { pointer = null; wake(); }, options);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  }, options);
  reduced.addEventListener("change", reset, options);
  fine.addEventListener("change", reset, options);
  const resize = new ResizeObserver(measure);
  resize.observe(hero);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) reset();
    else enter();
  });
  observer.observe(hero);
  document.fonts.ready.then(() => { if (!controller.signal.aborted) measure(); });
  document.fonts.addEventListener("loadingdone", measure, options);
  measure();
  const destroy = () => {
    reset(); controller.abort(); resize.disconnect(); observer.disconnect();
  };
  addEventListener("pagehide", destroy, { ...options, once: true });
  return destroy;
}
