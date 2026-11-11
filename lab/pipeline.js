export const pipelineModes = [
  { stage: 1, cull: false, sort: false, clip: false, orderLabels: false, solidWireframe: true },
  { stage: 2, cull: true, sort: false, clip: false, orderLabels: false },
  { stage: 2, cull: true, sort: false, clip: true, orderLabels: false },
  { stage: 2, cull: true, sort: true, clip: false, orderLabels: true },
  { stage: 3, cull: true, sort: true, clip: false, orderLabels: false },
];

export function clipDepth(points, near, far) {
  if (!(near < far)) throw new RangeError('Near depth must be less than far depth.');
  let result = points;
  for (const [plane, direction] of [[near, 1], [far, -1]]) {
    const input = result; result = [];
    input.forEach((a, i) => {
      const b = input[(i + 1) % input.length];
      const insideA = (a[2] - plane) * direction >= 0, insideB = (b[2] - plane) * direction >= 0;
      if (insideA) result.push(a);
      if (insideA !== insideB) {
        const t = (plane - a[2]) / (b[2] - a[2]);
        result.push(a.map((value, j) => value + (b[j] - value) * t));
      }
    });
  }
  return result;
}

export function pipelineStepIndex(tops, focusLine) {
  if (!tops.length) return -1;
  let index = 0;
  tops.forEach((top, i) => { if (top <= focusLine) index = i; });
  return index;
}

export function mountPipeline(createRenderer, root = document, scrollRoot = null) {
  const section = root.querySelector('.pipeline');
  if (!section) return () => {};
  const steps = [...section.querySelectorAll('.pipelineSteps li')];
  const stack = section.querySelector('.pipelineCanvasStack'), caption = section.querySelector('.pipelineCaption');
  if (!steps.length || !stack || !caption) return () => {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderers = [], canvases = [];
  const initialCaption = caption.textContent, scrollTarget = scrollRoot || window;
  let frame = 0, active = -1;
  const activate = index => {
    if (!canvases.length || index === active) return;
    active = index; canvases.forEach((canvas, i) => canvas.classList.toggle('is-active', index === i));
    steps.forEach((step, i) => step.classList.toggle('is-current', index === i));
    caption.textContent = `${String(index + 1).padStart(2, '0')} / ${steps[index].querySelector('h3').textContent}`;
  };
  const update = () => {
    frame = 0;
    const top = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
    const height = scrollRoot ? scrollRoot.clientHeight : innerHeight;
    activate(pipelineStepIndex(steps.map(step => step.getBoundingClientRect().top), top + height * .55));
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const reset = () => {
    renderers.splice(0).forEach(renderer => renderer.destroy());
    canvases.length = 0; stack.replaceChildren(); section.classList.remove('is-enhanced'); active = -1;
    steps.forEach(step => step.classList.remove('is-current'));
    caption.textContent = initialCaption;
  };
  const preference = () => {
    reset();
    if (reduced.matches) return;
    section.classList.add('is-enhanced');
    pipelineModes.forEach(mode => {
      const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
      stack.append(canvas); canvases.push(canvas);
      renderers.push(createRenderer(canvas, { ...mode, rotate: false, drag: false, ndc: mode.clip, scale: .46 }));
    });
    activate(0);
    schedule();
  };
  const focusHandlers = steps.map((step, index) => {
    const focus = () => activate(index);
    step.addEventListener('focusin', focus);
    return focus;
  });
  const resize = new ResizeObserver(schedule); resize.observe(section);
  scrollTarget.addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  preference(); reduced.addEventListener('change', preference);
  const cleanup = event => {
    if (event?.persisted) return;
    cancelAnimationFrame(frame); frame = 0;
    resize.disconnect(); reset();
    steps.forEach((step, index) => step.removeEventListener('focusin', focusHandlers[index]));
    scrollTarget.removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
    reduced.removeEventListener('change', preference); removeEventListener('pagehide', cleanup);
  };
  addEventListener('pagehide', cleanup);
  return cleanup;
}
