# Journey evidence audit — step 1

## Scope and classification

Audited `personal-site` at `0f4c141` (updated `origin/main`), local `pokerbot`
at `eb245bfc6ec94a1f7158c30b403d6b5a07b4a878`, and the public
[`ela57/Projects` tree](https://github.com/ela57/Projects/tree/2c21c801147cd2b768fb80a611cf59690d33f6d3)
at `2c21c801147cd2b768fb80a611cf59690d33f6d3`. “None found” means absent
from these inspected sources, not a claim that Ethan has never done that work.
No other private repositories, résumé PDF, LinkedIn content, original Unity
project or original Python renderer were inspected.

Labels describe the **destination experience**, not a new résumé claim:

- **Working project integration**: existing working site code/data or existing contact integration.
- **Illustrative simulation**: browser illustration/synthetic data, not the original project runtime.
- **Research prototype**: inspectable research or local experimental code; not a production/performance promise.
- **Proposed future feature**: no working destination integration yet. Existing textual facts may still support it.

`content/projects.js` exports `projects`; each entry has `id`, `title`,
`destination`, `label`, `summary`, `body`, `links`, `assets`, `dataSources`, and
`needsContent`. Destination strings are future content keys, **not new routes**.
Links are existing site hrefs; external research provenance is under data sources,
not newly added navigation. Unsupported areas have only a supplied title plus
empty content/evidence fields and `needsContent: true`. No page imports this model.

## Area → evidence → label → candidate prototypes

Candidates below are proposals, not implemented capabilities.

| Area | Supporting evidence / absent material | Destination label | Candidate prototypes it can support |
| --- | --- | --- | --- |
| Portfolio Manager | `index.html #experience`: central Python controller for allocation, rebalancing/risk constraints; reproducible out-of-sample pipeline; integration of two strategies. No controller code, holdings, orders, risk limits or returns found. | Proposed future feature | Text-led architecture destination; an allocation/risk interaction would require supplied code/data or explicit synthetic-example labelling. |
| Data Universe / survivorship | **None found**: no historical constituent membership, delistings, security master, corporate-action universe or survivorship dataset. SPY ETF prices are not constituent history. | Proposed future feature | Title-only placeholder; point-in-time membership explorer blocked on data/provenance. |
| Malware research / IDA CFG | **None found**: no IDA exports, CFG nodes/edges, binaries, analysis notes or screenshots. | Proposed future feature | Title-only placeholder; a defensive CFG viewer requires a supplied safe export. |
| SCOMP | **None found**: no source, ISA description, assembler, traces or course material. | Proposed future feature | Title-only placeholder; instruction/trace visualization blocked on supplied material. |
| VHDL / palletizer FSM | **None found**: no VHDL, FSM specification, testbench, timing traces or diagrams. | Proposed future feature | Title-only placeholder; FSM playback blocked on supplied design and tests. |
| GPU programming: thermal | `index.html #tpl-thermal`, `main.js mountThermal`, shader-cover images. HLSL/Unity/C# is existing case-study text; no shader source/build here. | Illustrative simulation | Existing SVG depth ramp, range, edge/grain controls and annotations. Not GPU shader execution. |
| GPU programming: renderer | `index.html #tpl-renderer/#tpl-bench`, `main.js createRenderer/mountBench`, `lab/pipeline.js`, pipeline PNGs. Python/NumPy/Matplotlib is existing copy; original source absent. | Illustrative simulation | Working Canvas pipeline bench and five-stage story; only NDC stage is a cutaway. Not a Python runtime or general 3D engine. |
| Poker bot | `pokerbot/README.md`, `bots/my_bot.py`, `pokerpractice/{tournament,logging_store,analysis}.py`, engine adapter, configs, tests; two generated hero-level runs below. | Research prototype | Data-backed recorded-hand/decision replay, hero-vs-omniscient toggle, stored diagnostics. No new browser bot, optimal-play or competition claims. |
| Human-interaction research | **None found**: no study protocol, participant data, measures, publication or research text. | Proposed future feature | Title-only placeholder; no invented participants/results. |
| Chess puzzles | `lab/chess/{puzzles,board,progress}.js`, vendored chess.js, `assets/chess-preview.svg`, chess tests. Twelve legal forced-mate exercises. | Working project integration | Integrate the existing keyboard/drag puzzle board and progress. |
| Chess Buddies leadership | **None found**: puzzles do not establish leadership, a club role, dates or accomplishments. Kept separate from the working chess entry. | Proposed future feature | Title-only placeholder pending verified leadership copy. |
| Résumé | `index.html #about/#experience/#skills/#contact`; existing résumé-request mailto, email and LinkedIn. No résumé file or download endpoint found. | Working project integration | Existing About/contact/request links; not a PDF viewer or fabricated résumé. |
| Realized-volatility research | `#tpl-vol`; two local chart PNG/WebP pairs; public notebook and two-page PDF below. | Research prototype | Notebook-grounded estimator/rolling/quintile/equity explanation; no new measured performance. |
| Strategy sandbox / SPY | `lab/strategy/{engine,sandbox}.js`, `data/spy.json`, downloader; vendored Lightweight Charts. | Working project integration | Existing historical-price SMA sandbox, cost control, equity, fills and ledger. Distinct from the notebook regression. |
| Strategy sandbox / synthetic GBM | `lab/strategy/simulated.js` and sandbox dataset selector. | Illustrative simulation | Existing seeded synthetic-price mode, visibly distinguished from market data. |
| Forest-lake arrival | `lab/lake/{lake,water,math}.js`, `index.html`, generated responsive lake images, `lab/words.js`. | Illustrative simulation | Existing image-backed WebGL water/scroll veil. An authored camera path through actual forest geometry is **Proposed future feature**, not present code. |

## Personal-site inventory

### Running surfaces and dispatch

Static HTML/CSS/ES modules, no build step or server-side data API. `main.js route`
recognizes `#project/<slug>` and `#lab/<slug>`, clones templates, mounts visuals,
and dynamically imports the two labs. `ORDER` contains renderer, thermal, vol.
Homepage imports the lake, reusable word effects and five-stage pipeline.

| Surface | What really executes | Evidence / boundary |
| --- | --- | --- |
| Homepage renderer preview / Fig. 1 | Linked static shaded pipeline PNG, not the original Python program | `index.html #work-renderer`; older renderer covers remain tracked but unused |
| Pipeline story | Five JS/Canvas renderer modes with scroll/focus selection; static per-step PNG fallback | `lab/pipeline.js mountPipeline`; view-space clipping before projection; no authored world camera path |
| Renderer overlay and bench | Canvas geometry, projection, culling, sorting, lighting; drag rotation, stage/focal/cull/sort controls | `main.js createRenderer/mountBench`; original renderer only described in copy |
| Thermal preview / Fig. 2 | Linked shader-cover illustration; overlay uses SVG, not HLSL | `main.js mountThermal`; max-distance, edge/grain controls and annotations work; polygon outlines are not a computed Sobel pass |
| Vol / Fig. 3 and 3b | Static notebook output images and existing findings | No in-browser notebook execution |
| Chess lab | Vendored chess.js legal moves, 12 puzzles, hints, automatic replies, solution playback, optional localStorage progress | `lab/chess/board.js`; first puzzle also generates the static mini-board |
| Strategy lab | Bundled historical adjusted closes or seeded GBM, SMA engine, charts/markers, costs, metrics and trades | `lab/strategy/sandbox.js`; no broker execution or market feed |
| Lake / typography | Image-backed WebGL water plus scroll veil; DOM character effects | `lab/lake`, `lab/words.js`; this is not a geometric forest scene |
| Retained but not page-mounted | `lab/chips/{physics,render}.js` and vendored Matter (covered by tests); legacy `lab/hero-type.js` | No current chips mount/import; `lab/chips/chips.js` absent. Legacy hero type not imported |

Runtime smoke check via existing local HTTP server and Chromium: all five overlay
routes mounted; bench stage changed, thermal range updated by keyboard, chess had
64 squares, and strategy loaded then switched to seeded simulation. Five pipeline
canvases and both Lab previews mounted. No page errors. This was a functional DOM
audit, **not a visual review**. The water check initially used a nonexistent
`.lakeWater` selector; the actual class is `.lakeCanvas`, subsequently verified
with `data-rendered="true"` and a 1425×900 canvas.

### Routes, links and fallback boundaries

- Overlay routes: `#project/renderer`, `#project/thermal`, `#project/vol`,
  `#lab/chess`, `#lab/strategy`. Unknown slugs have no matching template.
- Homepage anchors linked in markup: `#top`, `#main` (skip link), `#projects`,
  `#lab`, `#about`, `#contact`. Additional real IDs: `#work-renderer`,
  `#work-thermal`, `#work-vol`, `#approach`, `#experience`, `#skills`.
  Pipeline has `.pipeline` / `#pipelineTitle`, **no `#pipeline` route**.
- Contacts: `mailto:ethanlam52@gmail.com`,
  `mailto:ethanlam52@gmail.com?subject=R%C3%A9sum%C3%A9%20request`,
  `https://www.linkedin.com/in/ethanlam7/`.
- Canonical site: `https://ethan-lam.com/`; `CNAME` supplies custom-domain hosting.
  Strategy dynamically adds Yahoo source and TradingView attribution links.
  The detail-next `href="#"` is populated at runtime, not another destination.
- Existing reduced-motion/static image fallbacks, selectable DOM copy, focus
  trapping/return and no-JS lab descriptions should survive future implementation.
  No-JS chess supplies the first puzzle/answer, not twelve playable puzzles;
  templates do not turn into fully functioning no-JS overlays.

### All tracked media and datasets (baseline)

`git ls-files` identified 78 tracked files. Media inventory below accounts for
all tracked images/fonts; there are no GLTF/GLB/OBJ models, forest meshes, camera
tracks, audio or video assets.

| Paths | Role / provenance |
| --- | --- |
| `assets/hero/lake-{768,1280,1536}.{avif,webp}` | Six responsive landscape variants of the generated lake photograph |
| `assets/hero/lake-portrait-{640,1024}.{avif,webp}` | Four responsive portrait variants |
| `assets/hero/lake-lqip.webp`, `lake-portrait-lqip.webp` | Two low-quality placeholders; no geometry/depth dataset |
| `assets/pipeline-{1,2,3,4,5}.png` | Five renderer-generated stage fallbacks; shaded stage 5 also the homepage renderer preview |
| `assets/renderer-cover.webp`, `renderer-cover-768.webp` | Retained illustration files, unused by current markup |
| `assets/shader-cover.webp`, `shader-cover-768.webp` | Thermal homepage illustration/srcset |
| `assets/projects/realized-vol-{equity,rolling}.{png,webp}` | Four chart assets. PNGs byte-match notebook cell 25 / cell 11 outputs respectively |
| `assets/chess-preview.svg` | Generated from puzzle 1; `lab/previews.js`, synchronized by presentation tests |
| `assets/strategy-preview.svg` | Bundled SPY plus 20/100-day SMA SVG; generated by `lab/previews.js` |
| `assets/fonts/archivo-var.woff2`, `source-serif-4-var.woff2`, `source-serif-4-italic-var.woff2` | Current typography family assets |
| `assets/fonts/ibm-plex-mono-{400,500}.woff2` | Two retained legacy font assets; not referenced by current CSS |
| `favicon.png`, `apple-touch-icon.png`, `og-image.png` | Site icons/social image; not project measurements |

Other source/data inventory:

- `lab/strategy/data/spy.json`: **5,489** `[date, adjustedClose]` observations,
  **2005-01-03–2026-10-27**, retrieved **2026-10-27**, metadata says yfinance
  **1.7.0**, `autoAdjust: false`, `series: "Adj Close"`, precision 4. Split/dividend
  adjustment evidence for 2026-09-17/18 is included. Yahoo Finance history URL is
  recorded. Not OHLCV, executable quotes, index constituents, or the 2000-onward
  notebook dataset. `download.py` can refresh from yfinance or saved raw history;
  no saved raw OHLCV CSV is checked in. Provenance is recorded metadata, not an
  independently re-downloaded/verified market-data license or feed.
- `lab/strategy/simulated.js`: Mulberry32 seed 57021; annual drift .07,
  volatility .18, 1,260 weekday observations from 2020-01-02, initial price 100,
  dt 1/252. These are **simulation parameters**, not measured returns.
- `lab/chess/puzzles.js`: 12 FEN/SAN/explanation/mate-length entries, four per
  difficulty; vendored chess.js validates every forced line/checkmate in tests.
  Geometric UI drawings are declared CC0 in `PIECES-LICENSE`; the preview uses SVG
  text glyphs instead. No leadership data follows from either board.
- `main.js`: embedded icosahedron mesh, thermal polygons/colour ramp and renderer
  functions; `lab/pipeline.js`: modes and depth clipper. These are illustrative
  geometry, not an asset library for a full forest world.
- `vendor/`: pinned chess.js, Lightweight Charts and Matter browser runtimes plus
  licenses/notices. `tests/`: chess/progress, strategy, chips, lake and presentation
  coverage. `generate_image.py` is offline billable image-generation tooling,
  not an interactive site demo; not run for this audit.
- Root `index.html`, `styles.css`, `main.js`, `PRODUCT.md`, `DESIGN.md`, README,
  package/lock/config and hosting files complete the application/support sources.

## Pokerbot: source, generated logs and determinism

No `runs/` existed before this audit. Existing material: `data/preflop_rank.json`,
`bots/my_bot.py`, `bots/versions/my_bot_v1.py`, bot implementations,
`pokerpractice/engine`, tournament/randomness/scoring/timing/analysis/CLI modules,
`configs/{default,rules,roster,logging,timing}.yaml`, documentation including
`docs/{LOGGING,DESIGN,SCORING,OPPONENTS,TIMING}.md`, `example_session.txt`,
`profile_output.txt`, and tests. Example/profile text is documentation, not a new
performance result. The project is locked with `pyproject.toml` and `uv.lock`.

Ran from `/home/ubuntu/repos/pokerbot`:

```sh
uv run poker-practice run --seed 1000000 --label journey-audit-a --log-level hero
uv run poker-practice run --seed 1000000 --label journey-audit-b --log-level hero
```

Outputs retained locally (ignored by pokerbot Git, not copied into the site):

- `runs/20261108T035626Z_b7c81b/`
- `runs/20261108T035643Z_b8566e/`

Each completed 1 SNG / 200 hands and wrote **200 hand records and 200 hero
decision records**, in `hands.jsonl.gz` and `decisions.jsonl.gz`. Each also has
`manifest.json`, `results.sqlite`, immutable config snapshots and
`snapshot/hero/my_bot.py`. SQLite tables: `sngs`, `hand_summaries`, `decisions`.
The manifest records resolved configuration, seeds, source hashes, versions and
revision. `hero` retains all private hand data in hands, but only hero
observations/decisions in decisions. `full` logs all bots; `summary` omits both
JSONL streams and decision rows. Do not leak opponents’ cards from hands into a
hero-view replay; reveal hindsight only through an explicitly labelled mode.

Decompressed hands matched exactly between runs. Decisions matched with only
`latency_ns` excluded. Timestamps, run IDs and latency/throughput are not
deterministic; machine timing must not become a résumé/performance claim. This
smoke run demonstrates reproducible data, not tournament strength. Defaults
(8 seats, stack 2000, 200-hand cap, payouts and time budgets) are **practice
assumptions**, not official competition specs. No site integration exists yet.

### Actual JSONL fields

Hand: `actions`, `blinds`, `board`, `button`, `chip_deltas`, `eliminations`,
`ending_stacks`, `hand_content_sha256`, `hand_number`, `hero_seat`, `hole_cards`,
`pots`, `refunds`, `scoring_updates`, `seed`, `showdown`, `showdown_ranks`,
`showdown_seats`, `starting_stacks`.

Decision: `applied_action`, `bot_label`, `diagnostics`, `event`, `exception_text`,
`failure_type`, `hand_number`, `latency_ns`, `legal_actions`, `lineup`,
`observation`, `position`, `requested_action`, `seat`, `seed`, `stack_bucket`,
`street`.

Observation: `action_history`, `actor_seat`, `big_blind`, `board`, `button_seat`,
`hand_number`, `hands_remaining`, `hole_cards`, `legal`, `level`, `my_seat`,
`payouts`, `players_remaining`, `pot_breakdown`, `pot_total`, `seats`,
`small_blind`, `street`, `to_call`. Seat objects contain active/all-in/folded,
anonymous ID, position, stack, street bet and total contribution. Action history
uses anonymous IDs. Legal actions contain fold/check/call permissions, call
amount and min/max raise-to; amounts are integer chips.

Actual first decision **excerpt** from run A (omitted fields are not a complete
replay record; this is stored bot diagnostics, not a generated reasoning trace):

```json
{
  "seed": 1000000,
  "hand_number": 1,
  "seat": 0,
  "bot_label": "hero",
  "street": "preflop",
  "position": "MP3",
  "stack_bucket": "100+",
  "requested_action": {"amount": null, "diag": null, "kind": "FOLD"},
  "applied_action": {"amount": null, "diag": null, "kind": "FOLD"},
  "diagnostics": {"pot_odds": 0.2857142857142857, "reason": "check or fold preflop"},
  "legal_actions": {"call_amount": 20, "can_call": true, "can_check": false, "can_fold": true, "max_raise_to": 2000, "min_raise_to": 40},
  "latency_ns": 6870,
  "failure_type": null,
  "exception_text": null
}
```

The associated stored observation has hero hole cards `["Qh", "4s"]`, empty
board, pot 50, to-call 20, 8 players and 199 hands remaining. Complete private
cards and subsequent board belong to the separate hand record. No empirical
equity/probability is implied by `pot_odds`.

## Public Projects notebook / PDF

GitHub tree contains exactly `realized_vol_spy.ipynb` and
`realized_volatility_writeup.pdf`, no README or raw data file. Pinned copies were
downloaded to `/home/ubuntu/journey-audit/` for inspection, not committed.
PDF text/images were inspected with isolated Python `pypdf` tooling because
`pdftotext` is unavailable; no repository dependency was added.

- Notebook: 28 cells; yfinance download of SPY daily OHLCV starting 2000-01-01,
  existing head/derived tables, four realized-volatility estimators annualized
  with 252 sessions, next-day **log** return target, correlations and GK quintile
  analysis. It does **not** embed a complete raw price dataset.
- Three embedded PNG figures: cell 11 63-day rolling means of returns and four
  estimators; cell 16 average next-day return by GK quintile; cell 25 equity
  curves (Buy&Hold, Signal, SPY BH). The rolling and equity PNGs are byte-identical
  to the site's corresponding assets; the quintile figure is not shipped locally.
- Code splits by observation count: 70% train / 15% validation / 15% test; OLS
  uses HAC standard errors, 5 lags. m1 volatility-only stored R² .000, p .596;
  m2 adds lagged return and volatility change, stored R² .004, lagged coefficient
  -.0634, p .005. Final model refits train+validation; stored test output Sharpe
  .55 baseline / .66 signal and 48.62% turnover. These are **existing research
  outputs**, not remeasured or validated returns.
- PDF: two-page Ethan Lam / IC Quant final-project summary, formulas, estimator
  list, EDA/model interpretation and one embedded equity image on page 2. It
  describes training 2000–2019 and testing 2022–2025; actual notebook splitting
  is fractional, not explicit date cutoffs. No new metrics extracted/invented.

Important caveats for later content work (no original page edits in this step):

1. Existing site method text says “long/short”; notebook cell 25 explicitly
   uses `signal = (pred_te > 0).astype(int)` — **long/flat, no shorting**. New
   model avoids copying the inaccurate long/short claim.
2. Notebook computes log returns but compounds `(1 + return).cumprod()` and
   reports Sharpe without costs; treat figures as historical prototype output,
   not executable or cost-adjusted investment performance. No notebook rerun or
   methodological correction was made here.
3. Notebook prose contains a coefficient typo (-.0063) while its table and PDF
   support approximately -.063. The model uses the existing supported findings.
4. The SMA lab is **not** the notebook regression strategy. Neither the lab's
   2005-onward adjusted-close data nor the ETF itself supplies point-in-time
   constituent/survivorship evidence.

## Checks and next-step boundaries

- `uv run pytest -q` in pokerbot: **37 passed, 7 warnings in 14.20s**.
  Warnings are eval7's Pyparsing deprecations (`setName`, `setParseAction`,
  `delimitedList`); uv resolves `.venv/bin/python`, so this is a dependency
  compatibility warning, not a missing project environment. No pokerbot changes.
- Both deterministic smoke runs: `SNGs: 1 completed, 0 failed`.
- Site `npm test`: **41 tests, 41 pass, 0 fail**; includes new model schema/source/link
  checks plus existing demo/engine tests. No visual implementation or screenshots
  were requested; none were changed or produced.
- Later work should keep stable project/lab routes, attribution/licensing,
  reduced-motion/no-JS alternatives and keyboard access. A new camera/path,
  terrain, destination meshes and replay UI are future work, not this commit.
- Missing-material destinations cannot support factual demos until supplied.
  Portfolio-manager text can be reused but its implementation/data cannot be
  inferred from the SPY notebook or SMA lab. Poker browser integration requires
  a deliberate static-log export and hero/omniscient information boundary.
