import { clipDepth } from "./pipeline.js";
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const PAPER=[233,229,218], INK=[21,21,19], BLUE=[29,68,240];
const mix=(a,b,t)=>`rgb(${a.map((c,i)=>Math.round(c+(b[i]-c)*t)).join(",")})`;

  /* ---------------- Software renderer (Canvas 2D) ----------------
     Same pipeline as the Python project: model → world → view → projection →
     perspective divide (NDC) → backface culling → painter's sort → diffuse. */
  const ICO = (() => {
    const t = (1 + Math.sqrt(5)) / 2;
    const v = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]]
      .map(p => { const l = Math.hypot(...p); return p.map(c => c / l); });
    const f = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    return { v, f };
  })();
  const normalize = v => { const l = Math.hypot(...v) || 1; return v.map(c => c / l); };
  const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const rotX = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1]*c - p[2]*s, p[1]*s + p[2]*c]; };
  const rotY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0]*c + p[2]*s, p[1], -p[0]*s + p[2]*c]; };
  const LIGHT = normalize([-0.5, 0.75, -0.9]); // toward the light, in view space (camera looks down +z)

  export function createRenderer(canvas, opts = {}) {
    const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)");
    const motionOK=()=>!reduceMotion.matches;
    const ctx = canvas.getContext("2d");
    const state = Object.assign({
      stage: 3, cull: true, sort: true, rotate: true, dots: false, ndc: false,
      rx: 0.45, ry: 0.5, focal: 2.2, camZ: 4.2, scale: 0.36, speed: 0.22, paused: false, drag: true,
      light: LIGHT, ambient: .18, diffuse: .82, shading: 'face', wireframe: true,
    }, opts);
    let w = 0, h = 0, raf = 0, last = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(() => { resize(); draw(); }); ro.observe(canvas);

    function draw() {
      if (!w || !h) return;
      const s = state;
      ctx.clearRect(0, 0, w, h);
      const size = Math.min(w, h) * s.scale * 2;            // NDC [-1, 1] → this many px
      // Dolly zoom: the camera backs off as focal length grows, so the mesh keeps its size
      // on screen while perspective flattens (short lens) or exaggerates (wide lens).
      const camZ = s.camZ * s.focal / 2.2;
      const view = ICO.v.map(p => { const q = rotX(rotY(p, s.ry), s.rx); return [q[0], q[1], q[2] + camZ]; });
      const norm = camZ / s.focal * 0.62;
      const ndc = view.map(p => [p[0] * s.focal / p[2] * norm, p[1] * s.focal / p[2] * norm, p[2]]);
      const screen = ndc.map(p => [w / 2 + p[0] * size / 2, h / 2 - p[1] * size / 2, p[2]]);

      if (s.ndc) {
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = "rgba(21,21,19,.28)"; ctx.lineWidth = 1;
        ctx.strokeRect(w / 2 - size / 2 + .5, h / 2 - size / 2 + .5, size, size);
        ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(w / 2 - 6, h / 2); ctx.lineTo(w / 2 + 6, h / 2); ctx.moveTo(w / 2, h / 2 - 6); ctx.lineTo(w / 2, h / 2 + 6); ctx.stroke();
        ctx.fillStyle = "rgba(21,21,19,.5)"; ctx.font = "11px Archivo, sans-serif";
        ctx.fillText("(−1, −1)", w / 2 - size / 2 + 6, h / 2 + size / 2 - 8);
        const lbl = "(1, 1)"; ctx.fillText(lbl, w / 2 + size / 2 - ctx.measureText(lbl).width - 6, h / 2 - size / 2 + 16);
        ctx.restore();
      }

      const all = ICO.f.map((idx, order) => {
        const [a, b, c] = idx.map(i => view[i]);
        const n = normalize(cross(sub(b, a), sub(c, a)));
        const centroid = [(a[0]+b[0]+c[0])/3, (a[1]+b[1]+c[1])/3, (a[2]+b[2]+c[2])/3];
        const facing = dot(n, centroid) < 0;
        const depthPoints = idx.map(i => [view[i][0], view[i][1], (view[i][2] - 3.45) / (4.95 - 3.45) * 2 - 1]);
        const clipped = s.clip ? clipDepth(depthPoints, -1, 1) : depthPoints;
        const points = clipped.map(p => {
          const z = 3.45 + (p[2] + 1) / 2 * (4.95 - 3.45);
          const k = s.focal / z * norm * size / 2;
          return [w / 2 + p[0] * k, h / 2 - p[1] * k];
        });
        return { idx, points, order, n, z: centroid[2], facing, lit: s.shading === 'flat' ? .5 : clamp(dot(n, s.light === LIGHT ? LIGHT : normalize(s.light)), 0, 1),
          cx: points.reduce((sum, p) => sum + p[0], 0) / (points.length || 1), cy: points.reduce((sum, p) => sum + p[1], 0) / (points.length || 1) };
      });
      let faces = all;
      const culled = s.stage >= 2 && s.cull ? all.filter(f => !f.facing).length : 0;
      if (s.stage >= 2 && s.cull) faces = all.filter(f => f.facing);
      faces = faces.filter(f => f.points.length >= 3);
      if (s.stage >= 2 && s.sort) faces = faces.slice().sort((p, q) => q.z - p.z);

      ctx.lineJoin = "round"; ctx.lineCap = "round";
      const path = f => { ctx.beginPath(); f.points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); };
      if (s.stage >= 2) {
        faces.forEach(f => {
          path(f);
          ctx.fillStyle = s.stage >= 3 ? (f.facing ? mix(PAPER, BLUE, clamp(s.ambient + f.lit * s.diffuse,0,1)) : mix(PAPER, INK, .42)) : (f.facing ? mix(PAPER, BLUE, .45) : mix(PAPER, INK, .55));
          ctx.fill();
          ctx.strokeStyle = s.stage >= 3 ? "rgba(242,239,231,.55)" : "rgba(21,21,19,.55)"; ctx.lineWidth = 1; if(s.wireframe) ctx.stroke();
        });
      } else if (s.stage === 1) {
        if (s.solidWireframe) {
          ctx.fillStyle = mix(PAPER, BLUE, .18);
          all.filter(f => f.facing).forEach(f => { path(f); ctx.fill(); });
        }
        all.forEach(f => {
          path(f);
          ctx.strokeStyle = f.facing ? "rgba(21,21,19,.82)" : "rgba(21,21,19,.22)";
          ctx.lineWidth = f.facing ? 1.1 : 1; ctx.stroke();
        });
      }
      if (s.stage === 0 || s.dots) {
        screen.forEach(p => {
          ctx.beginPath(); ctx.arc(p[0], p[1], clamp(13 / p[2], 1.8, 4), 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${BLUE.join(",")})`; ctx.fill();
        });
      }
      if (s.orderLabels) {
        ctx.font = "12px Archivo, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#13201B";
        faces.forEach((face, i) => ctx.fillText(String(i + 1), face.cx, face.cy));
        ctx.textAlign = "start";
      }
      if (s.onFrame) s.onFrame({ w, h, screen, view, faces: all, drawn: s.stage >= 2 ? faces.length : 0, culled, state: s });
    }

    function tick(t) {
      raf = 0;
      if (state.rotate && !state.paused && motionOK() && !document.hidden) {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
        state.ry += dt * state.speed; state.rx += dt * state.speed * 0.3;
        draw(); last = t; raf = requestAnimationFrame(tick);
      } else last = 0;
    }
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; };

    let drag = null;
    if (state.drag) {
      canvas.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener("pointermove", e => {
        if (!drag) return;
        state.ry += (e.clientX - drag.x) * 0.008; state.rx += (e.clientY - drag.y) * 0.008;
        drag = { x: e.clientX, y: e.clientY }; draw();
      });
      const end = () => (drag = null);
      canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    }
    const onMotion = () => { stop(); start(); draw(); };
    reduceMotion.addEventListener("change", onMotion);
    let inView = false;
    const onVisibility = () => { if (!document.hidden && inView) start(); };
    document.addEventListener("visibilitychange", onVisibility);
    const vis = new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) start(); else stop(); });
    vis.observe(canvas);
    return {
      state, draw,
      set(patch) { Object.assign(state, patch); draw(); start(); },
      destroy() { stop(); ro.disconnect(); vis.disconnect(); reduceMotion.removeEventListener("change", onMotion); document.removeEventListener("visibilitychange", onVisibility); },
    };
  }
