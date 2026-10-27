/* Ethan Lam — "The Engineering Notebook". Vanilla JS, no dependencies.
   nav · hero · reveals · renderer (hero wireframe, plate, bench) · thermal · annotations · case-study overlay */
import("./lab/hero-type.js").then(({ mountHeroType }) => mountHeroType(document.querySelector(".hero")));

(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const motionOK = () => !reduceMotion.matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const PAPER = [233, 229, 218], INK = [21, 21, 19], BLUE = [29, 68, 240];
  const mix = (a, b, t) => `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * t)).join(",")})`;

  const yearEl = $("#year"); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Navigation ---------------- */
  const nav = $("#nav");
  const setScrolled = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", setScrolled, { passive: true }); setScrolled();
  const navFor = {};
  $$(".navLinks a[data-section]").forEach(a => (navFor[a.dataset.section] = a));
  const setCurrent = id => {
    Object.values(navFor).forEach(a => a.removeAttribute("aria-current"));
    if (navFor[id]) navFor[id].setAttribute("aria-current", "true");
  };
  const atBottom = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  const sectionIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting || atBottom()) return;
    setCurrent(en.target.id === "bench" ? "projects" : en.target.id);
  }), { rootMargin: "-45% 0px -50% 0px" });
  // The last section can be too short to reach the observer band; at the end of the page it's current.
  addEventListener("scroll", () => { if (atBottom()) setCurrent("contact"); }, { passive: true });
  ["top", "projects", "bench", "lab", "about", "contact"].forEach(id => { const el = document.getElementById(id); if (el) sectionIO.observe(el); });

  /* ---------------- Entrances ---------------- */
  $$(".index li").forEach((li, i) => li.style.setProperty("--i", i));
  requestAnimationFrame(() => requestAnimationFrame(() => $(".hero").classList.add("in")));
  const revealIO = new IntersectionObserver((entries, io) => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in"); io.unobserve(en.target);
  }), { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  $$(".rule, .proj, .contact").forEach(el => revealIO.observe(el));

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

  function createRenderer(canvas, opts = {}) {
    const ctx = canvas.getContext("2d");
    const state = Object.assign({
      stage: 3, cull: true, sort: true, rotate: true, dots: false, ndc: false,
      rx: 0.45, ry: 0.5, focal: 2.2, camZ: 4.2, scale: 0.36, speed: 0.22, paused: false, drag: true,
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
        ctx.fillStyle = "rgba(21,21,19,.5)"; ctx.font = "11px 'IBM Plex Mono', monospace";
        ctx.fillText("(−1, −1)", w / 2 - size / 2 + 6, h / 2 + size / 2 - 8);
        const lbl = "(1, 1)"; ctx.fillText(lbl, w / 2 + size / 2 - ctx.measureText(lbl).width - 6, h / 2 - size / 2 + 16);
        ctx.restore();
      }

      const all = ICO.f.map((idx, order) => {
        const [a, b, c] = idx.map(i => view[i]);
        const n = normalize(cross(sub(b, a), sub(c, a)));
        const centroid = [(a[0]+b[0]+c[0])/3, (a[1]+b[1]+c[1])/3, (a[2]+b[2]+c[2])/3];
        const facing = dot(n, centroid) < 0;
        const sc = idx.map(i => screen[i]);
        return { idx, order, n, z: centroid[2], facing, lit: clamp(dot(n, LIGHT), 0, 1),
          cx: (sc[0][0]+sc[1][0]+sc[2][0])/3, cy: (sc[0][1]+sc[1][1]+sc[2][1])/3 };
      });
      let faces = all;
      const culled = s.stage >= 2 && s.cull ? all.filter(f => !f.facing).length : 0;
      if (s.stage >= 2 && s.cull) faces = all.filter(f => f.facing);
      if (s.stage >= 2 && s.sort) faces = faces.slice().sort((p, q) => q.z - p.z);

      ctx.lineJoin = "round"; ctx.lineCap = "round";
      const path = f => { const [i, j, m] = f.idx; ctx.beginPath(); ctx.moveTo(screen[i][0], screen[i][1]); ctx.lineTo(screen[j][0], screen[j][1]); ctx.lineTo(screen[m][0], screen[m][1]); ctx.closePath(); };
      if (s.stage >= 2) {
        faces.forEach(f => {
          path(f);
          ctx.fillStyle = s.stage >= 3 ? (f.facing ? mix(PAPER, BLUE, 0.18 + f.lit * 0.82) : mix(PAPER, INK, .42)) : (f.facing ? mix(PAPER, BLUE, .45) : mix(PAPER, INK, .55));
          ctx.fill();
          ctx.strokeStyle = s.stage >= 3 ? "rgba(242,239,231,.55)" : "rgba(21,21,19,.55)"; ctx.lineWidth = 1; ctx.stroke();
        });
      } else if (s.stage === 1) {
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

  /* ---------------- Thermal-vision illustration (SVG) ----------------
     Depth → cold-to-hot ramp, clamped at max distance; silhouette edges; grain. */
  const RAMP = [[8,16,60],[20,60,170],[0,170,200],[60,200,90],[230,210,40],[235,110,30],[220,30,30],[255,240,220]];
  function heat(t) {
    t = clamp(t, 0, 1) * (RAMP.length - 1);
    const i = Math.floor(t), k = t - i, a = RAMP[i], b = RAMP[Math.min(i + 1, RAMP.length - 1)];
    return `rgb(${Math.round(a[0] + (b[0]-a[0])*k)},${Math.round(a[1] + (b[1]-a[1])*k)},${Math.round(a[2] + (b[2]-a[2])*k)})`;
  }
  const THERMAL_SCENE = [
    { d: 1.00, pts: "0,0 320,0 320,110 0,110" },
    { d: 0.95, pts: "0,110 320,110 320,200 0,200", floor: true },
    { d: 0.82, pts: "40,70 92,70 92,128 40,128" },
    { d: 0.74, pts: "232,62 300,62 300,136 232,136" },
    { d: 0.58, pts: "140,80 196,80 196,150 140,150" },
    { d: 0.40, pts: "18,110 84,110 84,185 18,185" },
    { d: 0.30, pts: "212,118 292,118 292,196 212,196" },
    { d: 0.14, pts: "108,132 180,132 180,200 108,200" },
  ];
  let thermalUID = 0;
  function mountThermal(el, opts = {}) {
    const state = Object.assign({ range: 0.7, edges: true, grain: true }, opts);
    const id = `g${++thermalUID}`;
    const render = () => {
      const polys = THERMAL_SCENE.map(o => {
        const depth = o.d / state.range, t = 1 - clamp(depth, 0, 1);
        const fill = o.floor ? `url(#${id}f)` : heat(t);
        const stroke = state.edges ? `stroke="rgba(255,255,255,${(0.75 * (1 - clamp(depth, 0, 1)) + 0.15).toFixed(2)})" stroke-width="1.2"` : "";
        return `<polygon points="${o.pts}" fill="${fill}" ${stroke} />`;
      }).join("");
      const floorNear = heat(1 - clamp(0.42 / state.range, 0, 1)), floorFar = heat(1 - clamp(1 / state.range, 0, 1));
      el.innerHTML = `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration of a depth-based thermal vision effect: nearer objects render hot (white, red, yellow) and farther objects cold (blue), with outlined silhouettes and film grain.">
        <defs>
          <linearGradient id="${id}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${floorNear}"/><stop offset="1" stop-color="${floorFar}"/></linearGradient>
          <filter id="${id}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".35"/></feComponentTransfer></filter>
        </defs>
        ${polys}
        ${state.grain ? `<rect width="320" height="200" filter="url(#${id}n)" style="mix-blend-mode:overlay" />` : ""}
        <text x="8" y="192" font-size="7" font-family="'IBM Plex Mono',monospace" fill="rgba(255,255,255,.75)">MAX DIST ${state.range.toFixed(2)}</text>
      </svg>`;
    };
    render();
    return { set(p) { Object.assign(state, p); render(); } };
  }

  /* ---------------- Interaction A: technical annotations ----------------
     Each <li> in .notes is a label; data-at="x,y" (fractions of the plate) is the
     point it describes. Leader lines are drawn in an SVG over the plate. Renderer
     plates supply live targets every frame instead of fixed ones. */
  const SVGNS = "http://www.w3.org/2000/svg";
  function setupAnnotations(fig) {
    const vis = $(".plateVis", fig), notes = $$(".notes li", fig), btn = $(".annoBtn", fig);
    if (!vis || !notes.length) return null;
    const svg = document.createElementNS(SVGNS, "svg");
    svg.classList.add("annoSvg"); svg.setAttribute("aria-hidden", "true");
    fig.insertBefore(svg, $(".notes", fig));
    const live = {};
    const parts = notes.map((li, i) => {
      li.style.setProperty("--i", i);
      const g = document.createElementNS(SVGNS, "g"); g.style.setProperty("--i", i);
      const p = document.createElementNS(SVGNS, "path"); p.setAttribute("pathLength", "1");
      const ring = document.createElementNS(SVGNS, "circle"); ring.setAttribute("r", "7"); ring.classList.add("ring");
      const c = document.createElementNS(SVGNS, "circle"); c.setAttribute("r", "3"); c.classList.add("dot");
      const t = document.createElementNS(SVGNS, "text"); t.textContent = i + 1; t.setAttribute("text-anchor", "middle"); t.setAttribute("dy", "4");
      g.append(p, ring, c, t); svg.appendChild(g);
      return { li, p, ring, c, t, at: (li.dataset.at || ".5,.5").split(",").map(Number), key: li.dataset.key };
    });
    const layout = () => {
      const W = vis.clientWidth, H = vis.clientHeight;
      if (!W) return;
      svg.setAttribute("width", W); svg.setAttribute("height", H);
      const small = innerWidth < 720;
      parts.forEach(pt => {
        const at = (pt.key && live[pt.key]) || [pt.at[0] * W, pt.at[1] * H];
        const [tx, ty] = at;
        pt.c.setAttribute("cx", tx); pt.c.setAttribute("cy", ty); pt.ring.setAttribute("cx", tx); pt.ring.setAttribute("cy", ty);
        pt.c.setAttribute("r", small ? 9 : 3);
        pt.t.setAttribute("x", tx); pt.t.setAttribute("y", ty);
        if (small) return;
        const lx = parseFloat(getComputedStyle(pt.li).getPropertyValue("--lx")) / 100 * W;
        const ly = parseFloat(getComputedStyle(pt.li).getPropertyValue("--ly")) / 100 * H;
        const sh = pt.li.dataset.side === "l" ? 16 : -16;
        pt.p.setAttribute("d", `M${tx.toFixed(1)} ${ty.toFixed(1)} L${(lx + sh).toFixed(1)} ${ly.toFixed(1)} H${lx.toFixed(1)}`);
      });
    };
    new ResizeObserver(layout).observe(vis);
    let pinned = false, hovered = false;
    const api = {
      layout, live, onChange: null,
      get on() { return pinned || hovered; },
      update() { const on = pinned || hovered; fig.classList.toggle("annotated", on); if (btn) btn.setAttribute("aria-pressed", String(pinned)); if (on) layout(); api.onChange && api.onChange(on); },
    };
    const art = fig.closest(".proj") || fig;
    art.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") { hovered = true; api.update(); } });
    art.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") { hovered = false; api.update(); } });
    art.addEventListener("focusin", () => { hovered = true; api.update(); });
    art.addEventListener("focusout", e => { if (!art.contains(e.relatedTarget)) { hovered = false; api.update(); } });
    if (btn) btn.addEventListener("click", e => { e.stopPropagation(); pinned = !pinned; api.update(); });
    layout();
    return api;
  }

  /* ---------------- Interaction C: the bench ---------------- */
  const BENCH_NOTES = {
    "1,1": "Correct: back faces are skipped and the rest are drawn far to near.",
    "1,0": "Still correct. On a convex mesh, front faces never overlap each other — culling alone fixes visibility.",
    "0,1": "Correct, at roughly twice the work: back faces are drawn first, then painted over.",
    "0,0": "Broken. Faces are drawn in mesh order, so back faces (grey) paint over front ones.",
  };
  function mountBench(host) {
    if (host.dataset.mounted) return; host.dataset.mounted = "1";
    host.replaceChildren($("#tpl-bench").content.cloneNode(true));
    const canvas = $(".benchCanvas", host), out = k => $(`[data-r="${k}"]`, host);
    const cache = {};
    const put = (k, v) => { if (cache[k] !== v) { cache[k] = v; out(k).textContent = v; } };
    const r = createRenderer(canvas, {
      stage: 3, ndc: true, scale: 0.4, speed: 0.12,
      onFrame: ({ drawn, culled, state: s }) => {
        put("drawn", s.stage >= 2 ? String(drawn) : "—");
        put("culled", s.stage >= 2 ? String(culled) : "—");
        put("order", s.stage >= 2 ? (s.sort ? "far → near" : "mesh index") : "—");
        put("note", s.stage >= 2 ? BENCH_NOTES[`${+s.cull},${+s.sort}`] : "Visibility only matters once faces are filled — step to 03 or 04.");
      },
    });
    const btns = $$("[data-stage]", host);
    btns.forEach(b => b.addEventListener("click", () => {
      btns.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      r.set({ stage: +b.dataset.stage });
    }));
    $$('input[type="checkbox"][data-opt]', host).forEach(inp => inp.addEventListener("change", () => r.set({ [inp.dataset.opt]: inp.checked })));
    const focal = $('input[data-opt="focal"]', host), fo = $('output[data-out="focal"]', host);
    focal.addEventListener("input", () => { r.set({ focal: +focal.value }); fo.value = (+focal.value).toFixed(2); });
    canvas.addEventListener("pointerdown", () => r.set({ rotate: false }));
    host._cleanup = () => r.destroy();
  }

  /* ---------------- Mount visuals ---------------- */
  function mountVisuals(root) {
    $$("[data-vis]", root).forEach(el => {
      if (el.dataset.mounted) return; el.dataset.mounted = "1";
      const kind = el.dataset.vis, fig = el.closest(".plate");
      if (kind === "wire" || kind === "renderer") {
        const c = document.createElement("canvas"); c.className = "rendererCanvas";
        c.setAttribute("role", "img");
        c.setAttribute("aria-label", kind === "wire" ? "Wireframe icosahedron; front edges dark, back edges faint." : "Shaded icosahedron with backface culling, depth sorting and diffuse lighting.");
        el.appendChild(c);
        let anno = null;
        const r = createRenderer(c, kind === "wire"
          ? { stage: 1, dots: true, scale: 0.4, speed: 0.16 }
          : { stage: 3, scale: el.hasAttribute("data-big") ? 0.4 : 0.34, drag: el.hasAttribute("data-big"),
              onFrame: f => {
                if (!anno) return;
                const vis = f.faces.filter(x => x.facing);
                const near = f.screen.reduce((a, p) => (p[2] < a[2] ? p : a));
                const lit = vis.reduce((a, x) => (x.lit > a.lit ? x : a));
                const far = vis.reduce((a, x) => (x.z > a.z ? x : a));
                anno.live.vertex = [near[0], near[1]]; anno.live.lit = [lit.cx, lit.cy]; anno.live.far = [far.cx, far.cy];
                const cl = fig && $('[data-live="culled"]', fig); if (cl) cl.textContent = f.faces.length - vis.length;
                if (anno.on || innerWidth < 720) anno.layout();
              } });
        if (fig && fig.dataset.annotate) {
          anno = setupAnnotations(fig);
          if (anno) anno.onChange = on => r.set({ paused: on });
          r.draw();
        }
        el._cleanup = () => r.destroy();
      } else if (kind === "thermal") {
        const interactive = el.hasAttribute("data-interactive");
        const t = mountThermal(el, { range: interactive ? 0.7 : 0.62 });
        const demo = interactive && $('[data-demo="thermal"]', root);
        if (demo) {
          const range = $('input[data-opt="range"]', demo), out = $('output[data-out="range"]', demo);
          range.addEventListener("input", () => { t.set({ range: +range.value }); out.value = (+range.value).toFixed(2); });
          $$('input[type="checkbox"][data-opt]', demo).forEach(inp => inp.addEventListener("change", () => t.set({ [inp.dataset.opt]: inp.checked })));
        }
        if (fig && fig.dataset.annotate) setupAnnotations(fig);
      }
    });
    $$(".plate[data-annotate]:not([data-vis-host])", root).forEach(fig => {
      if (!$("[data-vis]", fig) && !fig.dataset.annoReady) { fig.dataset.annoReady = "1"; setupAnnotations(fig); }
    });
    $$("[data-bench]", root).forEach(mountBench);
  }
  mountVisuals(document);

  /* ---------------- Interaction B: case-study overlay (hash routed) ---------------- */
  const ORDER = ["renderer", "thermal", "vol"];
  const TITLES = { renderer: "Software 3D renderer", thermal: "Thermal-vision shader", vol: "Realized volatility & SPY" };
  const detail = $("#detail"), content = $("#detailContent"), closeBtn = $("#detailClose");
  const countEl = $("#detailCount"), nextEl = $("#detailNext");
  const backdropEls = Array.from(document.body.children).filter(el => el !== detail && el.tagName !== "TEMPLATE" && el.tagName !== "SCRIPT");
  const setInert = on => backdropEls.forEach(el => (el.inert = on));
  const focusables = () => $$('a[href], button:not([disabled]):not([tabindex="-1"]), select, input:not([disabled]), [tabindex]:not([tabindex="-1"])', detail).filter(el => el.offsetParent !== null);
  let openSlug = null, returnFocus = null, pushedEntry = false, enterTimer = 0;
  const cardFor = slug => $(`.proj[data-project="${slug}"]`);
  let labCleanup = null, labVersion = 0;
  const cleanup = () => {
    labVersion++; labCleanup?.(); labCleanup = null;
    $$("[data-vis], [data-bench]", content).forEach(el => el._cleanup && el._cleanup());
  };

  function fillDetail(slug) {
    const tpl = $(`#tpl-${slug}`);
    if (!tpl) return false;
    cleanup();
    content.replaceChildren(tpl.content.cloneNode(true));
    nextEl.hidden = slug === "lab-chess";
    if (slug === "lab-chess") {
      countEl.textContent = "Lab / 01 · Chess puzzles";
      const version = labVersion, host = $("[data-chess]", content);
      import("./lab/chess/board.js").then(({ mountChess }) => {
        if (version === labVersion && host.isConnected) labCleanup = mountChess(host);
      }).catch(() => {
        if (version === labVersion) host.textContent = "The board could not load. Close and reopen to try again.";
      });
      return true;
    }
    const i = ORDER.indexOf(slug), next = ORDER[(i + 1) % ORDER.length];
    countEl.textContent = `Case study ${String(i + 1).padStart(2, "0")} / ${String(ORDER.length).padStart(2, "0")}`;
    nextEl.href = `#project/${next}`;
    nextEl.textContent = `Next: ${String(ORDER.indexOf(next) + 1).padStart(2, "0")} ${TITLES[next]} →`;
    mountVisuals(content);
    return true;
  }
  const withTransition = (fn, a, b) => {
    if (!(motionOK() && document.startViewTransition && a && b)) { fn(); return; }
    a.style.viewTransitionName = "project-media";
    const vt = document.startViewTransition(() => { a.style.viewTransitionName = ""; b.style.viewTransitionName = "project-media"; fn(); });
    vt.finished.finally(() => { a.style.viewTransitionName = ""; b.style.viewTransitionName = ""; });
  };

  function openDetail(slug, { trigger = null } = {}) {
    if (openSlug === slug) return;
    const wasOpen = !!openSlug, card = cardFor(slug);
    const show = () => {
      if (!fillDetail(slug)) return;
      openSlug = slug;
      detail.hidden = false; detail.scrollTop = 0;
      document.body.classList.add("noscroll"); setInert(true);
      detail.classList.remove("entering"); void detail.offsetWidth; detail.classList.add("entering");
      clearTimeout(enterTimer); enterTimer = setTimeout(() => detail.classList.remove("entering"), 1600);
      closeBtn.focus({ preventScroll: true });
    };
    if (trigger) returnFocus = trigger;
    const fromCard = !wasOpen && trigger && card && card.contains(trigger);
    if (!$(`#tpl-${slug}`)) return;
    if (fromCard && motionOK() && document.startViewTransition) {
      const media = $(".plateVis", card);
      media.style.viewTransitionName = "project-media";
      const vt = document.startViewTransition(() => {
        media.style.viewTransitionName = ""; show();
        const t = $(".csMedia .plateVis", content); if (t) t.style.viewTransitionName = "project-media";
      });
      vt.finished.finally(() => { media.style.viewTransitionName = ""; const t = $(".csMedia .plateVis", content); if (t) t.style.viewTransitionName = ""; });
    } else show();
  }

  function closeDetail() {
    if (!openSlug) return;
    const slug = openSlug; openSlug = null;
    const card = cardFor(slug);
    const finish = () => {
      detail.hidden = true; detail.classList.remove("entering");
      document.body.classList.remove("noscroll"); setInert(false);
      cleanup(); content.replaceChildren();
      const target = returnFocus && returnFocus.isConnected ? returnFocus : card ? $("a.more, .more a", card) : $('a[href="#lab/chess"]');
      target && target.focus({ preventScroll: true });
      returnFocus = null;
    };
    const from = $(".csMedia .plateVis", content), to = card && $(".plateVis", card);
    const r = to && to.getBoundingClientRect();
    const onScreen = r && r.bottom > 0 && r.top < innerHeight;
    if (onScreen) withTransition(finish, from, to);
    else if (motionOK() && document.startViewTransition) document.startViewTransition(finish);
    else finish();
  }
  function requestClose() {
    if (!openSlug) return;
    if (pushedEntry) { history.back(); return; }
    history.replaceState(null, "", location.pathname + location.search);
    closeDetail();
  }
  function route() {
    const m = location.hash.match(/^#(project|lab)\/([a-z0-9-]+)$/);
    const slug = m && (m[1] === "lab" ? `lab-${m[2]}` : m[2]);
    if (slug && (ORDER.includes(slug) || slug === "lab-chess")) { openDetail(slug); }
    else if (openSlug) { pushedEntry = false; closeDetail(); }
  }
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#project/"], a[href^="#lab/"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const hash = a.getAttribute("href");
    const slug = hash.startsWith("#lab/") ? `lab-${hash.slice(5)}` : hash.slice(9);
    if (openSlug) { history.replaceState(null, "", hash); openSlug = null; openDetail(slug); return; }
    history.pushState(null, "", hash); pushedEntry = true;
    const card = a.closest(".proj");
    openDetail(slug, { trigger: card ? ($(".more", card).matches("a") ? $(".more", card) : $(".more a", card)) : a });
  });
  closeBtn.addEventListener("click", requestClose);
  addEventListener("keydown", e => {
    if (!openSlug) return;
    if (e.key === "Escape") { requestClose(); return; }
    if (e.key !== "Tab") return;
    const els = focusables(); if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && (document.activeElement === first || !detail.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !detail.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  addEventListener("popstate", route);
  addEventListener("hashchange", route);
  route();
})();
