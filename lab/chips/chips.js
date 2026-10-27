import { drawScene, staticPile } from "./render.js";

let matterPromise;
function loadMatter() {
  if (!matterPromise) matterPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script"); script.src = new URL("../../vendor/matter.js", import.meta.url).href;
    script.onload = () => resolve(window.Matter); script.onerror = () => reject(new Error("The physics library could not load."));
    document.head.append(script);
  });
  return matterPromise;
}

export function mountChips(section) {
  if (!section) return;
  const canvas = section.querySelector("canvas"), ctx = canvas.getContext("2d");
  const status = section.querySelector("[data-chip-status]"), buttons = [...section.querySelectorAll("button")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController(), opts = { signal: controller.signal };
  let physics = null, loading = false, visible = false, released = false, disposed = false;
  let width = 0, height = 0, raf = 0, last = 0, accumulator = 0, dragging = null, previous = null;
  function draw() { drawScene(ctx, width, height, reduced.matches ? staticPile(width, height) : physics?.chips || []); }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; accumulator = 0; dragging = null; physics?.release(); }
  const active = () => visible && !document.hidden && !reduced.matches && !disposed && physics;
  function frame(time) {
    raf = 0; if (!active()) return;
    accumulator += last ? Math.min(time - last, 50) : 1000 / 60; last = time;
    while (accumulator >= 1000 / 60) { physics.step(1000 / 60); accumulator -= 1000 / 60; }
    draw(); raf = requestAnimationFrame(frame);
  }
  function sync() {
    if (!active()) { stop(); return; }
    if (!released) { physics.wave(); released = true; status.textContent = "Drag a chip, or move the pointer to stir the pile."; }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  async function prepare() {
    if (disposed || reduced.matches || physics || loading) { sync(); return; }
    loading = true;
    try {
      const [Matter, { createPhysics }] = await Promise.all([loadMatter(), import("./physics.js")]);
      if (disposed || reduced.matches) return;
      physics = createPhysics(Matter, canvas, width, height); sync();
    } catch (error) { status.textContent = error.message; }
    finally { loading = false; }
  }
  function resize() {
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); physics?.resize(width, height); draw();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
  const io = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) prepare(); else stop();
  }, { threshold: 0 }); io.observe(canvas);
  function motion() {
    stop();
    buttons.forEach(button => button.disabled = reduced.matches);
    if (reduced.matches) {
      physics?.dispose(); physics = null;
      status.textContent = "Reduced motion: a static arrangement. Physics controls are disabled."; draw();
    } else { released = false; status.textContent = "A small study in collisions and momentum."; if (visible) prepare(); }
  }
  reduced.addEventListener("change", motion, opts); motion();
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else if (visible) prepare(); }, opts);
  section.addEventListener("click", e => {
    const action = e.target.closest("[data-chip-action]")?.dataset.chipAction;
    if (!action || !physics || reduced.matches) return;
    if (action === "reset" || action === "replay") { physics.reset(); status.textContent = "Plate cleared. Release chips to begin again."; }
    if (action === "release" || action === "replay") { physics.wave(); status.textContent = "A fresh wave. Drag a chip to move it."; }
    draw(); sync();
  }, opts);
  const point = e => { const rect = canvas.getBoundingClientRect(); return { x: e.clientX - rect.left, y: e.clientY - rect.top }; };
  canvas.addEventListener("pointerdown", e => {
    if (!active() || e.button !== 0 || !physics.hit(point(e))) return;
    dragging = e.pointerId; physics.pointer(point(e), true); canvas.setPointerCapture(e.pointerId);
  }, opts);
  canvas.addEventListener("touchstart", e => {
    if (active() && physics.hit(point(e.changedTouches[0]))) e.preventDefault();
  }, { ...opts, passive: false });
  canvas.addEventListener("pointermove", e => {
    if (!active()) return;
    const next = point(e);
    if (dragging === e.pointerId) physics.pointer(next);
    else if (["mouse", "pen"].includes(e.pointerType) && previous) physics.disturb(next, next.x - previous.x, next.y - previous.y);
    previous = next;
  }, opts);
  const release = e => { if (dragging !== e.pointerId) return; dragging = null; physics?.release(); if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); };
  canvas.addEventListener("pointerup", release, opts); canvas.addEventListener("pointercancel", release, opts);
  canvas.addEventListener("pointerleave", () => { previous = null; }, opts);
  function cleanup() { disposed = true; stop(); ro.disconnect(); io.disconnect(); controller.abort(); physics?.dispose(); physics = null; }
  addEventListener("pagehide", cleanup, { ...opts, once: true });
  return cleanup;
}
