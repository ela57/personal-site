import * as THREE from '../vendor/three.module.min.js';
import { getStations, progressForStation, poseAtProgress, dampAngle, clamp } from './route.js';
import { createWorld } from './world.js';
import { createAntialiasing } from './antialias.js';
import { mountPresentation } from './presentation.js';
import { mountLabPresenter } from './lab-presenter.js';
import { parseLabRoute, stationForLab, historyRouteEvents } from './lab-routing.js';
import { mountTour } from './tour.js';

export { getStations, progressForStation } from './route.js';
const changes = new EventTarget();
export function onStationChange(listener) {
  const handler = event => listener(event.detail);
  changes.addEventListener('stationchange', handler);
  return () => changes.removeEventListener('stationchange', handler);
}
const stations = getStations();
const debug = new URLSearchParams(location.search).has('debug');
const hud = document.querySelector('#debug'); hud.hidden = !debug;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const container = document.querySelector('#world');
const fallback = document.querySelector('#fallback');
const motion = document.querySelector('#motion');
const links = [...document.querySelectorAll('[data-station-link]')];
const presentStation = mountPresentation();
const camera = new THREE.PerspectiveCamera(64, 1, .15, 1800);
camera.rotation.order = 'YXZ';
let renderer, antialiasing, world, raf = 0, lastTime = 0, previousFrame = 0, currentStation = '';
let frames = 0, staticView = false, jump = 0;
let labPaused = false, navigationRevision = 0, backgroundComplete;
const backgroundReady = new Promise(resolve => { backgroundComplete = resolve; });
const intervals = [];
let wanted = poseAtProgress(0);
const diagnostics = { frames: 0, settled: true, fps: 0, assetFailures: [], progress: 0, pixelRatio: 1, reduced: reduced.matches };
history.scrollRestoration = 'manual';

function hashStation() {
  const lab = parseLabRoute(location.hash);
  if (lab) return stationForLab(lab.lab);
  const id = location.hash.match(/^#\/at\/([a-z-]+)$/)?.[1] || location.hash.slice(1);
  return stations.some(s => s.id === id) ? id : 'entrance';
}
function hasWorld() { return document.body.classList.contains('has-world'); }
function progress() { return clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1); }
function cut() {
  camera.position.copy(wanted.position); camera.rotation.set(wanted.pitch, wanted.yaw, 0);
}
function activate(id, sync = true) {
  if (id !== currentStation) {
    currentStation = id; presentStation(id);
    const station = stations.find(s => s.id === id);
    links.forEach(link => {
      if (link.dataset.stationLink === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    changes.dispatchEvent(new CustomEvent('stationchange', { detail: station }));
    window.dispatchEvent(new CustomEvent('journey:stationchange', { detail: station }));
  }
  if (sync && !jump && !labPaused && !parseLabRoute(location.hash) && location.hash !== `#/at/${id}`) history.replaceState(null, '', `${location.pathname}${location.search}#/at/${id}`);
}
function updateStation(sync = true) {
  if (hasWorld()) {
    wanted = poseAtProgress(progress());
  } else {
    let id = stations[0].id;
    const threshold = document.querySelector('header').getBoundingClientRect().height + innerHeight * .25;
    for (const station of stations) if (document.getElementById(station.id).getBoundingClientRect().top <= threshold) id = station.id;
    wanted = poseAtProgress(progressForStation(id));
  }
  diagnostics.progress = wanted.progress;
  activate(wanted.station, sync);
  document.querySelector('#progress').value = wanted.progress;
  if (reduced.matches) { wanted = poseAtProgress(progressForStation(currentStation)); cut(); }
}
function cancelJump() { cancelAnimationFrame(jump); jump = 0; }
function goToStation(id, { instant = true, push = false } = {}) {
  if (!stations.some(s => s.id === id)) return;
  cancelJump();
  if (push && location.hash !== `#/at/${id}`) history.pushState(null, '', `${location.pathname}${location.search}#/at/${id}`);
  const y = hasWorld() ? progressForStation(id) * (document.documentElement.scrollHeight - innerHeight)
    : scrollY + document.getElementById(id).getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().height - 12;
  if (instant || reduced.matches || !hasWorld()) {
    scrollTo({ top: y, behavior: 'instant' }); updateStation();
    if (instant || reduced.matches) cut(); wake(); return;
  }
  const from = scrollY, start = performance.now();
  const step = now => {
    const t = clamp((now - start) / 1000, 0, 1), eased = t * t * (3 - 2 * t);
    scrollTo({ top: from + (y - from) * eased, behavior: 'instant' });
    updateStation(false); wake();
    if (t < 1) jump = requestAnimationFrame(step);
    else { jump = 0; updateStation(); wake(); }
  };
  jump = requestAnimationFrame(step);
}
function wake() {
  if (!renderer || !world || document.hidden || raf || staticView || labPaused) return;
  diagnostics.settled = false; raf = requestAnimationFrame(render);
}
function render(now) {
  raf = 0;
  if (document.hidden || staticView || labPaused) return;
  const dt = lastTime ? Math.min(.05, (now - lastTime) / 1000) : 1 / 60;
  lastTime = now;
  if (reduced.matches) cut();
  else {
    camera.position.lerp(wanted.position, 1 - Math.exp(-9 * dt));
    camera.rotation.y = dampAngle(camera.rotation.y, wanted.yaw, dt);
    camera.rotation.x = dampAngle(camera.rotation.x, wanted.pitch, dt, 9, .25);
    camera.rotation.z = 0;
  }
  world.update(wanted.progress, reduced.matches);
  const drawCalls = antialiasing.render(world.scene, camera);
  if (previousFrame) { intervals.push(now - previousFrame); if (intervals.length > 180) intervals.shift(); }
  previousFrame = now; frames++;
  diagnostics.frames = frames;
  diagnostics.fps = intervals.length ? 1000 / (intervals.reduce((a,b) => a+b,0) / intervals.length) : 0;
  if (intervals.length >= 45 && frames % 45 === 0 && diagnostics.fps < 28 && renderer.getPixelRatio() > .65) renderer.setPixelRatio(Math.max(.65, renderer.getPixelRatio() * .8));
  diagnostics.pixelRatio = renderer.getPixelRatio();
  const angularError = Math.abs(Math.atan2(Math.sin(wanted.yaw-camera.rotation.y),Math.cos(wanted.yaw-camera.rotation.y)));
  const moving = !reduced.matches && (camera.position.distanceTo(wanted.position) > .002 || angularError > .0002 || Math.abs(camera.rotation.x-wanted.pitch) > .0002);
  diagnostics.settled = !moving;
  if (debug) hud.textContent = `${currentStation}\nProgress ${(diagnostics.progress*100).toFixed(1)}%\n${diagnostics.fps.toFixed(1)} fps · ${moving?'moving':'settled'}\n${drawCalls} draw calls · DPR ${renderer.getPixelRatio()}`;
  if (moving) wake(); else { lastTime = 0; previousFrame = 0; }
}
function fit() {
  if (labPaused) return;
  document.documentElement.style.setProperty('--header-height', `${document.querySelector('header').getBoundingClientRect().height}px`);
  if (renderer && hasWorld()) {
    const bounds = container.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 600 ? 1 : 1.5));
    renderer.setSize(Math.max(1,bounds.width), Math.max(1,bounds.height));
    const mobile = innerWidth <= 1000;
    const headerHeight = document.querySelector('header').getBoundingClientRect().height;
    const viewHeight = mobile ? Math.max(1, bounds.height * .58 - headerHeight) : bounds.height;
    camera.setViewOffset(bounds.width, viewHeight, mobile ? 0 : -bounds.width * .18, mobile ? -headerHeight : 0, bounds.width, bounds.height);
    camera.updateProjectionMatrix();
  }
  wake();
}
function setStatic(value) {
  const id = currentStation || 'entrance'; cancelJump();
  staticView = value; document.body.classList.toggle('has-world', !value);
  container.hidden = value; fallback.hidden = !value;
  motion.textContent = 'Use static view';
  cancelAnimationFrame(raf); raf = 0; lastTime = 0;
  fit(); goToStation(id);
}
function showFallback(message) {
  setStatic(true); motion.hidden = true;
  fallback.firstChild.textContent = `${message} `;
}
const presenter = mountLabPresenter({
  currentStation: () => currentStation,
  onRoute: syncRoute,
  onOpen() {
    labPaused = true; diagnostics.paused = true; cancelJump();
    cancelAnimationFrame(raf); raf = 0; lastTime = 0; previousFrame = 0;
  },
  onClose() {
    labPaused = false; diagnostics.paused = false; fit(); updateStation(false); wake();
  }
});
async function syncRoute() {
  const token = ++navigationRevision;
  presenter.finishExit();
  const route = parseLabRoute(location.hash);
  if (route) {
    await backgroundReady;
    if (token !== navigationRevision) return;
    if (!presenter.isOpen) {
      if (currentStation !== stationForLab(route.lab)) goToStation(stationForLab(route.lab));
      await new Promise(requestAnimationFrame);
      if (token !== navigationRevision) return;
    }
    presenter.sync(route);
  } else {
    const wasOpen = presenter.isOpen; presenter.sync(null);
    if (!wasOpen || hashStation() !== currentStation) goToStation(hashStation());
  }
}
document.addEventListener('click', event => {
  const link = event.target.closest('[data-lab-link]');
  if (link) { event.preventDefault(); presenter.open(link.dataset.labLink); }
});
links.forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); goToStation(link.dataset.stationLink, { instant: false, push: true });
}));
addEventListener('scroll', () => { if (!labPaused) { updateStation(); wake(); } }, { passive: true });
const routeEvents = historyRouteEvents(syncRoute, () => location.href);
addEventListener('popstate', routeEvents.popstate);
addEventListener('hashchange', routeEvents.hashchange);
addEventListener('resize', () => { if (labPaused) return; const id = currentStation; fit(); goToStation(id); });
for (const type of ['wheel','touchstart']) addEventListener(type, () => { if (jump) { cancelJump(); updateStation(); } }, { passive: true });
addEventListener('keydown', event => {
  if (labPaused) return;
  if (event.target.closest('input,textarea,select,[contenteditable="true"]') || event.ctrlKey || event.metaKey) return;
  const delta = event.key === ']' || (event.altKey && event.key === 'ArrowDown') ? 1 : event.key === '[' || (event.altKey && event.key === 'ArrowUp') ? -1 : 0;
  if (delta) {
    event.preventDefault();
    const index = clamp(stations.findIndex(s => s.id === currentStation) + delta, 0, stations.length - 1);
    goToStation(stations[index].id, { instant: false, push: true });
  } else if (jump && ['PageDown','PageUp',' ','Home','End','ArrowDown','ArrowUp'].includes(event.key)) cancelJump();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; lastTime = 0; previousFrame = 0; }
  else wake();
});
reduced.addEventListener('change', () => { diagnostics.reduced = reduced.matches; cancelJump(); goToStation(currentStation); });
const initial = hashStation(); activate(initial, false);
wanted = poseAtProgress(progressForStation(initial)); cut();
new ResizeObserver(fit).observe(document.querySelector('header'));
try {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { antialias: false }) || canvas.getContext('webgl', { antialias: false });
  if (!context) throw new Error('WebGL unavailable');
  renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  antialiasing = createAntialiasing(renderer); container.append(canvas);
  document.body.classList.add('has-world'); container.hidden = false; fallback.hidden = true; fit(); goToStation(initial);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); showFallback('The 3D view was interrupted. Explore the static destinations or'); });
  const start = () => {
    world = createWorld(renderer, wake);
    world.ready.then(results => {
      diagnostics.assetFailures = results.filter(result => !result.loaded).map(result => result.name);
      if (diagnostics.assetFailures.length) showFallback('Some forest layers could not load. Explore the destinations below or');
      wake();
      backgroundComplete();
    });
    motion.hidden = false; fit(); wake();
  };
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 500 }); else setTimeout(start, 0);
} catch { showFallback('WebGL is unavailable. Explore the static destinations below or'); goToStation(initial); backgroundComplete(); }
syncRoute();
if (new URLSearchParams(location.search).get('tour') === '1') mountTour(document.body,{navigate:goToStation,origin:currentStation});
if (debug) window.journeyDebug = { diagnostics, camera, getStations, progressForStation, goToStation, poseAtProgress };
