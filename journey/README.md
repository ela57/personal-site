# Standalone forest journey

Serve the repository normally and open `/journey.html`. Nothing imports this page
from `index.html`. `?debug` enables a station/progress/fps HUD and
`window.journeyDebug` for inspection. No CDN or build step.

## Integration surface

`route.js` exports `getStations()`, `progressForStation(id)` and the pure
`poseAtProgress(progress)`. `main.js` re-exports the first two and exports
`onStationChange(callback)`, returning an unsubscribe function. It also dispatches
`journey:stationchange` on `window` with the station in `event.detail`.
Installations are scenery, not implementations of the projects they will eventually
introduce. Station captions use destination subtitles; classifications belong to
individual projects at integration. The evidence labels in `content/projects.js`
remain unchanged.

The Catmull–Rom route is open and centripetal. Its first leg arcs about 88 degrees
around the observatory. Workshop travel runs sideways along five benches.
Each station receives one sixth of the scroll interval: 38% dwell followed by an
eased transition to the next rest pose. The terminal station holds to the end.
The track is 30 viewport heights (about five per station). Position and yaw/pitch
converge exponentially without overshoot; yaw is capped at 0.65 rad/s and pitch
at 0.25 rad/s. Pitch targets are clamped to ±8 degrees; roll is always zero.
The pure target pose is direction-independent. The transient damped pose can lag
it while scrolling, then converges to the same rest pose from either direction.

Rendering stops after convergence and while hidden. Ripple phase depends on
scroll rather than time, so idle water does not keep the GPU running. Trees,
ferns, shore stones and architectural beams are instanced. Texture requests are
deferred until idle initialization. DPR is capped at 1.5, or 1 below 600px.
Sustained sub-28fps samples lower render resolution progressively to a 0.65 floor;
DOM text is unaffected. Tree/fern cards turn about their vertical axes in the
vertex shader; sky art wraps a distant cylindrical layer with mirrored seams.
Only the current station's point lamp is active; all six emissive accents remain
visible, avoiding six per-pixel light calculations across the whole world.
Ground uses mirrored moss tiling, bump detail and world-space colour noise; a
separate packed-earth ribbon and pale shoulders mark the route. Seeded grass and
ferns sit near its edges, with a shallow instanced mist band. Procedural canvas
textures supply wood grain, grass silhouettes and soft radial contact-shadow
decals, without new downloaded assets. Shared chamfered geometry keeps the
architecture instanced. A low warm sun from the lake side and a hemisphere light
shade MeshStandardMaterial surfaces. The observatory opening is cut from its
lower wall, with jambs, a threshold and a recessed warm-lit interior.

`antialias.js` renders to a size-matched linear buffer (half float when supported),
then applies edge-aware FXAA, ACES tone mapping and output colour conversion.
This remains active below DPR 1; resize/adaptive-resolution changes resize the
same target. All passes still run only when the camera/world needs rendering.
`presentation.js` mounts the existing `lab/words.js` hero profile at the entrance,
with a reserved-width cycle, screen-reader sentence and word-motion pause button.
The shared module handles visibility and reduced-motion preferences. Other
stations hide the hero and show their own plain subtitles. The no-JavaScript
page retains its static landscape/direct-portfolio fallback; its old status line
is hidden by the journey stylesheet.
Reduced motion defaults to the static sky view, with an explicit 3D opt-in.
The static toggle is keyboard accessible; all station links also work with native
anchors. No JavaScript, WebGL creation failure or context loss retains the sky
image and direct-portfolio link. Texture failures retain geometry and show a
recovery message. The existing direct portfolio is not modified.

## Assets and provenance

Originals were generated using `gpt-image-2.5-sunburst` with the repository's API
endpoint through `~/journey-src/gen_world_assets.py`, executed by the user with
their credential binding. Raw PNGs and exact prompts remain outside git in
`~/journey-src/`. All nine requested cutouts have actual alpha (range 0–253/254),
not a flat key colour. No chroma key removal was needed.

Shared prompt direction: misty forest lake at dawn; naturalistic, gently painterly
detail; diffuse upper-left light; deep greens #13201B/#0F1A15, pale mist #ECE7DC,
restrained dawn #E3B677; no text, people, buildings or logos.

Optimized WebPs total **880,178 bytes**, excluding Three.js (670,681 bytes):

| File | Bytes | Treatment/use |
| --- | ---: | --- |
| sky-mountains.webp | 34,670 | Opaque distant panorama and static fallback |
| ridge-treeline.webp | 42,204 | Upper 66% crop; scenic lower edge buried below terrain |
| trees-spruce.webp | 126,844 | Clean alpha cluster |
| trees-mixed.webp | 134,750 | Scenic base buried below terrain |
| trees-pine.webp | 123,888 | Upper 78% crop; base buried below terrain |
| foreground-ferns.webp | 119,878 | Alpha near-trail occluders |
| foreground-branch.webp | 114,770 | Alpha spruce boughs at curves |
| moss-ground.webp | 183,174 | Mirrored ground tiling and bump detail |

Three supplied layers are unsuitable as standalone cutouts and are not shipped:
`trees-birch.png` and `foreground-birch.png` contain an entire tiny lake landscape;
`shoreline-rocks.png` contains mountains, trees and lake rather than isolated rocks.
The world uses three other tree variants, two other foreground variants and
low-poly instanced shore rocks instead. To regenerate: insist on the requested
subject alone, with no lake, reflections, mountains or landscape inside its alpha
silhouette. Ridge and pine could also be regenerated without their scenic bases.

Three.js 0.160.1 is pinned as a devDependency; its ESM distribution and MIT license
are copied from `node_modules/three/{build/three.module.min.js,LICENSE}` into
`vendor/`. Runtime loading is local only.

## Verification environment

The initial j1 forward-scroll sample at 1440×900 rendered 232 frames over 24.29 seconds.
HUD active-frame samples had median 9.99fps, range 9.22–11.92fps, with adaptive
DPR at 0.65. This environment reports ANGLE/SwiftShader software rendering, not
a hardware GPU. This is **not** a smooth-performance pass or a mid-laptop hardware
benchmark; that target still needs hardware verification. Idle rendering produced
zero additional frames over a 1.2-second check. Browser checks covered all rest
poses, orbit/occlusion frames, mobile layout, keyboard static view, reduced motion,
no-JavaScript and unavailable-WebGL fallbacks, with no page/console errors during
the ordinary journey. Screenshots and full output are outside git under
`~/shots/j1/` and `~/journey-src/check-results.txt`.

The j2 art-direction pass rendered 190 frames over 24.01 seconds, with HUD samples
at median 6.42fps (6.05–6.85fps) and DPR 0.65 on the same software renderer.
This is slower than j1 and still not a smooth-performance pass; hardware-GPU
performance remains unverified. Idle rendering again produced zero extra frames.
All six station views, orbit/occlusion, mobile entrance and fallback captures are
under `~/shots/j2/`; browser output is `~/journey-src/art-results.txt`. Fresh
captures were reviewed for terrain, installation treatment and station copy.
The browser reported no console/page errors, no 390px/820px horizontal overflow,
and a stable cycle box across word changes. `npm test` retained all 47 passes;
`node --test journey/art.test.js` adds three passing presentation/post-process
checks without changing the existing test suite.
