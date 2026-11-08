import test from 'node:test';
import assert from 'node:assert/strict';
import { HalfFloatType, UnsignedByteType } from '../vendor/three.module.min.js';
import { createAntialiasing } from './antialias.js';
import { stationSubtitles } from './presentation.js';

function fakeRenderer(hdr) {
  return {
    capabilities: { isWebGL2: hdr }, extensions: { has: () => hdr },
    info: { render: { calls: 0 } }, width: 936, height: 585, draws: [],
    getDrawingBufferSize(size) { return size.set(this.width, this.height); },
    setRenderTarget(target) { this.target = target; if (target) this.lastTarget = target; },
    render(scene, camera) { this.draws.push({ scene, camera, target: this.target }); this.info.render.calls = this.target ? 37 : 1; }
  };
}

test('antialiasing preserves an HDR scene buffer, finishes on screen and tracks drawing-buffer size', () => {
  const renderer = fakeRenderer(true), pass = createAntialiasing(renderer);
  const scene = {}, camera = {};
  assert.equal(pass.render(scene, camera), 38);
  assert.equal(renderer.draws[0].scene, scene);
  assert.equal(renderer.draws[0].camera, camera);
  assert.equal(renderer.lastTarget.texture.type, HalfFloatType);
  assert.equal(renderer.lastTarget.width, 936);
  assert.equal(renderer.target, null);
  const material = renderer.draws[1].scene.children[0].material;
  assert.deepEqual(material.uniforms.texel.value.toArray(), [1 / 936, 1 / 585]);
  const target = renderer.lastTarget;
  renderer.width = 390; renderer.height = 844;
  pass.render(scene, camera);
  assert.equal(renderer.lastTarget, target);
  assert.equal(target.width, 390);
  assert.equal(target.height, 844);
  assert.deepEqual(material.uniforms.texel.value.toArray(), [1 / 390, 1 / 844]);
});

test('antialiasing does not require half-float framebuffer support', () => {
  const renderer = fakeRenderer(false);
  createAntialiasing(renderer).render({}, {});
  assert.equal(renderer.lastTarget.texture.type, UnsignedByteType);
});

test('all six station subtitles are plain destination copy, not experience classifications', () => {
  assert.equal(Object.keys(stationSubtitles).length, 6);
  assert.equal(stationSubtitles.observatory, 'Quantitative research');
  assert.equal(stationSubtitles.workshop, 'Graphics, hardware and analysis labs');
  assert.equal(stationSubtitles.clearing, 'Games and experiments');
  assert.equal(stationSubtitles.overlook, 'About and contact');
  assert.ok(Object.values(stationSubtitles).every(text => text && !text.includes('simulation')));
});
