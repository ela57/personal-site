import { createRenderer } from "./lab/renderer.js";
import { mountThermal } from "./lab/thermal.js";
/* Ethan Lam · navigation, project visuals, annotations and case-study overlays. */
import { imagePoint } from "./lab/lake/annotations.js";
import { mountWords } from "./lab/words.js";
import { mountPipeline } from "./lab/pipeline.js";
import { parseDetailRoute } from "./lab/detail-routing.js";
mountWords();
const staticPortfolio = document.body.hasAttribute('data-static-portfolio');
import("./lab/lake/lake.js").then(({ mountLake }) => mountLake({ interactive: !staticPortfolio }));

(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const motionOK = () => !reduceMotion.matches;

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
    setCurrent(en.target.id);
  }), { rootMargin: "-45% 0px -50% 0px" });
  // The last section can be too short to reach the observer band; at the end of the page it's current.
  addEventListener("scroll", () => { if (atBottom()) setCurrent("contact"); }, { passive: true });
  ["top", "projects", "lab", "about", "contact"].forEach(id => { const el = document.getElementById(id); if (el) sectionIO.observe(el); });

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
      const frame = vis.getBoundingClientRect(), bounds = fig.getBoundingClientRect();
      const W = frame.width, H = frame.height;
      if (!W) return;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.style.cssText = `left:${frame.left - bounds.left}px;top:${frame.top - bounds.top}px;width:${W}px;height:${H}px;aspect-ratio:auto`;
      const small = innerWidth < 720;
      const legend = $(".notes", fig);
      legend.style.height = small ? "" : `${H}px`;
      const image = $("img,canvas,svg", vis);
      const imageBounds = image ? image.getBoundingClientRect() : frame;
      parts.forEach(pt => {
        const target = pt.key && live[pt.key];
        const at = target ? [target[0] + imageBounds.left - frame.left, target[1] + imageBounds.top - frame.top] : imagePoint(pt.at, imageBounds, frame);
        const [tx, ty] = at;
        pt.c.setAttribute("cx", tx); pt.c.setAttribute("cy", ty); pt.ring.setAttribute("cx", tx); pt.ring.setAttribute("cy", ty);
        pt.c.setAttribute("r", small ? 9 : 3);
        pt.t.setAttribute("x", tx); pt.t.setAttribute("y", ty);
        if (small) return;
        const label = pt.li.getBoundingClientRect();
        const lx = (pt.li.dataset.side === "l" ? label.right : label.left) - frame.left;
        const ly = label.top + label.height / 2 - frame.top;
        pt.p.setAttribute("d", `M${tx.toFixed(1)} ${ty.toFixed(1)} L${lx.toFixed(1)} ${ly.toFixed(1)}`);
      });
    };
    const observer = new ResizeObserver(layout); observer.observe(vis);
    $("img", vis)?.addEventListener("load", layout, { once: true });
    const oldCleanup = fig._cleanup;
    fig._cleanup = () => { observer.disconnect(); oldCleanup?.(); };
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
      if (kind === "renderer") {
        const c = document.createElement("canvas"); c.className = "rendererCanvas";
        c.setAttribute("role", "img");
        c.setAttribute("aria-label", "Shaded icosahedron with backface culling, depth sorting and diffuse lighting.");
        el.appendChild(c);
        let anno = null;
        const r = createRenderer(c, { stage: 3, scale: el.hasAttribute("data-big") ? 0.4 : 0.34, drag: el.hasAttribute("data-big"),
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
  if (!staticPortfolio) mountPipeline(createRenderer);

  /* ---------------- Interaction B: case-study overlay (hash routed) ---------------- */
  const ORDER = ["renderer", "thermal", "vol"];
  const TITLES = { renderer: "Software 3D renderer", thermal: "Thermal-vision shader", vol: "Realized volatility & SPY" };
  const detail = $("#detail"), content = $("#detailContent"), closeBtn = $("#detailClose");
  const countEl = $("#detailCount"), nextEl = $("#detailNext");
  const backdropEls = Array.from(document.body.children).filter(el => el !== detail && el.tagName !== "TEMPLATE" && el.tagName !== "SCRIPT");
  const setInert = on => backdropEls.forEach(el => (el.inert = on));
  const focusables = () => $$('a[href], button:not([disabled]):not([tabindex="-1"]), select, input:not([disabled]), [tabindex]:not([tabindex="-1"])', detail).filter(el => el.offsetParent !== null);
  let openSlug = null, openDataset = null, returnFocus = null, pushedEntry = false, enterTimer = 0;
  const cardFor = slug => $(`.proj[data-project="${slug}"]`);
  let labCleanup = null, pipelineCleanup = null, labVersion = 0;
  const cleanup = () => {
    labVersion++; labCleanup?.(); labCleanup = null;
    pipelineCleanup?.(); pipelineCleanup = null;
    $$("[data-vis], [data-bench], [data-annotate]", content).forEach(el => el._cleanup && el._cleanup());
  };

  function fillDetail(slug) {
    const tpl = $(`#tpl-${slug}`);
    if (!tpl) return false;
    cleanup();
    content.replaceChildren(tpl.content.cloneNode(true));
    const isLab = slug.startsWith("lab-");
    nextEl.hidden = isLab;
    if (isLab) {
      const chess = slug === "lab-chess";
      countEl.textContent = chess ? "Lab / 01 · Chess puzzles" : "Lab / 02 · Strategy sandbox";
      const version = labVersion, host = $(chess ? "[data-chess]" : "[data-strategy]", content);
      const module = chess ? import("./lab/chess/board.js") : import("./lab/strategy/sandbox.js");
      module.then(exports => {
        if (version === labVersion && host.isConnected) labCleanup = chess ? exports.mountChess(host) : exports.mountStrategy(host, { initialDataset: parseDetailRoute(location.hash)?.dataset });
      }).catch(() => {
        if (version === labVersion) host.textContent = "The experiment could not load. Close and reopen to try again.";
      });
      return true;
    }
    const i = ORDER.indexOf(slug), next = ORDER[(i + 1) % ORDER.length];
    countEl.textContent = `Case study ${String(i + 1).padStart(2, "0")} / ${String(ORDER.length).padStart(2, "0")}`;
    nextEl.href = `#project/${next}`;
    nextEl.textContent = `Next: ${String(ORDER.indexOf(next) + 1).padStart(2, "0")} ${TITLES[next]} →`;
    mountVisuals(content);
    pipelineCleanup = mountPipeline(createRenderer, content, detail);
    return true;
  }
  const withTransition = (fn, a, b) => {
    if (!(motionOK() && document.startViewTransition && a && b)) { fn(); return; }
    a.style.viewTransitionName = "project-media";
    const vt = document.startViewTransition(() => { a.style.viewTransitionName = ""; b.style.viewTransitionName = "project-media"; fn(); });
    vt.finished.finally(() => { a.style.viewTransitionName = ""; b.style.viewTransitionName = ""; });
  };

  function openDetail(slug, { trigger = null } = {}) {
    const dataset = parseDetailRoute(location.hash)?.dataset;
    if (openSlug === slug && (slug !== 'lab-strategy' || openDataset === dataset)) return;
    const wasOpen = !!openSlug, card = cardFor(slug);
    const show = () => {
      if (!fillDetail(slug)) return;
      openSlug = slug;
      openDataset = dataset;
      detail.hidden = false; detail.scrollTop = 0;
      document.body.classList.add("noscroll"); setInert(true);
      detail.classList.remove("entering"); void detail.offsetWidth; detail.classList.add("entering");
      clearTimeout(enterTimer); enterTimer = setTimeout(() => detail.classList.remove("entering"), 1600);
      closeBtn.focus({ preventScroll: true });
    };
    if (trigger) returnFocus = trigger;
    const fromCard = !wasOpen && trigger && card && card.contains(trigger);
    if (!$(`#tpl-${slug}`)) return;
    if (fromCard && $(".plate[data-annotate] .plateVis", card) && motionOK() && document.startViewTransition) {
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
      const target = returnFocus && returnFocus.isConnected ? returnFocus : card ? $("a.more, .more a", card) : $(`a[href="#lab/${slug.slice(4)}"]`);
      target && target.focus({ preventScroll: true });
      returnFocus = null;
    };
    const from = $(".csMedia .plateVis", content), to = card && $(".plate[data-annotate] .plateVis", card);
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
    const slug = parseDetailRoute(location.hash)?.slug;
    if (slug && (ORDER.includes(slug) || ["lab-chess", "lab-strategy"].includes(slug))) { openDetail(slug); }
    else if (openSlug) { pushedEntry = false; closeDetail(); }
  }
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#project/"], a[href^="#lab/"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const hash = a.getAttribute("href");
    const slug = parseDetailRoute(hash)?.slug;
    if (!slug) return;
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
