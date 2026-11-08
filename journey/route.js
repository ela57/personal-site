import { CatmullRomCurve3, Vector3 } from '../vendor/three.module.min.js';

const definitions = [
  ['entrance', 'Lakeside entrance', [0, 3.2, 24], [-24, 2, -16], 0],
  ['observatory', 'Observatory', [-15, 3.2, -29], [-5, 3, -22], 4],
  ['archive', 'Archive', [-9, 3.2, -54], [7, 3, -67], 6],
  ['workshop', 'Workshop', [28, 3.2, -90], [23, 3, -108], 10],
  ['clearing', 'Clearing', [10, 3.2, -136], [2, 2.8, -146], 12],
  ['overlook', 'Overlook', [-1, 3.2, -170], [-18, 3, -185], 14]
];
const points = [
  [0, 3.2, 24], [-6, 3.2, 7], [-15, 3.2, -9], [-21, 3.2, -20],
  [-15, 3.2, -29], [-15, 3.2, -43], [-9, 3.2, -54], [4, 3.2, -72],
  [6, 3.2, -90], [17, 3.2, -90], [28, 3.2, -90], [24, 3.2, -117],
  [10, 3.2, -136], [5, 3.2, -153], [-1, 3.2, -170]
];
export const route = new CatmullRomCurve3(points.map(p => new Vector3(...p)), false, 'centripetal');
const stations = definitions.map(([id, name, position, lookTarget, node]) => ({
  id, name, position, lookTarget, routeT: node / (points.length - 1)
}));
export const DWELL = 0.38;
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const ease = t => t * t * (3 - 2 * t);
export function getStations() {
  return stations.map(s => ({ ...s, position: [...s.position], lookTarget: [...s.lookTarget] }));
}
export function progressForStation(id) {
  const index = stations.findIndex(s => s.id === id);
  if (index < 0) throw new RangeError(`Unknown journey station: ${id}`);
  return (index + DWELL / 2) / stations.length;
}
export function poseAtProgress(value) {
  const progress = clamp(Number.isFinite(value) ? value : 0, 0, 1);
  const cell = progress * stations.length;
  const index = Math.min(stations.length - 1, Math.floor(cell));
  const from = stations[index], to = stations[Math.min(index + 1, stations.length - 1)];
  const travel = ease(clamp((cell - index - DWELL) / (1 - DWELL), 0, 1));
  const t = from.routeT + (to.routeT - from.routeT) * travel;
  const position = route.getPoint(t);
  let target = new Vector3(...from.lookTarget).lerp(new Vector3(...to.lookTarget), travel);
  // Hold the dome in view while the entrance-to-observatory path arcs around it.
  if (index === 0 && t > 1.7 / 14) {
    const blend = ease(clamp((t - 1.7 / 14) / (0.8 / 14), 0, 1));
    target.lerp(new Vector3(-5, 3, -22), blend);
  }
  const delta = target.sub(position);
  const yaw = Math.atan2(-delta.x, -delta.z);
  const pitch = clamp(Math.atan2(delta.y, Math.hypot(delta.x, delta.z)), -Math.PI / 22.5, Math.PI / 22.5);
  return { position, yaw, pitch, station: from.id, progress, travel, routeT: t };
}

export function dampAngle(current, target, dt, rate = 9, maxSpeed = 0.65) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + clamp(delta * (1 - Math.exp(-rate * dt)), -maxSpeed * dt, maxSpeed * dt);
}
