# Renderer case-study copy: claim ledger

## Draft v2 mapping

The approved text is supplied in `~/shots/copy/draft-v2.md`. Public copy is transcribed verbatim, with HTML emphasis around list labels and the existing live face-count span retained. No explanatory sentences have been added. The draft supersedes the previous four implementation sections and their 300–500-word requirement.

| Draft block | Source element |
|---|---|
| How I work; three Approach headings and paragraphs | `projects/index.html`, `#approach` (`h2`, three `h3`/`p` pairs) |
| Software renderer | Selected-work `h3`, overlay `h2`, renderer registry title |
| Summary | Selected-work `.projDesc`; registry summary |
| Intro | Overlay `.csLead` |
| Why | Selected-work `.projWhy`; overlay section A |
| The steps | Section B heading and five `.steps li` items |
| Tradeoffs; Try it | Sections C and D |
| The shape; What gets drawn; Draw order; Lighting; Scrolling; Bench | Sections E–J, one heading and paragraph each |
| Five stage captions | Five `.pipelineSteps li p` elements |
| Figure labels and caption | `.csMedia .notes li` and `.csMedia figcaption` |

Old implementation paragraphs and headings are replaced, not retained as extra blocks. The prior visibility/order and story/bench groupings now have separate headings matching the draft. Existing technical stage names, stage numbers, accessibility text and interactive controls remain functional.

The four shortened registry paragraphs contain only complete sentences from the draft: the first Intro sentence, the Try it paragraph, the last What gets drawn sentence, and the last Draw order sentence. The summary is the draft Summary without changes.

## Evidence and limits

No original Python renderer source is present in this repository. Python/NumPy/Matplotlib and Python clipping context were already supplied project facts; this edit is not a new inspection of Python code. The draft's first-person recollection about prior graphics-library use and its motivation are owner-supplied statements, not claims verified from code. The Approach reflections are likewise supplied copy.

The browser implementation remains distinct: it clips before projection; the original Python project clips after the perspective divide. Exact lighting coefficients, light-vector components, depth bounds, rotation axes and scroll thresholds remain in code but are no longer spelled out in the prose.

| Claim retained in draft v2 | Supporting code or provenance |
|---|---|
| Original Python renderer uses NumPy; Matplotlib draws the finished triangles | Existing project description and supplied Intro; original source unavailable |
| Original clips after perspective divide; painter's ordering can fail for intersecting faces | Existing project description and supplied Tradeoffs; original source unavailable |
| Browser demo is JavaScript | `lab/renderer.js`; `main.js:1,146–169` |
| Icosahedron has 20 faces and 12 points | `lab/renderer.js:9–14` |
| Rotation, camera offset, divide by depth, canvas centring and Y flip | `lab/renderer.js:20–21,45–52,71–74` |
| Face orientation decides which triangles are skipped | `lab/renderer.js:64–68,80–82` |
| Clipping trims the depth range and inserts cut points on crossing edges, before projection | `lab/renderer.js:69–74`; `lab/pipeline.js:9–24` |
| Sorting restores the whole shape and numbers faces from farthest to nearest | `lab/pipeline.js:1–6`; `lab/renderer.js:67,76,83,111–114` |
| Whole-face sorting, without a per-pixel depth test | `lab/renderer.js:64–114` |
| One directional light, one brightness per face and a positive ambient contribution; no textures or smooth shading | `lab/renderer.js:22,31,76,85–93` |
| Five reversible scroll stages; reduced motion keeps static images | `lab/pipeline.js:1–6,27–31,50–70,81` |
| Bench modes, culling/sorting toggles, drag rotation, focal-length control and face counters | `main.js:122–137`; `lab/renderer.js:130–139`; `projects/index.html`, `tpl-bench` |
| Figure shows depth division, directional lighting and back-to-front drawing; skipped count updates live | `lab/renderer.js:45–52,76–93`; `main.js:153–161` |

## Source and reuse

`projects/index.html` is read by `journey/generate.js` to regenerate `/` and `/projects/`. The overlay template remains the sole primary-page source of the five-stage story. `content/projects.js` supplies the shared renderer title, summary and shortened context; regeneration updates gallery/destination entries, Explore fallback content and scroll-experiment summaries. No renderer or scroll interaction code changes.

The unrelated strategy and chess journey-lab **Approach** sections remain unchanged in `content/labs.js`, rendered by `journey/lab-presenter.js` at `/explore/#/lab/strategy/understand` and `/explore/#/lab/chess/understand`.
