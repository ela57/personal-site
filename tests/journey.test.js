import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { route, DWELL, getStations, progressForStation, poseAtProgress, dampAngle } from '../journey/route.js';

test('journey stations have unique ids, explicit rest poses and bounded scroll dwell', () => {
  const stations = getStations();
  assert.equal(stations.length, 6);
  assert.equal(new Set(stations.map(s => s.id)).size, 6);
  assert.ok(DWELL >= 0.35 && DWELL <= 0.4);
  stations.forEach((station, i) => {
    const pose = poseAtProgress(progressForStation(station.id));
    assert.ok(pose.position.distanceTo(route.getPoint(station.routeT)) < 1e-10);
    const start = poseAtProgress((i + 0.01) / 6);
    const end = poseAtProgress((i + DWELL - 0.01) / 6);
    assert.deepEqual(start.position, end.position);
    assert.equal(pose.station, station.id);
    assert.ok(pose.position.toArray().every((v, j) => Math.abs(v - station.position[j]) < 1e-8));
  });
  stations[0].position[0] = 999;
  assert.notEqual(getStations()[0].position[0], 999);
});

test('scroll mapping is reversible, finite, continuous and level with capped pitch', () => {
  const forward = Array.from({ length: 1001 }, (_, i) => poseAtProgress(i / 1000));
  [...forward].reverse().forEach((expected, i) => {
    const pose = poseAtProgress((1000 - i) / 1000);
    assert.deepEqual(pose, expected);
    assert.ok(Number.isFinite(pose.yaw));
    assert.ok(Math.abs(pose.pitch) <= 8 * Math.PI / 180 + 1e-8);
    assert.equal(pose.position.y, 3.2);
  });
  for (let i = 1; i < forward.length; i++) {
    assert.ok(forward[i].position.distanceTo(forward[i - 1].position) < 2);
    const delta = Math.atan2(Math.sin(forward[i].yaw - forward[i - 1].yaw), Math.cos(forward[i].yaw - forward[i - 1].yaw));
    assert.ok(Math.abs(delta) < 0.2);
  }
});

test('route clamps empty/invalid/out-of-range input and rejects unknown stations', () => {
  for (const input of [NaN, undefined, -2]) assert.deepEqual(poseAtProgress(input), poseAtProgress(0));
  assert.deepEqual(poseAtProgress(2), poseAtProgress(1));
  assert.throws(() => progressForStation('not-a-station'), RangeError);
});

test('angular damping takes shortest path, never overshoots and respects speed limit', () => {
  let angle = 0;
  for (let i = 0; i < 1000; i++) {
    const next = dampAngle(angle, 1, 1 / 60);
    assert.ok(next >= angle && next <= 1);
    assert.ok(next - angle <= 0.65 / 60 + 1e-10);
    angle = next;
  }
  assert.ok(Math.abs(angle - 1) < 1e-6);
  assert.ok(dampAngle(3.13, -3.13, 1 / 60) > 3.13);
});

test('route includes an observatory arc and a sideways workshop approach', () => {
  const a = route.getPoint(2 / 14), b = route.getPoint(4 / 14);
  const angles = [a, b].map(p => Math.atan2(p.z + 22, p.x + 5));
  const arc = Math.abs(Math.atan2(Math.sin(angles[1] - angles[0]), Math.cos(angles[1] - angles[0])));
  assert.ok(arc > Math.PI / 3 && arc < Math.PI * 0.75);
  assert.equal(route.getPoint(8 / 14).z, route.getPoint(10 / 14).z);
  assert.ok(route.getPoint(10 / 14).x - route.getPoint(8 / 14).x > 20);
});

test('integrated journey has local assets, fallback, native scroll and debug-only diagnostics', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('journey/main.js'));
  assert.match(html, /id="fallback"/);
  assert.match(html, /href="\/projects\/"/);
  assert.match(html, /id="debug" hidden/);
  getStations().forEach(s => assert.ok(html.includes(`id="${s.id}"`)));
  assert.ok(existsSync(new URL('../vendor/three.LICENSE', import.meta.url)));
  const assets = new URL('../assets/journey/', import.meta.url);
  const total = readdirSync(assets).filter(p => p.endsWith('.webp')).reduce((n, name) => n + statSync(new URL(name, assets)).size, 0);
  assert.ok(total < 1_500_000);
});
