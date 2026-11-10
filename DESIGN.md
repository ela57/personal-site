# Forest lake at dawn

## Journey and direct-view surfaces

The public `/` is the static ePortfolio, sharing `/projects/` content and visual
system: Welcome, selected work, project/lab write-ups, About and Contact. Do not
mount automatic canvases or load WebGL/Three.js on these direct pages. Keep the
optional journey link small and only at the bottom, labelled “Experimental
interactive version”; project/lab overlays remain opt-in.

`/explore/` is the full-bleed layered forest/lake world (`journey/world.js`). Use an authored, reversible
route with station dwells, level horizon, restrained travel and real project
panels: translucent left overlays on desktop, bottom sheets on mobile. Keep
installations in the unobscured right-side framing. Explicit labels belong to
projects; unsupported entries say Content needed and have no action.

The six stations are Entrance, Observatory, Archive, Workshop, Clearing and
Overlook. Reduced motion uses instant cuts/static water and typography; static,
no-WebGL and no-JS views retain readable destinations. Preserve native scrolling,
focus, station keys, Back/deep links and a persistent `/` alternative. Home and
“Use static view” return to `/`. Legacy root journey URLs preserve query/hash
state when redirected to `/explore/`; direct project/lab hashes stay on `/`.

Five-stage labs use one accessible full-screen presenter: Encounter, Understand,
Experiment, Inspect, Reflect. Keep copy/live surfaces in consistent positions,
stack on mobile, lock world scrolling and pause rendering, and restore focus and
exact scroll on exit. Inspect uses real source ranges, numbered rows and hanging
wrapped lines rather than horizontal code scrolling.

`/dev/` is a noindex, non-public curation gallery with stable preview windows,
lazy mounts/teardown, source/classification metadata and scored comparisons.
`/dev/motion.html` compares eight camera techniques; it is not public navigation.
The historical ribbon is a thin sampled line with a bright edge, sparse year
posts and a camera-following date marker, not an area slab or precise chart.
See `docs/journey/CURATION.md` for proposed promotions, weak items and content gaps.

Only software-rendered fps is available (earlier art-pass median 6.42 fps on
SwiftShader at DPR .65). Hardware smoothness is unverified; do not present demand
rendering or qualitative cost scores as a successful GPU performance benchmark.

## Direct project view visual system

In `/` and `/projects/`, one fixed photograph continues behind the page. Pale sky
supports the hero; a forest veil reaches 72% at Work and 90% by About. The direct
pages do not load the animated WebGL water effect.

- Source Serif 4: display, project titles, large figures. Archivo: prose, UI,
  metadata; tabular numerals where useful. Sentence-case labels, 13–14px/500,
  no tracked uppercase. Ink #13201B, mist #ECE7DC, forest #0F1A15,
  dawn #E3B677 for focus and restrained accents.
- One 12-column grid: wide paper renderer plate left; narrow thermal text left
  and lower dark plate right; nearly full-width real volatility chart, oversized
  R² figure and supporting column below. Keep annotations and explicit links.
- Renderer and thermal previews use responsive linked illustrations; their live
  visuals and annotations remain in the case studies. Volatility keeps its chart.
- Lab uses two large linked playable panels, with a real first-puzzle board and
  bundled SPY / moving-average preview. Approach connects the projects' methods.
  About is quieter prose, experience, education,
  and a three-row toolbox. Contact uses a large serif email link.
- Overlays and controls use a deep-green reading surface with mist text; image
  plates remain paper. Scrolled nav uses a 90% forest band and a mist hairline.
- Fine-pointer image hover: at most 1.02 scale, 300ms ease-out. Honor reduced
  motion, 44px nav targets, visible focus, and no horizontal page overflow.
- Reusable selectable character effects: stable-width word cycles and once-only
  heading reveals (35ms/character, under 700ms). Pause control, static reduced-motion
  and no-JS text. Hero: “I like to build” with four real project subjects.
- The renderer pipeline shows static figures beside all five focusable steps;
  the live renderer remains available inside its opt-in case study.
  Chart annotations map to actual image bounds inside a paper mat; no chart zoom.

Static HTML, CSS and vanilla JS only. Local responsive AVIF/WebP images and fonts.
The photograph was generated for this site.
