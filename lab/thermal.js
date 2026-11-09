const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
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
  export function mountThermal(el, opts = {}) {
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
        <text x="8" y="192" font-size="7" font-family="Archivo,sans-serif" fill="rgba(255,255,255,.75)">Max distance ${state.range.toFixed(2)}</text>
      </svg>`;
    };
    render();
    return { set(p) { Object.assign(state, p); render(); } };
  }
