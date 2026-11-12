# Scroll experiments

Standalone selection gallery: `/experiments/scroll/`. It is deliberately not linked from the homepage. No dependencies, build step, WebGL or scroll interception. Refresh committed copy with `node experiments/scroll/generate.js` after editing the content registries.

Inspiration names refer to the observations in `~/research/awwwards/NOTES.md`, not claims about those sites' implementation. Techniques not actually observed in that research are labelled **original idea**.

| F | Name | Inspiration | What it showcases | Cost to bring to homepage | Recommendation |
|---|---|---|---|---|---|
| F01 | Ink reveal | ViV / DeepBook | About's engineering motivation | Low | Use sparingly; never dim essential Welcome copy |
| F02 | Masked line rise | DeepBook | Real project headings | Low | Best restrained enhancement; readable static baseline |
| F03 | Chapter palette | Extrafazant | Languages and tools under Skills; awards under their own heading | Low | Good candidate; matching body copy and contrast-threshold foreground |
| F04 | Pinned horizontal gallery | Lando Norris | Renderer, thermal, volatility, strategy, chess, poker | Medium | Prefer the existing vertical index for fast scanning |
| F05 | Sticky card stack | CRL's layered composition | Five career steps | Medium | Optional career-page treatment, not the main Welcome |
| F06 | Cursor-follow preview | Signal-A Studio | Existing project images | Medium | Fine-pointer enhancement only; inline previews remain |
| F07 | Clip-path expansion, revised | Brandon Yasin's image transitions | Thermal still, now cropped to fill rather than padded renderer output | Low–medium | Dramatic but decorative; keep one at most |
| F08 | Velocity marquee | Original idea | Résumé languages and tools | Medium | Experimental only: drifting skills are harder to scan; pause control required |
| F09 | SVG path draw | Original idea | Current GT/GTSF work and explicitly labelled internship, graduation and career goals | Medium | Strong career-page candidate; retain the ordered list |
| F10 | Split-screen opposite scroll | Original idea | Five image-bearing projects; paired titles and images meet at centre | Medium–high | Visually interesting, but too slow for the primary project index |
| F11 | Scrubbed counters | Original idea | 2 AIME qualifications, 5 renderer stages, 12 puzzles, expected 2028 graduation | Low | Use selective achievements, never turn the graduation goal into an achieved statistic |
| F12 | Layered parallax | Lando Norris | Existing lake artwork, mist gradient and Ethan's name | Medium | Subtle capped travel only; static under reduced motion |
| F13 | Lake expansion / F07 variant | Original idea | Existing lake hero artwork in an edge-filling crop | Low–medium | Alternative to F07, not an additional homepage transition |
| F14 | Scroll-linked project spotlight | Original idea | Five Canvas 2D renderer stages using `pipelineModes` and `createRenderer` | Medium | Best project-specific candidate; keep it in the renderer case study before adding to home |
| F15 | Sticky chess board | Original idea | Philidor's legacy: five verified solution plies through smothered mate | Medium | Strong chess-case-study candidate; scroll playback does not record puzzle progress |
| F16 | SPY chart draw | Original idea | Full bundled SPY adjusted-close series and default sandbox buy/sell fills | Medium | Strong strategy-case-study candidate; keep source, assumptions and full static chart |

## Implementation and accessibility

- One gallery rAF scheduler reads native scroll once per frame. IntersectionObserver activates sections; only a near-viewport, unpaused F08 maintains base drift. Its velocity/skew relaxes back to zero. Background tabs stop drift.
- F03 crossfades fixed palette layers with opacity; black/white foreground switches at the higher-contrast threshold, not blend mode. Tests check at least 4.5:1 contrast across the tone pairs. Intentional text-reveal opacity is a separate effect.
- F09 uses normalized SVG dash progress (an intentional SVG stroke exception to transform/opacity-only effects). Future dates/roles remain goals, not claims of achieved outcomes.
- F10 becomes a normal, correctly ordered image/title list on mobile and under reduced motion. Desktop's reversed visual image track does not reverse DOM reading order; focusing a project link reveals its matching pair.
- F11's final values are present without JavaScript. Animated digits are hidden from assistive technology; a stable final value is exposed instead. Source comments live beside the data in `generate.js`.
- F12 uses the existing lake **artwork**, not a claim of an original photograph or project output. Image/mist/name offsets are capped at 21/30/12 pixels.
- F07/F13 use a static rounded clip and transform-scaled, cover-cropped imagery. No animated layout or clip geometry.
- F14 imports `pipelineModes` from `lab/pipeline.js` and `createRenderer` from `lab/renderer.js`; it does not duplicate projection, clipping or shading code or mount another scroll scheduler. Rotation/drag are disabled. Renderers mount near the section, clean up when reduced motion is enabled, and retain five existing image fallbacks. Static images/list replace scrubbing under reduced motion or without JavaScript.
- Poker has no existing image: its original text fallback is retained. No new facts, assets or project entries are fabricated.
- F15 uses `lab/chess/puzzles.js`, the existing chess.js rules engine and the shared `renderChessPosition` board renderer also used by the interactive chess lab. The chosen puzzle is `opera-combination`; every SAN move is checked and the final position is checkmate. Six committed, inert templates provide initial position plus five plies; native scroll selects a frame without timers, another animation loop, local-storage writes or duplicated piece drawings. Reduced motion/no JS show the final board and the entire move list.
- F16 uses every row of `lab/strategy/data/spy.json` (Yahoo Finance adjusted close, including splits/dividends), not the GBM simulation. Annotations are the existing sandbox's **executed buy/sell fills**, computed by the same `backtest` engine/defaults (20/100-session SMA, 5 bps). They are not invented market-event labels or claims of live trading results. Marker reveal thresholds use cumulative SVG segment length at each fill's actual date, so a marker cannot appear before the drawn line reaches its point. No client data fetch, chart dependency or downsampling is needed. Reduced motion/no JS show the complete chart; a native details list retains all fill dates and prices.
- The 16-item rail is two columns on desktop and hidden on mobile. Native keyboard scrolling and regular links remain available.

## Brainstorm (not built)

These are proposals, not implemented features or observed reference-site behavior:

1. Scroll-scrubbed renderer rotation image sequence; capture genuine renderer output first.
2. Hover-distort project thumbnails, with an undistorted keyboard/touch state.
3. Magnetic buttons with ordinary hit targets and reduced-motion opt-out.
4. Cursor-reveal mask over the lake, revealing an explicitly illustrative thermal treatment of the artwork.
5. A manual move-stepper alongside the now-built F15 scroll playback, sharing the same verified position frames.
6. A SPY methodology walkthrough extending the now-built F16 chart with the existing moving-average and cost assumptions.
7. Short text scramble on hover, never scrambling accessible names or résumé facts.
8. Page-transition curtains between ePortfolio pages, progressive enhancement with normal navigation preserved.
9. Footer big-name reveal behind the real Contact links.
10. Scroll-velocity blur on decorative lake layers only, not reading text.
11. Renderer clipping-plane slider linked to a short scroll interval, using the existing renderer implementation.
12. Thermal depth-to-heat side-by-side wipe using real shader stills.
13. Career-step progress ruler that also functions as ordinary anchor navigation.
14. Awards expanding into their exact source text, without synthetic scores or totals.
15. Keyboard-accessible project gallery/index toggle with shared state and no wheel capture.

F15/F16 are now built; the proposals above remain unbuilt extensions, not additional capabilities of the gallery.
