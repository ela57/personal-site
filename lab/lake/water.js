import { clamp, coverMapping, waterline } from './math.js';

const vertex = `attribute vec2 position; varying vec2 uv;
void main(){ uv=vec2((position.x+1.0)*0.5,(1.0-position.y)*0.5); gl_Position=vec4(position,0.0,1.0); }`;
const fragment = `precision highp float;
varying vec2 uv;
uniform sampler2D image;
uniform vec2 coverScale, coverOffset, viewport;
uniform float time, portrait, pulseAge, scrollEnergy;
uniform vec2 pulse;
void main(){
  vec2 p=uv*coverScale+coverOffset;
  float shore=mix(0.52+0.027*p.x,0.534+0.008*p.x,portrait);
  float wet=smoothstep(shore,shore+0.015,p.y);
  float nearWater=clamp((p.y-shore)/(1.0-shore),0.0,1.0);
  float wave=sin(p.y*128.0-time*0.38+p.x*9.0)*0.58+sin(p.y*213.0+time*0.24-p.x*13.0)*0.28;
  vec2 delta=uv-pulse; delta.x*=viewport.x/viewport.y;
  float distanceToPulse=length(delta);
  float ring=sin((distanceToPulse-pulseAge*0.13)*105.0)*exp(-pow((distanceToPulse-pulseAge*0.13)/0.035,2.0));
  ring*=max(0.0,1.0-pulseAge/1.5)*step(0.0,pulseAge);
  float pixels=clamp(wave*(1.3+nearWater*1.1)*(1.0+scrollEnergy*0.2)+ring*1.2,-3.0,3.0)*wet;
  p.x+=pixels/viewport.x*coverScale.x;
  p.y+=pixels*0.22/viewport.y*coverScale.y;
  gl_FragColor=texture2D(image,clamp(p,vec2(0.0),vec2(1.0)));
}`;

export function createWater(scene, fallback) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lakeCanvas';
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
  if (!gl) return null;
  let program, texture, buffer, shaders = [], stopped = false, loaded = false, failed = false;
  let raf = 0, time = 0, previous = 0, width = 1, height = 1, mapping, portrait = false;
  let source = '', generation = 0, veil = 0, energy = 0, pulseTime = -100, pulse = [0, 0];
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const locations = {};
  function compile(type, code) {
    const shader = gl.createShader(type); shaders.push(shader);
    gl.shaderSource(shader, code); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Lake shader unavailable');
    return shader;
  }
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Lake program unavailable');
    gl.useProgram(program);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    ['coverScale', 'coverOffset', 'viewport', 'time', 'portrait', 'pulseAge', 'pulse', 'scrollEnergy'].forEach(name => locations[name] = gl.getUniformLocation(program, name));
    texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  } catch {
    release(); return null;
  }
  scene.append(canvas);
  let imageWidth = 1, imageHeight = 1;
  function resize() {
    width = scene.clientWidth; height = scene.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1, 1600 / Math.max(1, width));
    canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    const position = getComputedStyle(fallback).objectPosition.split(' ').map(value => parseFloat(value) / 100);
    mapping = coverMapping(width, height, imageWidth, imageHeight, position[0], position[1]);
    load(); start();
  }
  async function load() {
    const next = fallback.currentSrc;
    if (!next || next === source || stopped || failed) return;
    source = next; loaded = false; canvas.classList.remove('is-ready');
    const version = ++generation;
    const image = new Image(); image.src = next;
    try {
      await image.decode();
      if (stopped || failed || version !== generation) return;
      imageWidth = image.naturalWidth; imageHeight = image.naturalHeight;
      portrait = imageHeight > imageWidth;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      loaded = true; resize(); draw(); canvas.classList.add('is-ready');
    } catch { if (version === generation) fail(); }
  }
  function draw() {
    if (!loaded || !mapping || failed || stopped) return;
    gl.uniform2fv(locations.coverScale, mapping.scale); gl.uniform2fv(locations.coverOffset, mapping.offset);
    gl.uniform2f(locations.viewport, width, height); gl.uniform1f(locations.time, time);
    gl.uniform1f(locations.portrait, portrait ? 1 : 0);
    gl.uniform2fv(locations.pulse, pulse); gl.uniform1f(locations.pulseAge, time - pulseTime);
    gl.uniform1f(locations.scrollEnergy, energy);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    canvas.dataset.rendered = 'true';
  }
  function tick(now) {
    raf = 0;
    if (stopped || failed || document.hidden || veil >= .89) { previous = 0; return; }
    const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
    previous = now; time += dt; energy *= Math.exp(-dt * 3);
    draw(); raf = requestAnimationFrame(tick);
  }
  function start() { if (!raf && !stopped && !failed && !document.hidden && veil < .89) raf = requestAnimationFrame(tick); }
  function visibility() { cancelAnimationFrame(raf); raf = 0; previous = 0; start(); }
  function pointer(event) {
    if (!fine.matches || event.pointerType === 'touch' || !mapping || time - pulseTime < .22) return;
    const rect = scene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
    const sourceX = x * mapping.scale[0] + mapping.offset[0], sourceY = y * mapping.scale[1] + mapping.offset[1];
    if (sourceY > waterline(sourceX, portrait) + .015) { pulse = [x, y]; pulseTime = time; }
  }
  function fail() { failed = true; canvas.classList.remove('is-ready'); cancelAnimationFrame(raf); raf = 0; }
  function loss(event) { event.preventDefault(); fail(); }
  function release() {
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader)); shaders = [];
  }
  canvas.addEventListener('webglcontextlost', loss);
  fallback.addEventListener('load', resize);
  window.addEventListener('pointermove', pointer, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  const observer = new ResizeObserver(resize); observer.observe(scene);
  resize();
  return {
    update(nextVeil, velocity) { veil = nextVeil; if (!fine.matches) energy = Math.max(energy, clamp(Math.abs(velocity) / 1200)); if (veil >= .89) visibility(); else start(); },
    destroy() {
      stopped = true; generation++; cancelAnimationFrame(raf); observer.disconnect();
      fallback.removeEventListener('load', resize); window.removeEventListener('pointermove', pointer);
      document.removeEventListener('visibilitychange', visibility); canvas.removeEventListener('webglcontextlost', loss);
      release(); canvas.remove();
    },
  };
}
