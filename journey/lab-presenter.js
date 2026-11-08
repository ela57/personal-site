import { labs, labStages } from '../content/labs.js';
import { escapeHtml as e } from '../content/destinations.js';
import { labHash, stationForLab, excerptLines, exitDistance } from './lab-routing.js';

const names = Object.fromEntries(labStages.map(stage => [stage, stage[0].toUpperCase() + stage.slice(1)]));
const sourceCache = new Map();

export function mountLabPresenter({ onOpen, onClose, onRoute, currentStation }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'lab-dialog'; dialog.id = 'lab-dialog';
  dialog.setAttribute('aria-labelledby', 'lab-title'); dialog.setAttribute('aria-modal', 'true');
  dialog.innerHTML = `<div class="lab-topbar"><div class="lab-heading"><h1 id="lab-title"></h1><span class="classification" data-lab-label></span></div><button type="button" data-exit>Exit <span aria-hidden="true">×</span></button><nav class="lab-stages" aria-label="Lab stages">${labStages.map(stage => `<a data-stage="${stage}">${names[stage]}</a>`).join('')}</nav></div><div class="lab-layout"><section class="lab-copy" tabindex="0" aria-labelledby="lab-stage-title"></section><section class="lab-live" tabindex="0" aria-label="Live system or inspection diagram"></section></div><div class="lab-bottom"><button type="button" data-previous>← Previous stage</button><output data-stage-count aria-live="polite"></output><button type="button" data-next>Next stage →</button></div>`;
  document.body.append(dialog);
  let active = null, opener = null, scroll = 0, saved = null, cleanup = null, controller = null, revision = 0, pendingExit = null;
  const copy = dialog.querySelector('.lab-copy'), live = dialog.querySelector('.lab-live');
  function stateFor(route) {
    let state = history.state?.journeyLab;
    if (!state || state.lab !== route.lab.id) {
      state = { lab: route.lab.id, session: crypto.randomUUID(), origin: `#/at/${stationForLab(route.lab)}`, depth: 0, deep: true };
      history.replaceState({ journeyLab: state }, '', location.href);
    }
    return state;
  }
  function stop() {
    revision++; controller?.abort(); cleanup?.(); cleanup = null;
  }
  function lock() {
    opener = document.activeElement; scroll = scrollY;
    onOpen();
    saved = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.documentElement.style.overflow };
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed'; document.body.style.top = `${-scroll}px`; document.body.style.width = '100%';
    dialog.showModal();
  }
  function close() {
    if (!active) return;
    stop(); active = null; dialog.close();
    Object.assign(document.body.style, { position: saved.position, top: saved.top, width: saved.width });
    document.documentElement.style.overflow = saved.overflow;
    scrollTo({ top: scroll, behavior: 'instant' });
    onClose();
    if (opener?.isConnected && !opener.closest('[inert]')) opener.focus({ preventScroll: true });
    copy.replaceChildren(); live.replaceChildren();
  }
  const paragraphs = values => (values || []).map(text => `<p>${e(text)}</p>`).join('');
  const group = (title, values) => values?.length ? `<section class="lab-prose-group"><h3>${title}</h3>${paragraphs(values)}</section>` : '';
  async function render(route) {
    stop(); const token = revision; controller = new AbortController();
    const signal = controller.signal, { lab, stage: id } = route, stage = lab.stages[id];
    active = route;
    dialog.dataset.lab = lab.id; dialog.dataset.stage = id;
    dialog.querySelector('#lab-title').textContent = lab.title;
    dialog.querySelector('[data-lab-label]').textContent = lab.label;
    for (const link of dialog.querySelectorAll('[data-stage]')) {
      link.href = labHash(lab.id, link.dataset.stage);
      if (link.dataset.stage === id) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
    }
    const index = labStages.indexOf(id);
    dialog.querySelector('[data-previous]').disabled = index === 0;
    dialog.querySelector('[data-next]').disabled = index === labStages.length - 1;
    dialog.querySelector('[data-stage-count]').textContent = `${String(index + 1).padStart(2,'0')} / 05 · ${names[id]}`;
    copy.innerHTML = `<p class="lab-kicker">${names[id]}</p><h2 id="lab-stage-title" tabindex="-1">${e(stage.title)}</h2>${paragraphs(stage.paragraphs)}${group('Problem',stage.problem)}${group('Approach',stage.approach)}${group('Lessons',stage.lessons)}${group('Limitations',stage.limitations)}${group('Potential improvements',stage.improvements)}<div class="lab-excerpts"></div>`;
    live.replaceChildren(); copy.scrollTop = 0; live.scrollTop = 0; dialog.querySelector('.lab-layout').scrollTop = 0;
    if (stage.steps?.length) live.innerHTML = `<h3>Calculation pipeline</h3><ol class="lab-pipeline">${stage.steps.map(step => `<li>${e(step)}</li>`).join('')}</ol>`;
    if (stage.diagram) {
      const image = document.createElement('img'); image.src = `/${stage.diagram.path}`; image.alt = stage.diagram.alt; live.append(image);
    }
    const mount = stage.mount || (id !== 'inspect' ? lab.stages.encounter.mount : null);
    if (mount) {
      const host = document.createElement('div'); host.className = 'lab-system'; host.innerHTML = '<p role="status">Loading live system…</p>'; live.append(host);
      try {
        const module = await import(mount.module);
        if (token !== revision) return;
        const dispose = await module[mount.export](host);
        if (token !== revision) dispose?.(); else cleanup = dispose;
      } catch (error) {
        if (token === revision) host.innerHTML = '<p role="status">The live system could not load. Use another stage or retry this stage.</p><button type="button" data-retry>Retry</button>';
      }
    }
    await Promise.all((stage.excerpts || []).map(async excerpt => {
      const section = document.createElement('section'); section.className = 'lab-excerpt';
      section.innerHTML = `<h3>${e(excerpt.title)}</h3><p><a href="/${e(excerpt.path)}" target="_blank" rel="noopener noreferrer">${e(excerpt.path)} · lines ${excerpt.start}–${excerpt.end}</a></p><p role="status">Loading source…</p>`;
      copy.querySelector('.lab-excerpts').append(section);
      try {
        let source = sourceCache.get(excerpt.path);
        if (source === undefined) {
          const response = await fetch(`/${excerpt.path}`, { signal });
          if (!response.ok) throw new Error('Source unavailable');
          source = await response.text(); sourceCache.set(excerpt.path, source);
        }
        if (token !== revision) return;
        const pre = document.createElement('pre'); pre.tabIndex = 0; pre.setAttribute('aria-label', `${excerpt.path}, lines ${excerpt.start} to ${excerpt.end}`);
        const code = document.createElement('code'); code.textContent = excerptLines(source,excerpt.start,excerpt.end).join('\n'); pre.append(code);
        section.querySelector('[role="status"]').replaceWith(pre);
      } catch {
        if (!signal.aborted && token === revision) section.querySelector('[role="status"]').textContent = 'Source unavailable. Follow the file link or retry this stage.';
      }
    }));
  }
  function changeStage(stage, focus = false) {
    if (!active || active.stage === stage) return;
    const state = stateFor(active);
    history.pushState({ journeyLab: { ...state, depth: state.depth + 1 } }, '', `/${location.search}${labHash(active.lab.id,stage)}`);
    onRoute();
    if (focus) dialog.querySelector(`[data-stage="${stage}"]`).focus();
  }
  function exit() {
    if (!active) return;
    const state = stateFor(active), distance = exitDistance(state);
    if (distance) { if (state.deep) pendingExit = state.origin; history.go(-distance); }
    else { history.replaceState(null,'',`/${location.search}${state.origin}`); onRoute(); }
  }
  dialog.addEventListener('click', event => {
    const stage = event.target.closest('[data-stage]');
    if (stage) { event.preventDefault(); changeStage(stage.dataset.stage); }
    if (event.target.closest('[data-exit]')) exit();
    if (event.target.closest('[data-retry]')) render(active);
    const index = active ? labStages.indexOf(active.stage) : -1;
    if (event.target.closest('[data-next]') && index < 4) changeStage(labStages[index + 1]);
    if (event.target.closest('[data-previous]') && index > 0) changeStage(labStages[index - 1]);
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); exit(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); exit(); return; }
    if (event.target.closest('.lab-stages') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      event.preventDefault(); const index = labStages.indexOf(active.stage);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 4 : Math.max(0,Math.min(4,index+(event.key === 'ArrowRight' ? 1 : -1)));
      changeStage(labStages[next],true);
    }
    if (event.key === 'Tab') {
      const focusables = [...dialog.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length && !el.closest('[hidden]'));
      const first = focusables[0], last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  return {
    get isOpen() { return !!active; },
    open(id) {
      const lab = labs.find(lab => lab.id === id); if (!lab) return;
      const state = { lab: id, session: crypto.randomUUID(), origin: `#/at/${currentStation()}`, depth: 0, deep: false };
      history.pushState({ journeyLab: state }, '', `/${location.search}${labHash(id,'encounter')}`); onRoute();
    },
    sync(route) {
      if (!route) { close(); return; }
      const first = !active; stateFor(route);
      if (first) lock();
      if (first || active.lab.id !== route.lab.id || active.stage !== route.stage) render(route);
      if (first) dialog.querySelector(`[data-stage="${route.stage}"]`).focus();
    },
    finishExit() {
      if (!pendingExit) return;
      history.replaceState(null,'',`/${location.search}${pendingExit}`); pendingExit = null;
    }
  };
}
