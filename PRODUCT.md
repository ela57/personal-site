# Ethan Lam — personal portfolio

A static, no-build portfolio for a Georgia Tech computer engineering student.
The public `/` is a six-station forest journey. `/projects/` is its persistent
direct-view alternative, retaining three real projects as a curated exhibition, then two interactive lab
panels, a draft Approach section, About, and email contact. Use expanded project
copy grounded in the case studies, reusable word effects and a five-stage renderer
scroll story with static fallbacks. Preserve project facts, annotations, case-study
hash routes, chess puzzles, strategy sandbox, and the renderer bench inside its
case study. No GitHub links or PE-worm project.

Both surfaces read `content/projects.js` / `content/destinations.js`; regenerate
committed no-JS snapshots with `node journey/generate.js`. Preserve legacy root
hash redirects, station/lab deep links and Back. Placeholders show Content needed,
without Open links. The original Python/Unity implementations are not running:
renderer and thermal remain explicitly browser illustrations.

The generic lab presenter reads five-stage entries from `content/labs.js`, mounts
one stage at a time, fetches actual Inspect source, traps/restores focus and locks
world scrolling/rendering until exit. Strategy and chess are the current labs.
Add a lab by adding its definition and, where needed, a reusable mount adapter;
do not add lab-specific branches to the presenter.

`/dev/` is a noindex prototype gallery driven by `content/prototypes.js`, with
six editorial scores/rationales, classification/source metadata, filters and
lazy abortable previews. Add a prototype mount plus a registry entry, then test
its schema, interactions and teardown. `/dev/motion.html` is a separate noindex
eight-technique camera comparator with scrub/wheel/play, speed/damping and
reduced-motion cuts. Neither dev surface belongs in public navigation.

`docs/journey/CURATION.md` records recommendations, a proposed final station
outline and the evidence needed to unlock unsupported destinations. Curation is
not automatic promotion: generic SCOMP/FSM, exploded hardware and the sampled 3D
price ribbon stay experiments, not coursework/results claims.

Only SwiftShader/software fps has been measured; the prior art-pass median was
6.42 fps at DPR .65, not a smooth-performance pass. Hardware GPU, real-device and
battery performance remain unverified. Keep demand rendering, hidden-tab pause,
DPR caps and direct/static alternatives; validate hardware before expanding effects.

Use existing content and local assets. No new runtime dependencies beyond the existing vendored libraries. Keyboard
navigation, visible focus, responsive layouts, reduced motion, and complete image
fallbacks are requirements. Run `source ~/.nvm/nvm.sh && npm test`.
