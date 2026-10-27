/* Ethan Lam — portfolio behaviour. Vanilla JS, no dependencies.
   Sections: motion prefs · nav · hero · reveals · visuals (renderer, thermal, diagram)
             · scroll-linked showcase · project detail overlay (hash routed). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const motionOK = () => !reduceMotion.matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------- Navigation ---------------- */
  const nav = $("#nav");
  const menuBtn = $("#menuBtn");
  const setScrolled = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", setScrolled, { passive: true });
  setScrolled();

  const closeMenu = () => {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
  };
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$("#navLinks a").forEach(a => a.addEventListener("click", closeMenu));
  addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) closeMenu(); });

  // Highlight the nav item for the section in view.
  const navFor = {};
  $$("#navLinks a[data-section]").forEach(a => (navFor[a.dataset.section] = a));
  const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      Object.values(navFor).forEach(a => a.removeAttribute("aria-current"));
      const a = navFor[en.target.id];
      if (a) a.setAttribute("aria-current", "true");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["projects", "showcase", "about", "contact"].forEach(id => { const el = document.getElementById(id); if (el) sectionIO.observe(el); });

  /* ---------------- Hero entrance ---------------- */
  requestAnimationFrame(() => requestAnimationFrame(() => $(".hero").classList.add("in")));

  /* ---------------- Scroll reveals ---------------- */
  const revealIO = new IntersectionObserver((entries, io) => {
    entries.filter(e => e.isIntersecting).forEach((en, i) => {
      const el = en.target;
      el.style.setProperty("--d", `${i * 90}ms`);
      el.classList.add("in");
      io.unobserve(el);
      const done = () => { el.style.removeProperty("--d"); el.classList.add("shown"); };
      el.addEventListener("transitionend", done, { once: true });
      setTimeout(done, 1200);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
  $$(".reveal").forEach(el => revealIO.observe(el));

  /* ---------------- Software renderer (canvas) ----------------
     Mirrors the pipeline of the Python project: model → world → view →
     projection → perspective divide → backface culling → z-sort → diffuse. */
  const ICO = (() => {
    const t = (1 + Math.sqrt(5)) / 2;
    const v = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]]
      .map(p => { const l = Math.hypot(...p); return p.map(c => c / l); });
    const f = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    return { v, f };
  })();

  function createRenderer(canvas, opts = {}) {
    const ctx = canvas.getContext("2d");
    const state = Object.assign({
      stage: 3, wire: true, cull: true, light: true, rotate: motionOK(),
      rx: 0.5, ry: 0.4, dark: false, scale: 0.34, speed: 0.25,
    }, opts);
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0, dirty = true;
    const light = normalize([-0.4, 0.8, 1]);

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
    }
    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);

    function rotX(p, a) { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1]*c - p[2]*s, p[1]*s + p[2]*c]; }
    function rotY(p, a) { const c = Math.cos(a), s = Math.sin(a); return [p[0]*c + p[2]*s, p[1], -p[0]*s + p[2]*c]; }
    function normalize(v) { const l = Math.hypot(...v) || 1; return v.map(c => c / l); }
    function sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
    function cross(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
    function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }

    function draw() {
      if (!w || !h) return;
      const s = state;
      ctx.clearRect(0, 0, w, h);
      const camZ = 4.2, f = 2.2; // view translation + focal length (projection)
      // model → world → view
      const view = ICO.v.map(p => { const q = rotX(rotY(p, s.ry), s.rx); return [q[0], q[1], q[2] + camZ]; });
      // projection + perspective divide → NDC → screen
      const size = Math.min(w, h) * s.scale * 2;
      const screen = view.map(p => [w/2 + (p[0] * f / p[2]) * size/2, h/2 - (p[1] * f / p[2]) * size/2, p[2]]);
      const ink = s.dark ? "255,255,255" : "23,25,29";
      const blue = s.dark ? [143,176,255] : [56,107,230];

      let culled = 0;
      let faces = ICO.f.map(idx => {
        const a = view[idx[0]], b = view[idx[1]], c = view[idx[2]];
        const n = normalize(cross(sub(b, a), sub(c, a)));
        const centroid = [(a[0]+b[0]+c[0])/3, (a[1]+b[1]+c[1])/3, (a[2]+b[2]+c[2])/3];
        const facing = dot(n, centroid) < 0; // faces whose normal points toward the camera
        return { idx, n, z: centroid[2], facing };
      });
      if (s.stage >= 2 && s.cull) { culled = faces.filter(fc => !fc.facing).length; faces = faces.filter(fc => fc.facing); }
      faces.sort((p, q) => q.z - p.z); // painter's algorithm: far to near

      ctx.lineJoin = "round"; ctx.lineCap = "round";
      if (s.stage >= 2) {
        faces.forEach(fc => {
          const [i, j, k] = fc.idx;
          const lit = s.stage >= 3 && s.light ? clamp(dot(fc.n, light), 0, 1) : 0.55;
          const a = s.stage >= 3 && s.light ? 0.3 + lit * 0.7 : 0.6;
          ctx.beginPath();
          ctx.moveTo(screen[i][0], screen[i][1]); ctx.lineTo(screen[j][0], screen[j][1]); ctx.lineTo(screen[k][0], screen[k][1]); ctx.closePath();
          ctx.fillStyle = `rgba(${blue[0]},${blue[1]},${blue[2]},${a.toFixed(3)})`;
          ctx.fill();
          if (s.wire) { ctx.strokeStyle = s.dark ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.9)"; ctx.lineWidth = 1; ctx.stroke(); }
        });
      } else if (s.stage === 1) {
        ctx.strokeStyle = `rgba(${ink},.55)`; ctx.lineWidth = 1.1;
        ICO.f.forEach(([i, j, k]) => {
          ctx.beginPath(); ctx.moveTo(screen[i][0], screen[i][1]); ctx.lineTo(screen[j][0], screen[j][1]); ctx.lineTo(screen[k][0], screen[k][1]); ctx.closePath(); ctx.stroke();
        });
      }
      if (s.stage <= 1) {
        screen.forEach(p => {
          const r = clamp(10 / p[2], 1.5, 4.5);
          ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${blue.join(",")})`; ctx.fill();
        });
      }
      if (s.onFrame) s.onFrame({ vertices: ICO.v.length, faces: ICO.f.length, culled });
      dirty = false;
    }

    function tick(t) {
      raf = 0;
      if (s().rotate && motionOK() && !document.hidden) {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
        state.ry += dt * state.speed; state.rx += dt * state.speed * 0.3;
        dirty = true;
      }
      last = t;
      if (dirty) draw();
      if (s().rotate && motionOK()) raf = requestAnimationFrame(tick);
    }
    const s = () => state;
    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    // Pointer drag to rotate.
    let drag = null;
    canvas.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", e => {
      if (!drag) return;
      state.ry += (e.clientX - drag.x) * 0.008; state.rx += (e.clientY - drag.y) * 0.008;
      drag = { x: e.clientX, y: e.clientY }; dirty = true; if (!raf) draw();
    });
    const endDrag = () => (drag = null);
    canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);

    const onMotionChange = () => { stop(); start(); };
    reduceMotion.addEventListener("change", onMotionChange);
    return {
      set(patch) { Object.assign(state, patch); dirty = true; if (!raf) draw(); if (state.rotate) start(); },
      get state() { return state; },
      start, stop, draw,
      destroy() { stop(); ro.disconnect(); reduceMotion.removeEventListener("change", onMotionChange); },
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
  // A simple scene: floor, back wall, and boxes at different depths (0 = nearest, 1 = farthest).
  const THERMAL_SCENE = [
    { d: 1.00, pts: "0,0 320,0 320,110 0,110" },               // far wall
    { d: 0.95, pts: "0,110 320,110 320,200 0,200", floor: true }, // floor
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
        const depth = o.d / state.range; // distance normalized by max-distance; >1 clamps to coldest
        const t = 1 - clamp(depth, 0, 1);
        let fill = heat(t);
        if (o.floor) fill = `url(#${id}f)`;
        const stroke = state.edges ? `stroke="rgba(255,255,255,${(0.75 * (1 - clamp(depth,0,1)) + 0.15).toFixed(2)})" stroke-width="1.2"` : "";
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
        <rect x="8" y="8" width="52" height="14" rx="3" fill="rgba(0,0,0,.45)"/><text x="12" y="18.5" font-size="8" font-family="ui-monospace,Menlo,monospace" fill="rgba(255,255,255,.9)">THERMAL</text>
        <rect x="246" y="8" width="66" height="14" rx="3" fill="rgba(0,0,0,.45)"/><text x="250" y="18.5" font-size="8" font-family="ui-monospace,Menlo,monospace" fill="rgba(255,255,255,.9)">RANGE ${state.range.toFixed(2)}</text>
      </svg>`;
    };
    render();
    return { set(p) { Object.assign(state, p); render(); } };
  }

  /* ---------------- Visual mounting ---------------- */
  const live = new Set(); // renderers to pause/resume on visibility
  function mountVisuals(root) {
    $$("[data-vis]", root).forEach(el => {
      if (el.dataset.mounted) return;
      el.dataset.mounted = "1";
      const interactive = el.hasAttribute("data-interactive");
      if (el.dataset.vis === "renderer") {
        const c = document.createElement("canvas"); c.className = "rendererCanvas"; c.setAttribute("aria-label", "Rotating icosahedron rendered with backface culling and diffuse lighting"); c.setAttribute("role", "img");
        el.appendChild(c);
        const r = createRenderer(c, { scale: interactive ? 0.3 : 0.36, speed: interactive ? 0.35 : 0.22 });
        live.add(r); r.start();
        if (interactive) {
          const demo = $('[data-demo="renderer"]', root);
          if (demo) $$("input[data-opt]", demo).forEach(inp => inp.addEventListener("change", () => r.set({ [inp.dataset.opt]: inp.checked })));
        }
        el._cleanup = () => { r.destroy(); live.delete(r); };
      } else if (el.dataset.vis === "thermal") {
        const t = mountThermal(el, { range: interactive ? 0.7 : 0.62 });
        if (interactive) {
          const demo = $('[data-demo="thermal"]', root);
          if (demo) {
            const range = $('input[data-opt="range"]', demo), out = $('output[data-out="range"]', demo);
            range.addEventListener("input", () => { t.set({ range: +range.value }); out.value = (+range.value).toFixed(2); });
            $$('input[type="checkbox"][data-opt]', demo).forEach(inp => inp.addEventListener("change", () => t.set({ [inp.dataset.opt]: inp.checked })));
          }
        }
      } else if (el.dataset.vis === "worm") {
        el.appendChild($("#svg-worm").content.cloneNode(true));
      }
    });
  }
  mountVisuals(document);
  document.addEventListener("visibilitychange", () => live.forEach(r => (document.hidden ? r.stop() : r.start())));

  /* ---------------- Scroll-linked showcase ---------------- */
  const track = $("#showcaseTrack"), showCanvas = $("#showcaseCanvas"), readout = $("#readout");
  const steps = $$("#steps .step");
  if (track && showCanvas) {
    const r = createRenderer(showCanvas, {
      dark: true, rotate: false, scale: 0.36, stage: 0,
      onFrame: ({ vertices, faces, culled }) => { readout.textContent = `${vertices} vertices · ${faces} faces · ${culled} culled`; },
    });
    let progress = 0, inView = false;
    const update = () => {
      const rect = track.getBoundingClientRect();
      const total = rect.height - innerHeight;
      progress = clamp(-rect.top / total, 0, 1);
      const stage = progress < 0.24 ? 0 : progress < 0.49 ? 1 : progress < 0.74 ? 2 : 3;
      steps.forEach(s => s.classList.toggle("active", +s.dataset.step === stage));
      const spin = motionOK() ? progress * Math.PI * 1.6 : 0.6;
      r.set({ stage, ry: 0.4 + spin, rx: 0.45 + Math.sin(progress * Math.PI) * 0.35, rotate: false });
    };
    const onScroll = () => { if (inView) update(); };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) update(); }).observe(track);
    update();
  }

  /* ---------------- Project detail overlay (hash routed) ---------------- */
  const detail = $("#detail"), content = $("#detailContent"), closeBtn = $("#detailClose");
  // Everything outside the dialog is made inert while it is open.
  const backdropEls = Array.from(document.body.children).filter(el => el !== detail && el.tagName !== "TEMPLATE" && el.tagName !== "SCRIPT");
  const setInert = on => backdropEls.forEach(el => (el.inert = on));
  const focusables = () => $$('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])', detail)
    .filter(el => el.offsetParent !== null || el === closeBtn);
  let openSlug = null, returnFocus = null, lastScroll = 0;
  // True when the current dialog's "#project/…" entry was pushed by us (a click),
  // so closing can pop it with history.back() instead of pushing another entry.
  let pushedEntry = false;

  function cardFor(slug) { return $(`.proj[data-project="${slug}"]`); }

  function fillDetail(slug) {
    const tpl = $(`#tpl-${slug}`);
    if (!tpl) return false;
    $$("[data-vis]", content).forEach(el => el._cleanup && el._cleanup());
    content.replaceChildren(tpl.content.cloneNode(true));
    mountVisuals(content);
    return true;
  }

  function openDetail(slug, { fromClick = false, trigger = null } = {}) {
    if (openSlug === slug) return;
    const card = cardFor(slug);
    if (!fillDetail(slug)) return;
    const wasOpen = !!openSlug;
    openSlug = slug;
    const show = () => {
      if (!wasOpen) lastScroll = scrollY;
      detail.hidden = false; detail.classList.add("open");
      detail.scrollTop = 0;
      document.body.classList.add("noscroll");
      setInert(true);
      requestAnimationFrame(() => requestAnimationFrame(() => detail.classList.add("in")));
      closeBtn.focus({ preventScroll: true });
    };
    if (fromClick) returnFocus = trigger || (card && $(".open", card));
    const fromCard = !!(trigger && card && card.contains(trigger));
    const media = card && $(".projMedia", card), target = $(".detailMedia", content);
    if (fromCard && motionOK() && document.startViewTransition && media && target && !wasOpen) {
      media.style.viewTransitionName = "project-media";
      const vt = document.startViewTransition(() => { media.style.viewTransitionName = ""; target.style.viewTransitionName = "project-media"; show(); });
      vt.finished.finally(() => { target.style.viewTransitionName = ""; media.style.viewTransitionName = ""; });
    } else show();
  }

  function closeDetail() {
    if (!openSlug) return;
    const slug = openSlug; openSlug = null;
    const finish = () => {
      detail.classList.remove("open", "in"); detail.hidden = true;
      document.body.classList.remove("noscroll");
      setInert(false);
      $$("[data-vis]", content).forEach(el => el._cleanup && el._cleanup());
      content.replaceChildren();
      const card = cardFor(slug);
      const target = returnFocus && returnFocus.isConnected ? returnFocus : card && $(".open", card);
      target?.focus({ preventScroll: true });
      returnFocus = null;
    };
    if (motionOK() && document.startViewTransition) document.startViewTransition(finish); else finish();
  }

  // Close from the UI (button, Escape, backdrop). Pops our own history entry when
  // there is one; a directly-linked dialog is closed in place instead.
  function requestClose() {
    if (!openSlug) return;
    if (pushedEntry) { history.back(); return; }
    history.replaceState(null, "", location.pathname + location.search);
    closeDetail();
  }

  function route() {
    const m = location.hash.match(/^#project\/([a-z0-9-]+)$/);
    if (m) openDetail(m[1]);
    else if (openSlug) { pushedEntry = false; closeDetail(); }
  }
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#project/"]');
    if (!a || e.metaKey || e.ctrlKey || e.button !== 0) return;
    e.preventDefault();
    const slug = a.getAttribute("href").slice(9);
    if (openSlug) history.replaceState(null, "", `#project/${slug}`); // switching dialogs keeps one entry
    else { history.pushState(null, "", `#project/${slug}`); pushedEntry = true; }
    openDetail(slug, { fromClick: true, trigger: a });
  });
  closeBtn.addEventListener("click", requestClose);
  detail.addEventListener("click", e => { if (e.target === detail) requestClose(); });
  addEventListener("keydown", e => {
    if (!openSlug) return;
    if (e.key === "Escape") { requestClose(); return; }
    if (e.key !== "Tab") return;
    const els = focusables();
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && (document.activeElement === first || !detail.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !detail.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  addEventListener("hashchange", route);
  addEventListener("popstate", route);
  route();

  /* ---------------- Misc ---------------- */
  $("#year").textContent = new Date().getFullYear();
})();
