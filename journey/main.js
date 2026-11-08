import * as THREE from '../vendor/three.module.min.js';
import { getStations, progressForStation, poseAtProgress, dampAngle, clamp } from './route.js';
import { createWorld } from './world.js';

export { getStations, progressForStation } from './route.js';
const changes = new EventTarget();
export function onStationChange(listener) {
  const handler = event => listener(event.detail);
  changes.addEventListener('stationchange', handler);
  return () => changes.removeEventListener('stationchange', handler);
}
const debug = new URLSearchParams(location.search).has('debug');
const hud = document.querySelector('#debug');
hud.hidden = !debug;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let staticView = reduced.matches;
let renderer, world, raf = 0, lastTime = 0, currentStation = '', frames = 0;
let frameIntervals = [], previousFrame = 0;
let wanted = poseAtProgress(0);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.15, 1800);
camera.rotation.order = 'YXZ';
camera.position.copy(wanted.position); camera.rotation.set(wanted.pitch, wanted.yaw, 0);
const fallback = document.querySelector('#fallback');
const motion = document.querySelector('#motion');
const links = [...document.querySelectorAll('.stations a')];
const diagnostics = { frames: 0, settled: false, fps: 0, assetFailures: [], progress: 0, pixelRatio: 1 };
function progress() { return clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1); }
function showFallback(message) {
  staticView = true;
  cancelAnimationFrame(raf); raf = 0;
  fallback.hidden = false;
  fallback.firstChild.textContent = `${message} `;
  document.querySelector('#world').hidden = true;
  motion.hidden = true;
}
function updateStation() {
  wanted = poseAtProgress(progress()); diagnostics.progress = wanted.progress;
  if (wanted.station !== currentStation) {
    currentStation = wanted.station;
    const station = getStations().find(s => s.id === currentStation);
    document.querySelector('#station-title').textContent = station.name;
    links.forEach(link => {
      if (link.hash === `#${station.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    changes.dispatchEvent(new CustomEvent('stationchange', { detail: station }));
    window.dispatchEvent(new CustomEvent('journey:stationchange', { detail: station }));
  }
}
function wake() {
  if (!renderer || !world || document.hidden || raf || staticView) return;
  diagnostics.settled = false;
  raf = requestAnimationFrame(render);
}
function render(now) {
  raf = 0;
  if (document.hidden || staticView) return;
  const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
  lastTime = now;
  const amount = 1 - Math.exp(-9 * dt);
  camera.position.lerp(wanted.position, amount);
  camera.rotation.y = dampAngle(camera.rotation.y, wanted.yaw, dt);
  camera.rotation.x = dampAngle(camera.rotation.x, wanted.pitch, dt, 9, 0.25);
  camera.rotation.z = 0;
  world.update(wanted.progress); renderer.render(world.scene, camera);
  if (previousFrame) {
    frameIntervals.push(now - previousFrame);
    if (frameIntervals.length > 180) frameIntervals.shift();
  }
  previousFrame = now; frames++;
  diagnostics.frames = frames;
  diagnostics.fps = frameIntervals.length ? 1000 / (frameIntervals.reduce((a, b) => a + b, 0) / frameIntervals.length) : 0;
  if (frameIntervals.length >= 45 && frames % 45 === 0 && diagnostics.fps < 28 && renderer.getPixelRatio() > 0.65) {
    renderer.setPixelRatio(Math.max(0.65, renderer.getPixelRatio() * 0.8));
  }
  diagnostics.pixelRatio = renderer.getPixelRatio();
  const angularError = Math.abs(Math.atan2(Math.sin(wanted.yaw - camera.rotation.y), Math.cos(wanted.yaw - camera.rotation.y)));
  const moving = camera.position.distanceTo(wanted.position) > 0.002 || angularError > 0.0002 || Math.abs(camera.rotation.x - wanted.pitch) > 0.0002;
  diagnostics.settled = !moving;
  if (debug) hud.textContent = `${currentStation}\nProgress ${(wanted.progress * 100).toFixed(1)}%\n${diagnostics.fps.toFixed(1)} fps · ${moving ? 'moving' : 'settled'}\n${renderer.info.render.calls} draw calls · DPR ${renderer.getPixelRatio()}`;
  if (moving) wake(); else { lastTime = 0; previousFrame = 0; }
}
function setStatic(value) {
  staticView = value;
  document.querySelector('#world').hidden = value;
  document.querySelector('#view-status').textContent = value ? 'Illustrative simulation · Static view. Use the station links or direct portfolio.' : 'Illustrative simulation · Scroll to follow the shoreline.';
  motion.textContent = value ? 'Use 3D view' : 'Use static view';
  if (value && raf) { cancelAnimationFrame(raf); raf = 0; }
  lastTime = 0;
  if (!value) wake();
}
function goToStation(id) {
  const y = progressForStation(id) * (document.documentElement.scrollHeight - innerHeight);
  scrollTo({ top: y, behavior: 'instant' });
}
links.forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); history.replaceState(null, '', `${location.pathname}${location.search}${link.hash}`); goToStation(link.hash.slice(1));
}));
addEventListener('scroll', () => { updateStation(); wake(); }, { passive: true });
addEventListener('resize', () => {
  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 600 ? 1 : 1.5));
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  updateStation(); wake();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; lastTime = 0; previousFrame = 0; }
  else wake();
});
reduced.addEventListener('change', event => setStatic(event.matches));
motion.addEventListener('click', () => setStatic(!staticView));
updateStation();
try {
  // Probe explicitly so the unavailable-WebGL fallback does not throw in Three.js.
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { antialias: false }) || canvas.getContext('webgl', { antialias: false });
  if (!context) throw new Error('WebGL unavailable');
  renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 600 ? 1 : 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.querySelector('#world').append(canvas);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); cancelAnimationFrame(raf); raf = 0;
    showFallback('The 3D view was interrupted. Static landscape is available.');
  });
  // Defer image requests until the page is visible and the browser is ready.
  const start = () => {
    world = createWorld(renderer, wake);
    world.ready.then(results => {
      diagnostics.assetFailures = results.filter(result => !result.loaded).map(result => result.name);
      if (diagnostics.assetFailures.length) {
        fallback.hidden = false;
        fallback.firstChild.textContent = 'Some forest layers could not load. You can use the direct portfolio. ';
      }
      wake();
    });
    fallback.hidden = true; motion.hidden = false;
    setStatic(staticView);
    if (location.hash && getStations().some(s => `#${s.id}` === location.hash)) goToStation(location.hash.slice(1));
    wake();
  };
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 500 }); else setTimeout(start, 0);
} catch {
  showFallback('WebGL is unavailable. Showing the static landscape.');
}
if (debug) window.journeyDebug = { diagnostics, camera, getStations, progressForStation, goToStation, poseAtProgress };
