import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Matter from "matter-js";
import { createPhysics } from "../lab/chips/physics.js";
import { staticPile } from "../lab/chips/render.js";

const canvas = () => ({ getAttribute: () => null, addEventListener() {}, removeEventListener() {} });
const step = (scene, count) => { for (let i = 0; i < count; i++) scene.step(1000 / 60); };

test("Matter vendored runtime matches pinned minified tooling build", () => {
  assert.equal(readFileSync(new URL("../vendor/matter.js", import.meta.url), "utf8"), readFileSync(new URL("../node_modules/matter-js/build/matter.min.js", import.meta.url), "utf8"));
});
test("desktop chip waves settle, cap oldest bodies, reset and replay", () => {
  const scene = createPhysics(Matter, canvas(), 1200, 675);
  assert.equal(scene.chips.length, 0);
  scene.wave(); step(scene, 480);
  assert.equal(scene.chips.length, 40);
  assert.ok(scene.chips.every(chip => chip.speed < .1));
  const first = scene.chips[0];
  scene.wave(); scene.wave(); scene.wave(); step(scene, 400);
  assert.equal(scene.chips.length, 120); assert.ok(!scene.chips.includes(first));
  scene.reset(); assert.equal(scene.chips.length, 0);
  step(scene, 60); assert.equal(scene.chips.length, 0);
  scene.wave(); step(scene, 150); assert.equal(scene.chips.length, 40);
  scene.dispose();
});
test("mobile wave/cap, resize containment and pointer disturbance", () => {
  const scene = createPhysics(Matter, canvas(), 335, 420);
  scene.wave(); step(scene, 100); assert.equal(scene.chips.length, 18);
  scene.wave(); scene.wave(); scene.wave(); step(scene, 200); assert.equal(scene.chips.length, 50);
  scene.resize(320, 400);
  assert.ok(scene.chips.every(chip => chip.position.x >= chip.circleRadius && chip.position.x <= 320 - chip.circleRadius));
  const chip = scene.chips[0];
  assert.equal(scene.hit(chip.position), chip);
  assert.equal(scene.hit({ x: -100, y: -100 }), undefined);
  scene.disturb(chip.position, 6, -3); assert.ok(chip.force.x > 0);
  scene.pointer(chip.position, true); scene.release(); scene.dispose();
});
test("reduced-motion arrangement is stable, contained and palette-only", () => {
  for (const width of [335, 1200]) {
    const pile = staticPile(width, 500);
    assert.deepEqual(pile, staticPile(width, 500)); assert.equal(pile.length, 21);
    assert.ok(pile.every(chip => chip.position.x > chip.circleRadius && chip.position.x + chip.circleRadius < width && chip.plugin.color >= 0 && chip.plugin.color < 4));
  }
});
