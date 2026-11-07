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

export function mountPipeline(createRenderer, root = document) {
  const section = root.querySelector('.pipeline');
  if (!section) return;
  const steps = [...section.querySelectorAll('.pipelineSteps li')];
  const stack = section.querySelector('.pipelineCanvasStack'), caption = section.querySelector('.pipelineCaption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderers = [], canvases = [];
  let observer = null, active = -1;
  const activate = index => {
    if (index === active) return;
    active = index; canvases.forEach((canvas, i) => canvas.classList.toggle('is-active', index === i));
    steps.forEach((step, i) => step.classList.toggle('is-current', index === i));
    caption.textContent = `${String(index + 1).padStart(2, '0')} / ${steps[index].querySelector('h3').textContent}`;
  };
  const preference = () => {
    observer?.disconnect(); renderers.splice(0).forEach(renderer => renderer.destroy());
    canvases.length = 0; stack.replaceChildren(); section.classList.remove('is-enhanced'); active = -1;
    if (reduced.matches) return;
    section.classList.add('is-enhanced');
    pipelineModes.forEach(mode => {
      const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
      stack.append(canvas); canvases.push(canvas);
      renderers.push(createRenderer(canvas, { ...mode, rotate: false, drag: false, ndc: mode.clip, scale: .46 }));
    });
    activate(0);
    const visible = new Set();
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      const closest = [...visible].sort((a, b) => Math.abs(a.getBoundingClientRect().top - innerHeight * .5) - Math.abs(b.getBoundingClientRect().top - innerHeight * .5))[0];
      if (closest) activate(steps.indexOf(closest));
    }, { rootMargin: '-35% 0px -20% 0px', threshold: 0 });
    steps.forEach(step => observer.observe(step));
  };
  steps.forEach((step, index) => step.addEventListener('focusin', () => activate(index)));
  preference(); reduced.addEventListener('change', preference);
  const cleanup = event => {
    if (event.persisted) return;
    observer?.disconnect(); renderers.forEach(renderer => renderer.destroy()); reduced.removeEventListener('change', preference); removeEventListener('pagehide', cleanup);
  };
  addEventListener('pagehide', cleanup);
}
