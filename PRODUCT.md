# Product
<!-- impeccable:product-schema 1 -->
## Platform
web

## Users
Anyone evaluating Ethan Lam's engineering and quantitative work: recruiters, engineers, and peers. Ethan's stated aim is "a very aesthetic website, but quant and graphs", so the visitor should come away remembering the craft and the data work.

## Product Purpose
A personal portfolio for Ethan Lam, a Georgia Tech Computer Engineering student (class of 2028). It shows real graphics, quantitative, and interactive work, and lets visitors use that work directly in the browser.

## Positioning
The work runs live on the page: a hand-written software 3D renderer, a historical moving-average backtest on bundled SPY data, validated chess puzzles, and a rigid-body chip simulation. A neighbour portfolio can't copy those, because they're Ethan's own projects.

## Operating Context
Visitors open it from a link (résumé, LinkedIn, email) on desktop or phone, usually for a short look. The first screen pairs Ethan's name with a live interactive piece.

## Capabilities and Constraints
- Static HTML/CSS/ES modules. No build step or framework. Vendored libraries live under `vendor/`. Hosted on GitHub Pages behind the `ethan-lam.com` CNAME, and hosting config must not change.
- Node is used only for tests (`npm test`).
- Lab modules (chess, strategy sandbox, chips, reactive name) are lazy-loaded and clean up on hide and pagehide. They must survive bfcache restores.
- Content may be trimmed or rewritten. Facts may not be invented.
- There is no public GitHub link and no reverse-engineering/malware project. Neither may be re-added.
- The résumé link is a mailto request (there is no public résumé URL).
- Do not merge, deploy, or change Cloudflare, GitHub Pages, DNS, or CNAME.

## Evidence on Hand
- Software 3D renderer (Python/NumPy/Matplotlib), re-implemented live in JS.
- Unity/HLSL/C# thermal-vision post-process shader.
- Realized-volatility study on SPY (pandas, statsmodels, yfinance): `assets/projects/realized-vol-*.png`.
- GTSF Investment Committee, quant sector project manager.
- Lab: 12 chess puzzles, SPY adjusted-close data 2005–2026 from Yahoo via yfinance (`lab/strategy/data/spy.json`), a seeded simulated series, and Matter.js chips.
- Contact: ethanlam52@gmail.com, LinkedIn `ethanlam7`.
- Absent, and not to be fabricated: a photo, outcome metrics for the renderer and shader, testimonials.

## Product Principles
- The work is the interface: show it running, not described.
- Quant and graphics are shown through real data and real renders.
- Every claim is something Ethan actually built or measured.
- Fast, static, and accessible on any device.

## Accessibility & Inclusion
Keyboard operable throughout, reduced-motion support, focus management in overlays, and WCAG AA contrast.
