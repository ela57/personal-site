# Development prototypes

Open `/dev/`. The page is noindex and not linked from public navigation. Ratings
are editorial curation judgments, not performance measurements. High performance
cost / maintenance effort scores mean **more** cost / effort. Add a registry entry
in `content/prototypes.js` and a module exporting `mount(root, {signal})`. A mount
returns cleanup (or a promise of cleanup). Fetches/listeners use the supplied
signal; workers terminate on cleanup. The gallery observes each preview, tears it
down offscreen and retains its layout height. Filters also tear down hidden cards.

## Finance

The risk map runs 35 valid SMA pairs (short: 5/10/20/30/40/60; long:
50/75/100/150/200/250) in a disposable module worker using the unchanged strategy
engine and 5 bps costs. Annualized return is `(1 + cumulative) ** (252 / n) - 1`,
where `n` is the number of selected daily observations, matching the engine's
252-session convention. Buy & hold includes the engine's entry cost. This is
**in-sample**, with no parameter selection validation or investment claim.

The timeline uses rolling sample standard deviation of **log close-to-close
returns**, annualized by sqrt(252). A window of N returns needs N+1 prices.
It is not the notebook's OHLC-based GK estimator. No event annotations are added:
the bundled series itself does not provide an audited event-date source.

The risk map fits each axis to all SMA points and buy-and-hold, with padded nice
ticks; zero is retained only near the data. Its axes are not comparable across
future datasets without reading the tick labels.

## Poker export and privacy boundary

From the personal-site root, reproduce the committed artifacts with:

```sh
python3 tools/export_poker.py \
  --run /home/ubuntu/repos/pokerbot/runs/20261108T035626Z_b7c81b \
  --out prototypes/data
```

Source: `ela57/pokerbot`, seed **1000000**, run `journey-audit-a`, manifest commit
`eb245bfc6ec94a1f7158c30b403d6b5a07b4a878`. No new run or inferred result is used.

* `poker-run.json` reads only hero decision records for replay content. It exports
  200 decision observations across 145 hands. Cards are copied only from the
  observation's hero hole cards and public board. Seats, history, actions, legal
  choices and diagnostics use explicit field allowlists; nested action diagnostics
  and all showdown data are excluded. Diagnostics retain only `reason`/`pot_odds`.
* Twenty hands are featured by observed all-ins, river decisions and multiway
  postflop states, then public pot size. All observation-bearing hands remain in
  the compact export so clicking the session chart can open non-featured hands.
  Within a hand, street buttons jump only to a logged observation on that street;
  previous/next move among individual decisions. Nothing after a fold is invented.
* `poker-session.json` is a **separate public summary** from hand logs: hero
  starting/ending chips, blinds and elimination seat indices for all 200 hands.
  It contains no board, actions, hole cards, showdown ranks or opponent stacks.
  This is necessary because 55 hands have no hero decision observation. Clicking
  one of those hands explicitly reports that no hero observation was logged.
  Public `note` strings explain qualifying heads-up single preflop folds with a
  net small-blind transfer. They are derived from public actions and boundary
  stacks, never cards. Hands 185–200 really alternate 590/790 chips as seats 0/4
  fold in turn; all 200 exported boundaries match the raw log, with no gaps or
  seat switches. Hover or select a point to read its note; no smoothing is applied.

The replay, inspector and session chart share an in-memory selection. A chart
click scrolls to the replay; a lazy remount reads the current selection. These
are recorded research interfaces, not a playable poker game or strength claims.

Privacy tests inject private fields into seats, history, legal actions, diagnostics
and full-hand data, then exercise the exporter CLI and inspect both outputs.

## Chess

The gallery reuses the existing board with persistence disabled. The second
five-stage entry in `content/labs.js` uses the same board through
`lab/chess/lab.js`, with read-only Encounter and interactive Experiment. It adds
no presenter-specific code or CSS. Inspect references actual puzzle data, legal
move handling and the all-defences mate validation test. Puzzle data is unchanged.

`npm test` covers registry sources/scores, privacy, estimator math and the shared
lab schema (including chess). Browser evidence lives outside git in `~/shots/j5/`.

## Pass 2b / motion

Seven additional registry entries include six live interactions and a link to
`/dev/motion.html`. Both dev pages are noindex and absent from public navigation.
New previews have stable-height, internally scrolling windows so lazy mounts
cannot push neighboring cards out of view and tear down their live systems.
`lab/renderer.js` and `lab/thermal.js` are mechanical extractions of the existing
site implementations; main.js imports them. Renderer defaults retain the original
light, ambient/diffuse weights, face shading and edge strokes. Opt-in flat shading
means a uniform face color, not vertex interpolation or a PBR material model.

The map samples the actual Catmull–Rom curve; classification and station-area
filters use shared project membership. Placeholder entries remain placeholders.
`journey/tour.js` is navigation-injected, enabled only by `/explore/?tour=1`: four stops,
15 seconds each. Pause retains elapsed time, Skip advances a stop, Exit returns
to the origin. Hidden tabs and open lab dialogs pause the clock. Reduced motion
uses instant cuts. The gallery removes the iframe when it leaves the viewport.

The accumulator is an original, **generic** integer ISA, not SCOMP documentation
or coursework. Program memory is separate, AC is signed/unbounded, and CALL/RETURN
use a separate return stack. A 16-bit unsigned input is divided by 16 using
repeated SUB; four remainders are compared to memory[5]. Run is bounded at 50,000
instructions; the largest selectable word fits this bound. The Moore simulation
is likewise **not Ethan’s VHDL**: FEED waits for box-present, PRESS and EJECT each
last one clock, and safe-off returns to IDLE only at a sampled clock. It is not a
hardware safety controller. Timing retains the last 24 sampled cycles.

Motion comparisons reuse `createWorld`, cap plane-card instances, freeze water,
cap DPR at .75, and render only while moving/loading. The historical ribbon is a
sampled extrusion of bundled SPY adjusted closes, not a forecast. Portal detail
uses the existing renderer project text. Exploded layers are a generic four-box
assembly. The overview path rises to show the route and returns to its origin.
Scrubbing and wheel input set deterministic targets; damping changes convergence,
speed changes wheel/playback rate. Reduced motion disables play and cuts to each
scrubbed pose. Euler order is YXZ and roll is explicitly zero. All use/cost notes
are qualitative, not GPU measurements. Screenshots: `~/shots/j6/`.
