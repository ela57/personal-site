# Journey curation — Pass 3

This is a proposal, not a claim that gallery prototypes have been promoted into
the public journey. The current public lab definitions are strategy and chess;
the other previews remain at `/dev/`, which is noindex and absent from public nav.
Evidence boundaries come from `content/projects.js` and the historical
[audit](AUDIT.md). The audit describes an earlier site revision, not today's routes.

## Inventory and scoring

Prototype scores below are copied from `content/prototypes.js`, in order:
**connection / visual / clarity / distinctiveness / performance cost / maintenance
effort**. All are 1–5 editorial judgments: higher first-four scores are desirable;
higher last-two scores mean **more** cost/effort. They are not timings or hardware
benchmarks. The registry retains each score's rationale. Techniques and journey
features have no independent registry scores; `—` means not scored, rather than
borrowing the motion playground's rating or inventing measurements.

Label key: **W** = Working project integration; **I** = Illustrative simulation;
**R** = Research prototype; **P** = Proposed future feature. Labels describe the
experience, not Ethan's original runtime or an unsupported résumé achievement.

### Every registered prototype

| Prototype ID | Scores | Data/source | Label | Performance cost | Maintenance |
| --- | --- | --- | --- | --- | --- |
| strategy-risk | 5/4/4/4/3/2 | `lab/strategy/engine.js`, `lab/strategy/data/spy.json` | W | 35 SMA backtests in disposable worker | Shared engine; local grid and fitted axes |
| realized-vol | 4/4/5/3/2/2 | `lab/strategy/data/spy.json`, `prototypes/finance.js` | R | Linear rolling calculation; two SVG paths | Estimator/window semantics; no event feed |
| poker-replay | 5/4/4/5/2/3 | Poker export A; `tools/export_poker.py` | R | One observation at a time | Preserve hero-only observation allowlist |
| poker-inspector | 5/3/4/4/1/2 | Poker export A; `tools/export_poker.py` | R | Filters 200 observations | Shared selection/schema; no inferred diagnostics |
| poker-session | 5/4/3/3/2/3 | Poker export B; `tools/export_poker.py` | R | 200 SVG points, one line | Public totals/note allowlist and identity checks |
| chess-preview | 5/4/5/3/1/1 | `lab/chess/board.js`, `puzzles.js`, `tests/chess-puzzles.test.js` | W | 64 squares; interaction-only updates | Existing validated board and puzzle adapter |
| renderer-play | 5/4/4/4/2/2 | `lab/renderer.js`, `lab/pipeline.js`, `main.js` | W | 20 triangles, demand Canvas redraw | Shared defaults with direct-view bench |
| thermal-gallery | 5/4/5/3/2/2 | `lab/thermal.js`, `main.js` | I | Four SVG thumbnails and live view | Four presets, shared mount; no Unity runtime |
| project-map | 5/4/4/4/1/1 | `journey/route.js`, `content/projects.js`, `content/destinations.js` | W | One SVG route and six markers | Reads shared station/project membership |
| guided-tour | 5/4/4/3/5/2 | `journey/tour.js`, `journey/main.js` | W | Gallery iframe runs another full world; in-page tour reuses world | Four captions and navigation adapter |
| accumulator | 2/3/4/4/1/3 | `prototypes/accumulator-engine.js`, `accumulator.js` | I | Bounded integer interpreter; interaction-only DOM | Original generic ISA and its tests |
| moore-fsm | 2/4/5/4/1/2 | `prototypes/fsm-engine.js`, `fsm.js` | I | Six SVG traces, last 24 clocks | Generic transition/output functions |
| motion-playground | 4/4/4/5/4/3 | `dev/motion.html`, `motion.js`, `motion-poses.js`, `journey/world.js`, bundled SPY | I | Full WebGL world even with reduced card counts | Eight paths, display controller, sampled ribbon |

Poker A is `prototypes/data/poker-run.json`: 200 hero decision observations across
145 hands, 20 featured. Poker B is `prototypes/data/poker-session.json`: 200
card-free hand-boundary summaries with narrowly derived public fold notes. Both
come from `ela57/pokerbot`, seed **1000000**, commit
`eb245bfc6ec94a1f7158c30b403d6b5a07b4a878`, run
`runs/20261108T035626Z_b7c81b` (`journey-audit-a`). Missing decisions remain missing;
no opponent hole cards, showdown cards or inferred later boards are exported.

### Every motion technique

These all share `dev/motion-poses.js`, `dev/motion.js` and the forest assets in
`journey/world.js`. They are **I** camera studies, not finished project capabilities.

| Technique | Scores | Additional source | Label | Performance cost | Maintenance |
| --- | --- | --- | --- | --- | --- |
| forward | — | Authored entrance/observatory poses | I | One damped camera, forest rendering | Keep sightlines clear |
| curved | — | `journey/route.js`, reused foreground fern | I | Transparent foliage/overdraw | Avoid buildings and excessive close-card occlusion |
| orbital | — | Observatory installation | I | More visible installation sides | Small authored arc; no full spin |
| portal | — | Renderer text in `content/projects.js` | I | Three frame bars, DOM crossfade; depth-tested foliage cutouts | Check alpha/depth ordering and panel focus |
| horizontal | — | Workshop bench geometry | I | Several benches visible at once | Bench spacing and readable targets |
| exploded | — | Four generic box layers | I | Four meshes and projected labels | Does not establish coursework/hardware provenance |
| timeline | — | `dev/timeline-ribbon.js`, `lab/strategy/data/spy.json` | I | Sampled thin extrusion, bright edge, sparse year posts, one marker | Sampling/date labels, normalization and camera framing |
| overview | — | Whole route/world | I | Largest visible scene area | High-angle fog, map legibility and reversible return |

### Current journey features

| Feature | Scores | Source | Label | Performance cost | Maintenance |
| --- | --- | --- | --- | --- | --- |
| Forest, lake, trail and six installations | — | `journey/world.js`, `assets/journey/` | I | Textures, water, fog, instanced cards and geometry | Art/alpha/sightline regressions; generated scenery is not a real place |
| Authored camera, dwells and reversible scroll | — | `journey/route.js`, `journey/main.js` | W | Damped frames while moving | Pose, horizon, speed and station-boundary tests |
| Full-bleed canvas and translucent station panels | — | `journey/site.css`, `content/destinations.js` | W | Scrim/blur and readable DOM | Contrast, mobile bottom sheet, installation framing |
| Shared project/classification and placeholder policy | — | `content/projects.js`, `content/destinations.js`, `journey/generate.js` | W | Generated static HTML plus DOM replacement | Regenerate snapshots; placeholders have no Open link |
| Header, location/progress, destination menu and keys | — | `journey/main.js`, `journey/shell.html` | W | Small DOM updates | Focus and native scroll; `[ ]` / Alt+Arrow station navigation |
| Station/lab history, deep links and legacy redirects | — | `journey/main.js`, `lab-routing.js`, `index.html`, `journey.html` | W | Event-driven | Push vs replace history, Back and exact scroll restoration |
| Reduced motion, static/no-WebGL and no-JS routes | — | `journey/main.js`, CSS, generated HTML | W | Cuts/static landscape instead of travel | Keep real station content and direct links accessible |
| Hero word cycle | — | `journey/presentation.js`, `lab/words.js` | W | Small DOM effects while enabled | Stable width, Pause, static reduced-motion text |
| Demand rendering, hidden-tab pause, DPR/FXAA | — | `journey/main.js`, `antialias.js` | W | Caps resolution; FXAA adds a pass | Context loss, idle rendering, GPU-dependent quality |
| Direct project view and All destinations | — | `projects/index.html`, `projects/destinations.html`, `main.js` | W | Static figures; live mounts only where used | Keep case studies, old hashes and no-JS copy working |
| Generic five-stage dialog and wrapped Inspect source | — | `content/labs.js`, `journey/lab-presenter.js`, CSS/routing | W | Mount current stage; runtime source fetch | Abort/teardown, focus trap, history, numbered source ranges |
| Strategy five-stage lab | — | `lab/strategy/lab.js`, `sandbox.js`, `engine.js`, bundled SPY | W | Charts/backtest per mount | Twice-mount safety; lag/cost/data assumptions |
| Chess five-stage lab | — | `lab/chess/lab.js`, `board.js`, `puzzles.js`, vendored chess.js | W | Legal move checks and board DOM | Puzzle validation, keyboard interaction and read-only Encounter |
| Lazy development gallery and score table | — | `dev/index.html`, `gallery.js`, `content/prototypes.js` | W | Only visible previews run; stable scrolling windows | Abortable mounts, sortable scores, labels and source validity |

## Recommendations

### Main journey

- **Forest/lake installations, authored dwells, panels and shared content.** Keep
  these as the spatial spine, with only one useful encounter per supported stop.
  The environment should persist behind readable text, not compete with it.
- **Header, station history, keys, direct view and accessibility fallbacks.** These
  are essential navigation, not optional spectacle. Preserve Back, exact lab-exit
  scroll restoration, no-JS destination lists and reduced-motion station cuts.
- **Demand rendering and restrained hero typography.** Keep idle/hidden-tab
  suspension and a pauseable word cycle. They provide polish without requiring
  another continuously rendered surface.
- **Five-stage presenter, strategy and chess labs.** These have real tested live
  systems and prove that one presenter can explain different work. Keep Inspect
  source truthful and readable; controls belong inside Experiment, not over travel.
- **strategy-risk.** It exposes the existing engine's parameter sensitivity in one
  compact picture. Use a deliberate selected pair and explicit in-sample label,
  not a leaderboard suggesting validated profitability.
- **renderer-play.** The actual site renderer makes a strong Workshop encounter
  with visible cause and effect. Keep the Canvas/Python distinction beside it and
  avoid turning all six controls into mandatory station-reading work.
- **chess-preview.** A real move on a validated board is a clear Clearing invitation.
  Reuse the existing five-stage chess lab instead of creating another puzzle system.
- **poker-replay.** Hero-only observations are unusually specific evidence of the
  bot's information boundary. Keep it recorded and partial; do not imply a live
  opponent, complete omniscient hand or measured playing strength.
- **project-map.** Offer it as a compact overview/destination control, not another
  mandatory cinematic stop. It is cheap and reads the same route/membership data.
- **Forward, curved and horizontal motion.** Use forward travel for arrival,
  restrained curves for continuity/occlusion, and sideways motion at Workshop.
  Keep the installation visible at rest and avoid driving into geometry or masking
  the view for long stretches.

### Optional detours

- **realized-vol.** It is useful context for the Observatory research, but it uses
  close-to-close SPY returns rather than the notebook's GK estimator. Keep the
  distinction explicit and offer it after the real research figures.
- **poker-inspector.** Requested/applied actions and diagnostics reward a technical
  reader after the replay. Structured records are too dense for the first arrival.
- **poker-session.** Promote from the registry's current `experiment` recommendation
  only as a replay navigator, not an achievement graph. The late sawtooth is real
  small-blind folding behavior; the new hover notes explain it without smoothing.
- **thermal-gallery.** Four presets communicate the illustration quickly and reuse
  existing code. Keep it optional: the repo still has no original Unity/HLSL source
  and this SVG is not a GPU shader or thermal sensor.
- **guided-tour.** Offer the in-page tour as an opt-in alternative to free scroll,
  never an automatic takeover. Do not ship the gallery iframe as the final public
  integration because that would duplicate the WebGL world.
- **Orbital reveal.** Use only a short Observatory arc if it improves the first
  reveal. A full orbit spends motion budget on the building instead of the work.
- **Portal.** It can motivate entry into a detailed project after an explicit user
  choice. The depth-sorted foliage fix cleans the view, but focus/routing should
  still use the existing accessible presenter rather than a second modal system.
- **Overview return.** Offer a deliberate orientation/reset action near the end.
  It exposes more geometry and fog, so the cheap SVG map must remain available.

### Experiments

- **accumulator.** Keep this a generic educational machine, not Ethan's SCOMP work.
  Its clarity does not replace missing coursework source, official semantics or
  a real trace; connection is only 2/5.
- **moore-fsm.** The LEDs and timing diagram are a good interaction but weak evidence
  of Ethan's design. Keep it experimental until his VHDL/specification/testbench
  material exists, and retain “not Ethan's VHDL.”
- **Exploded hardware.** Separating labelled boxes is useful camera vocabulary but
  currently demonstrates no real assembly. Do not place it at a coursework station
  until actual component relationships and evidence can drive the sequence.
- **Timeline ribbon.** The thin ribbon, bright top edge, year posts and moving date
  marker are now more legible than a gold area slab. Still keep it experimental:
  normalized height, sampled/interpolated geometry and perspective lack the precise
  axes of a good finance chart, and 3D adds no established analytical benefit.
- **motion-playground.** Keep the eight-way comparator dev-only as an art-direction
  tool. A gallery of camera techniques should not become the visitor's main task.
- **Unsupported destination experiences.** Keep the six empty destinations marked
  Content needed, without Open links. Generic demos and attractive buildings cannot
  supply the missing historical/technical evidence.

## Proposed final journey outline

This is the proposed next integration, not work silently shipped by this pass.

| Station | First encounter / deeper material | Motion |
| --- | --- | --- |
| Entrance | Ethan Lam, real word cycle, brief route invitation; optional map and tour | Open lake rest, then short forward travel |
| Observatory | Strategy risk field / Enter strategy lab; real volatility case study, optional close-to-close timeline; Portfolio Manager text only | Small orbital reveal, then dwell; no 3D finance ribbon in the main route |
| Archive | Quiet route marker and honest Content needed for Data Universe / human-interaction research | Gentle curved travel; no fabricated exhibit or mandatory stop |
| Workshop | Site renderer encounter and project detail; optional thermal gallery; unsupported hardware/malware stay placeholders | Sideways bench travel, rest; optional portal-style entry using accessible lab navigation |
| Clearing | One chess puzzle / Enter chess lab; recorded hero poker replay, optional inspector/session navigator | Curved approach with brief fern occlusion, stable stone-table framing |
| Overlook | Existing About/education/contact and résumé-request link, not a nonexistent PDF | Calm arrival; optional rise-to-overview and return, SVG map alternative |

Keep Exploded and Timeline modes in the playground. Travel should be reversible,
with readable dwells, no roll and no travel under reduced motion; the world pauses
while a lab owns focus and scrolling.

## Content gaps and exact unlock material

| Destination / gap | What is missing | Material that would unlock it |
| --- | --- | --- |
| Data Universe (`needsContent`) | No point-in-time universe/constituent or survivorship evidence | Dated membership/security-master samples including delistings, field dictionary, source/license and adjustment rules, plus Ethan's code/notebook and explanation of his role; SPY closes are not a substitute |
| Human-interaction research (`needsContent`) | No question, protocol, methods, measures or results | Approved project summary with role/dates, study protocol and measures, consent/ethics context, anonymized aggregate data or publishable figures, analysis and limitations; no identifiable participant records |
| Malware / IDA CFG (`needsContent`) | No safe graph, analysis or provenance | A sanitized defensive CFG export (nodes/edges/basic-block labels), permission/provenance and analysis notes/screenshots identifying Ethan's contribution; no live malware binary is needed |
| SCOMP (`needsContent`) | No coursework program, intended ISA or execution trace | Ethan's permitted assembly source, assignment/ISA reference and a known input/output trace with register/memory states; replace generic semantics only after verifying them |
| VHDL / palletizer FSM (`needsContent`) | No actual design, testbench or waveform | Permitted VHDL modules, state/input/output specification, reset/clock semantics, testbench, representative waveform and hardware/demo evidence if hardware is claimed |
| Chess Buddies (`needsContent`) | No verified leadership facts | Approved role/organization name, dates, responsibilities, concrete activities and evidence/permission for any outcomes or photos; puzzle code establishes none of this |
| Portfolio Manager (text supported, integration P) | Existing experience copy but no inspectable controller or results | Sanitized allocation/rebalance/risk-controller code, configuration/schema, reproducible input/output sample and evaluation methodology; verified out-of-sample results only if supplied |
| Original Python renderer | Only case-study description and the site's Canvas illustration | Permitted Python source, dependencies and known render/reference inputs; retain the browser-illustration distinction until then |
| Original thermal implementation | No Unity/HLSL source/build | Shader/C# source, Unity/version/material setup, sample depth inputs and reference captures; do not describe SVG presets as original shader execution |
| Résumé download | Contact/request integration exists, no PDF file | An approved current, accessible résumé file with publication permission; keep the request-email link meanwhile |

Do not invent results, participant counts, employment dates, hardware behavior,
leadership achievements or original-code provenance to fill these gaps.

## Poker finding and performance limits

The exporter indexes `starting_stacks[hero_seat]` and `ending_stacks[hero_seat]`;
the recorded hero is seat 0 in all 200 hands. Comparing export B to the raw run
found **0 mismatches** and **0 hand-boundary discontinuities** across the full stack
vectors. In hands 185–200 the sole logged action alternates a seat-0 fold and a
seat-4 fold, each preflop, with 200/400 blinds: hero ends at 590 on odd hands and
790 on even hands. This disproves the chart's start/end-mixing and seat-switching
hypotheses; it is recorded heads-up small-blind transfer behavior. The exporter
now derives explanatory notes only for matching public single-fold boundaries,
and the chart displays them on hover and selection. No underlying totals changed.

The portal frame contains three opaque bars and no inner plane. A browser A/B
check isolated its rectangular artifact to transparent instanced tree batches:
they had blending enabled and depth writes off, so instances could composite in
the wrong order. In portal mode only, the playground uses their existing alpha
test with depth-writing cutouts; other modes retain their original soft foliage.

Only **software-rendered SwiftShader** fps has been measured. Earlier forward-scroll
samples were approximately 9.99 median fps before the art pass and **6.42 median
fps** afterward (24-second sample, DPR .65); neither is a smooth-performance pass
or a benchmark of this revised playground. Hardware-GPU performance, battery cost
and real-device behavior remain unverified. Demand rendering, hidden-tab pauses,
instancing, DPR caps, lazy teardown and lower playground card counts reduce work
but are not evidence of meeting a frame budget. Budget decisions require a real
mid-range laptop/mobile GPU check before promoting more effects into the main route.
