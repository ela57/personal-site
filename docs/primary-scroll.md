# Primary portfolio integration

## Graphics

`content/graphics.js` maps the eight approved subjects to responsive 800/1600 WebP pairs and evidence-specific alt text. `previewPicture()` is shared by the static destination lists, gallery and generated overlay headers. The registry's preview assets are now these pairs; inline pipeline frames, chess piece licensing and original research figures are retained as evidence.

`journey/generate.js` refreshes `/`, `/projects/`, standalone destinations and the reading pages. It also replaces the original selected-work/game previews and supplies the renderer social image. The five available project/lab overlays have new header images; their existing interactive demos remain intact. Poker and the two leadership records still use their existing destination/experience/About links, not invented overlays.

Old assets have not been deleted: the experiments still use illustrative imagery and the pipeline/research figures remain explanatory artefacts. The journey/world is unchanged. The volatility preview uses bundled close-to-close data, not the original notebook's OHLC sample; the image alt text and source manifest preserve that distinction. Thermal is explicitly illustrative.

## Scroll effects

`eportfolio/scroll-scheduler.js` is the sole scroll/rAF scheduler used by both the experiment gallery and the primary-page adapter. Measurement returns the frame's scroll value after layout reads; ordinary frames sample it once. Events coalesce, visible marquees request subsequent frames, and hidden documents stop. Persisted `pagehide` suspends without destroying listeners; `pageshow` remeasures/resumes. Non-persisted exits dispose listeners. `scroll-effects.js` shares the experiment's word-opacity, marquee, stack and SVG-path calculations.

| Port | Primary surface | Fallback / limits |
|---|---|---|
| F01 ink reveal | Welcome on `/` and `/projects/`; first About paragraph | No pinning or added scroll distance. Original words remain in document order. Fully opaque without JS and under reduced motion. |
| F04 horizontal gallery | `#projects`, above the existing full selected-work write-ups | Five cards that have existing overlays: renderer, thermal, volatility, strategy, chess. Desktop ≥900px only; native vertical scroll maps to horizontal transform. Focus scrolls clipped cards into view. Mobile/reduced-motion/no-JS use a normal grid. |
| F08 velocity marquee | Existing homepage/alias Skills location | Visible pause/resume button; both visual copies are aria-hidden, with one real readable definition list for assistive technology. Static list under reduced motion/no JS; pause choice survives preference switches and bfcache. |
| F09 path draw | Career, above the step cards | Existing current-status, internship, expected-graduation and long-term copy; future milestones explicitly labelled goals. Full path without JS/reduced motion. |
| F05 sticky stack | Career's five existing steps | Sticky cards with restrained scale/dimming. Static untransformed cards under reduced motion/no JS. |

No wheel interception, scroll-jacking, WebGL or extra dependencies. Intersections activate effects; font/image loads and viewport/preference changes invalidate geometry. The ordinary case-study/lab overlay lifecycle remains owned by `main.js`.

```sh
node journey/generate.js
node experiments/scroll/generate.js
python3 tools/graphics/generate.py  # refresh source hashes after registry edits
npm test
```
