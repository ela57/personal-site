# Ethan Lam's personal site

A static portfolio with no runtime build step. `/` is the static ePortfolio;
`/projects/` retains the same direct view, case studies, labs and figures.
Its “All destinations” section and `/projects/destinations.html` share
`content/projects.js` with the journey panels. Legacy root project/lab/section
hashes stay on the homepage. The optional forest journey lives at `/explore/`,
linked only in the bottom “Experimental interactive version” section of both
direct pages. Neither direct page automatically mounts canvases or loads WebGL/Three.js.
Project and lab overlays remain opt-in.

Serve with `python3 -m http.server 8000`. After editing the destination model or
`journey/shell.html`, regenerate the committed, JavaScript-free HTML snapshots.
`projects/index.html` is also the direct-page source for the generated homepage:

```sh
node journey/generate.js
npm test
```

This is an authoring command, not a deployment requirement. Both views work as
static HTML without JavaScript. See `journey/README.md` for navigation and rendering.

## Journey, labs and development tools

- `/` and `/projects/`: Welcome, selected work, static pipeline figures, project/lab
  write-ups, About, Contact and the bottom experiment link. Direct `#project/*` /
  `#lab/*` links work on either route, including `#lab/strategy/simulated`.
- `/about/`, `/resume/`, `/career/`: no-JS reading pages; the résumé is viewable
  and downloadable at `/assets/Lam_Ethan_Resume.pdf`.
- `/explore/`: six forest stations, translucent panels and `#/at/<station>` history.
  Use the destination menu, `[ ]` or Alt+Arrow; native PageDown/Space still scroll.
  Reduced motion cuts between stations. Static/no-WebGL/no-JS alternatives retain
  destinations and a link back to `/`; `/explore/?tour=1` offers an opt-in
  60-second tour. “Use static view” and Home both return to `/`.
- `/explore/#/lab/<id>/<stage>`: generic full-screen five-stage dialog. World rendering
  and scroll pause; Back traverses stages, Esc exits, focus and scroll restore.
  Inspect fetches real source with aligned line numbers and hanging line wraps.
- Old root `#/at/*`, `#/lab/*`, bare station hashes and journey `?tour` / `?debug`
  URLs redirect with their complete query/hash to `/explore/` using `location.replace`.
  Explicit direct project/lab/section hashes take priority and stay on `/`.
  `/journey.html` also redirects to `/explore/`, preserving query/hash state.
- `/dev/`: noindex registry-driven prototype gallery, filters/sortable ratings,
  source labels and lazy previews that abort/tear down outside view.
- `/dev/motion.html`: noindex eight-technique comparator, scrubber/canvas wheel,
  Play, damping/speed, zero roll and reduced-motion cuts. The thin historical SPY
  ribbon is sampled/normalized, not a forecast or precision finance chart.

The dev pages are not linked from public navigation. See
[`docs/journey/CURATION.md`](docs/journey/CURATION.md) for the inventory, editorial
recommendations, proposed final station outline and exact content gaps. Scores
are judgments, not timings. Only software-rendered fps has been measured: the
earlier art-pass SwiftShader median was 6.42 fps at DPR .65, not a smooth pass;
hardware-GPU performance and real-device/battery behavior remain unverified.

### Add a lab

1. Add or verify its project entry in `content/projects.js` and station membership
   in `content/destinations.js`; keep unsupported entries `needsContent: true`.
2. Add an entry to `content/labs.js`: id/title/projectId/label and Encounter,
   Understand, Experiment, Inspect, Reflect definitions. Inspect references real
   file paths and inclusive line ranges; prose must be supported by the code.
3. If live content is needed, add an importable `lab/` adapter with the referenced
   mount exports. Return cleanup, honor the AbortSignal, keep Encounter read-only
   and support independent simultaneous mounts. No presenter-specific branch.
4. Regenerate with `node journey/generate.js`, run `npm test`, and browser-check
   stage history, deep links, Esc/focus, scroll lock, teardown, mobile and reduced motion.

### Add a prototype

1. Add `prototypes/<name>.js` exporting `mount(root, {signal})`; return cleanup or
   a promise of cleanup. Abort fetches/listeners and terminate workers on teardown.
2. Add a `content/prototypes.js` entry: unique id, title, area, one allowed label,
   real sources, what-it-shows text, module/export, six 1–5 scores with rationales
   and `main` / `detour` / `experiment` recommendation. The gallery needs no branch.
3. Add data/behavior/privacy tests as applicable; run `npm test`. Browser-check
   interaction, offscreen unmount/remount, errors, 390px overflow and reduced motion.
4. Review screenshots and update curation deliberately; a registry recommendation
   does not itself mount anything in the public journey.

For a new camera study, add a finite zero-roll path/note in `dev/motion-poses.js`,
optional scene objects in `dev/motion.js`, and test 0/50/100% poses plus a visual
mid-scrub capture. Preserve source labels and qualitative use/cost notes.

## Generate images

Run `generate_image.py` with Python 3.10 or newer. It uses the Python standard
library, so no dependency installation is needed. The script calls OpenAI's
Images API with **`gpt-image-2.5-sunburst`** and saves one PNG to `assets/`.
It is a command-line tool, not part of the website's browser code.

Provide `OPENAI_API_KEY` through the process environment. In Devin Cloud,
make the stored secret available under that environment variable before running.
Local Devin Desktop/CLI sessions do not automatically inherit Devin Cloud Secrets.
The script deliberately does not read keys from files or accept a key argument.
Do not paste keys into chat, source code, or shell commands/history.

```sh
python3 generate_image.py \
  "Pixel art of an orange astronaut cat floating among blue and violet stars, no text" \
  --output image-generation-test.png --quality low
```

Each invocation makes one billable API request. There are no automatic retries
or model substitutions. You need API billing and access to the requested model.

Options:

- `--output NAME.png`: filename in `assets/`; existing files are never overwritten.
  Omit it to use a unique timestamped filename.
- `--size`: `1024x1024` (default), `1536x1024`, `1024x1536`, or `auto`.
- `--quality`: `low`, `medium` (default), `high`, `xhigh`, `max`, or `auto`.

The script resolves `assets/` relative to itself, so it also works when invoked
from another directory. Only image bytes are saved; credentials, API responses,
and prompts are not written to logs or sidecar files. Generated images can be
reviewed and committed when ready to publish.

API failures produce a sanitized status message without printing response bodies
or authorization headers. Missing credentials are rejected before any request.

See the [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation).
