# Code-generated project graphics

The approved previews are wired into the primary pages and registry. No AI image service, stock art, old preview image, network market-data fetch or private poker observation is used to generate them. See `docs/primary-scroll.md` for page integration and shared scroll effects.

## Regenerate

```sh
python3 -m pip install -r tools/graphics/requirements.txt
# Install Chrome/Chromium, or: python3 -m playwright install chromium
python3 tools/graphics/generate.py
python3 tools/graphics/generate.py --check
```

Existing Python packages and Chrome are sufficient; there are no changes to the site's Node dependencies or build requirements. `--browser /path/to/chrome` chooses an executable. `--check` regenerates into a disposable directory and byte-compares all 16 WebPs and the manifest. Browser/font rasterisation is version-sensitive: `assets/graphics/manifest.json` records the exact Chrome/Python/Pillow/Playwright versions plus source/output SHA-256 hashes. Use the recorded versions for byte-identical results. There is no timestamp, random seed, animation or external request in generation.

The script starts and closes its own loopback-only server on an ephemeral port. It does not touch the existing server on port 8010. Contact sheet: `~/shots/graphics/contact-sheet.png`, configurable with `--contact-sheet`. Both full and small images are lossless WebP, with rendered local fonts; no font download is needed when displaying the outputs.

## Common format

- 1600×1000 and 800×500. Deep forest `#13201b`; faint 1 px / 40 px mist grid; thin 40 px inset frame.
- One accent family per image: ember `#e3b677`, lake `#8faeb3`, moss `#9eae8e`, or neutral mist `#ece7dc`. Forest/accent mixtures are flat tints, not glows or atmospheric gradients.
- Archivo uppercase footer caption; IBM Plex Mono data note. Plot labels/legends are drawn from the same type system.
- The geometry and charts remain legible at the small size. Nothing is clipped to hide outliers or losses.

## Sources and qualifications

Each row produces `{id}-1600.webp` and `{id}-800.webp` under `assets/graphics/`. Per-image formulas, parameters, source hashes, observations/counts and output hashes are in the manifest.

| ID | Real source | Treatment and limits |
|---|---|---|
| renderer | `lab/renderer.js`, `lab/pipeline.js` | The actual icosahedron's projected face polygons and `face.lit` values come from `createRenderer.onFrame`. The existing culling, painter ordering and Lambert light are retained; only the presentation palette changes. This is the JS/Canvas illustration, not the original Python project. |
| thermal | `lab/renderer.js`, `lab/pipeline.js`; effect context in `lab/thermal.js` | Three renderer projections at stated view-space camera depths. Face depth maps to seven **flat forest/ember bands**. Original Unity/HLSL source and its shader ramp are not in this repo. The multicolour ramp in `lab/thermal.js` is itself a browser illustration; it is not presented as Unity output. The single-accent cover is prominently labelled **illustrative**. |
| volatility | `lab/strategy/data/spy.json`, `prototypes/finance.js` | Every eligible pair: 20-session sample SD of close-to-close log returns × √252 versus the **next session's simple adjusted return**. The 20-return window is the existing prototype default. No winsorisation, fitted line or invented correlation. This is the bundled 2005–2026 adjusted-close sample, **not** the notebook's 2000-onward OHLC/Garman–Klass study or its original result plots. |
| strategy | `lab/strategy/data/spy.json`, `lab/strategy/engine.js` | All SPY adjusted closes, 20/100-session SMAs and the shared backtest's executed next-close buy/sell fills. Engine defaults include 5 bps costs. A historical educational model, not live performance or executable adjusted-price quotes. |
| chess | `lab/chess/puzzles.js`, `lab/chess/board.js`, `vendor/chess.js` | Initial position of **Invite the rook** (`smothered-sacrifice`), rendered by `renderChessPosition` with existing CC0 geometric pieces. Strict SAN playback verifies its mate-in-two line before capture. Colours only are overridden inside this generation page; the interactive lab is unchanged. |
| poker | `prototypes/data/poker-session.json`, `tools/export_poker.py` | All 200 public hand-boundary hero stacks. Dashed reference is the actual initial stack; ticks are public elimination hands. No `poker-run.json`, hole cards, observations, showdown information or offline equity are read. Includes losses; no claim of playing strength. Export's upstream commit/run/seed are preserved in the manifest. |
| portfolio-manager | `content/projects.js`, referencing `content/eportfolio.js` | Typographic **role schematic**: central Python portfolio controller; two independent strategies; capital allocation, rebalancing and risk constraints; existing title/dates. Not an audited architecture diagram or performance claim. |
| chess-buddies | `content/projects.js`, referencing `content/eportfolio.js` | President/dates, more than 50 children, six-person volunteer team, more than 60 events **each school year**, two schools. Extraction fails rather than silently inventing replacement facts when source wording changes. |

## Preview inventory before integration

The homepage and `/projects/` share markup. Their renderer lead previously used `assets/pipeline-5.png`; the registry also listed `renderer-cover*.webp`. The new `renderer` pair replaces the **lead preview slot**, not all five inline pipeline explanation stages.

| Previous preview family | Approved replacement |
|---|---|
| `pipeline-5.png` lead preview; `renderer-cover*.webp` registry images | `renderer` |
| `shader-cover*.webp` | `thermal` |
| `projects/realized-vol-equity.{png,webp}` preview | `volatility` |
| `strategy-preview.svg` | `strategy` |
| `chess-preview.svg` | `chess` |
| Previously no preview: Poker Practice | `poker` |
| Previously no preview: GTSF Portfolio Manager | `portfolio-manager` |
| Previously no preview: Chess Buddies | `chess-buddies` |

The destinations lists now include all eight approved previews. No other destination declares a preview image. The lake hero/journey world, résumé PDF, five inline pipeline-stage figures and original volatility-study result plots (including `realized-vol-rolling`) are not project preview replacements. Preserve those explanation/evidence assets unless a later brief explicitly asks to replace them. Placeholder destinations with no facts have not received invented graphics.
