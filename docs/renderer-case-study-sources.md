# Renderer case-study additions: claim ledger

The new E–H sections describe the **current JavaScript/Canvas illustration**, not a newly inspected Python implementation. No original Python renderer source is present in this repository (`generate_image.py` and the other Python tools are unrelated). Existing Python-project context remains unchanged. No performance measurements, course details or results were added.

Line references below are to the unchanged renderer/runtime sources in this branch.

| New claim | Supporting code |
|---|---|
| Indexed icosahedron has twelve vertices, constructed using the golden ratio and normalized to unit length; twenty triangular faces | `lab/renderer.js:9–14`, explicit vertex and face arrays |
| Model vertices rotate around Y then X, then translate in positive Z into view space | `lab/renderer.js:20–21,48–49` |
| Projection divides X/Y by depth and includes focal/normalization factors; canvas mapping centres and flips Y | `lab/renderer.js:45,50–52,71–74` |
| View-space normal is the normalized cross product of two edges; negative normal–centroid dot product determines front-facing triangles | `lab/renderer.js:64–68` |
| Backface culling keeps front-facing triangles | `lab/renderer.js:80–82` |
| Clipping maps view depths 3.45–4.95 into −1…1, clips before projection, then reconstructs depth for projection | `lab/renderer.js:69–74` |
| Clipper processes both boundaries, keeps inside vertices and linearly interpolates edge intersections | `lab/pipeline.js:9–24` |
| Sort stage restores the uncut mesh, enables sorting and order labels | `lab/pipeline.js:1–6`, especially mode four |
| Faces sort by descending centroid depth, not per-pixel depth; order labels use that list | `lab/renderer.js:67,76,83,111–114` |
| Default normalized light vector is (−0.5,0.75,−0.9) in view space | `lab/renderer.js:22,31` |
| Diffuse term is a clamped normal–light dot product; ambient 0.18 and diffuse 0.82 drive paper-to-blue front-face colour | `lab/renderer.js:3–4,31,76,88–91` |
| Colour fills each polygon rather than using textures/interpolated vertex colours | `lab/renderer.js:85–93`, single fill colour per face |
| Scroll selection uses a 55%-height reading line in the overlay, in either direction | `lab/pipeline.js:27–31,50–55,81` |
| Story renderers disable rotation and drag; reduced motion skips enhancement and retains the existing static images/descriptions | `lab/pipeline.js:57–70`; `projects/index.html:300–304`, renderer template's five static step images |
| Four bench buttons select vertices, wireframe, fill, shade; checkboxes toggle culling and sorting; slider changes focal length | `main.js:129–136`; `projects/index.html:399–407`, `tpl-bench` control labels/data attributes |
| Drag adjusts rotation and stops automatic rotation | `lab/renderer.js:130–139`; `main.js:137` |
| Focal slider also adjusts camera distance to approximately preserve apparent size while changing perspective | `lab/renderer.js:45–52`; `main.js:135–136` |
| Live readouts show drawn/culled face counts and ordering rule | `main.js:122–126` |

Public-page audit before editing: `/` and `/projects/` each rendered one `.pipeline` containing five static stage images/descriptions between renderer and thermal selected work. The renderer summary enumerated the stages and its learning note described sorting. There was no `#F14` on either route. The ordinary single-image renderer previews in the gallery, selected work and destination index are not five-stage stories; they remain links to the case study.

The overlay template is now the sole primary-page source of the story. The generator no longer reads a public-page story and copies it into that template. `/experiments/scroll/` and `/explore/` are unchanged.
