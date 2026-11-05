---
title: The Trading Pit
description: Ethan Lam's static engineering and quantitative portfolio.
colors:
  floor: "#14161A"
  amber: "#F2A30F"
  amber-dim: "#5A3D07"
  graphics: "#2F6B4F"
  quant: "#B3261E"
  lab: "#23408E"
  stock: "#E4DCC6"
  rule: "#C9BFA5"
  ink: "#16171A"
  light: "#ECE7DA"
typography:
  family: Archivo
  display-width: 62
  board-label-width: 125
  prose-width: 100
rounded: 0
---

# The Trading Pit

## Overview

A historical price display introduces working engineering projects. Charcoal and amber belong to the board; green, red and blue identify Graphics, Quant and Lab. Ticket-stock surfaces carry project evidence and interactive case studies, not generic dashboard widgets.

The composition begins with the SPY board, an overlapping ELM identity badge and three project stubs. Large section lettering and staggered project tickets create the page's rhythm. Contact returns to the charcoal clearing desk.

## Color and contrast

`styles.css` owns the palette tokens. Paper uses dark ink; saturated fields use light ink. Secondary ticket text uses `#535349`. Chess uses stock and `#53624F`, preserving readable coordinate labels and contrasting piece outlines.

Checked text contrasts: light/green 5.10:1, light/red 5.29:1, light/blue 7.75:1, secondary ink/stock 5.68:1, stock/chess-dark 4.76:1, amber/floor 8.64:1. Dim amber is a non-text structural color, not a readable text token. Amber focus indicators have a dark backing on stock surfaces.

## Typography

Archivo is the sole loaded face, from `assets/fonts/archivo-var.woff2`. Condensed display headings and the badge use width 62; board legend labels use width 125. Prose retains normal width. Numerals use tabular figures. Price-board lettering is drawn with dot glyphs, not another font.

Body copy is generally 16px; compact captions and UI labels are at least 12px. There are no labels above display headings. Project numbers sit beside titles, rather than becoming decorative kickers.

## Layout and shapes

The desktop grid has 12 columns with fluid page margins. Tickets span eleven columns and alternate their inset. At 1100px tickets use full width and the identity/stub layout becomes two columns. Below 720px everything stacks, including board readouts and Lab previews. Surfaces are square-cornered, divided by hairlines and dashed rules. Depth comes from overlap and color, not offset shadows or glass.

## Components

- **Price board:** historical Yahoo adjusted closes, engine-derived 20/100 SMAs and next-close buy/sell flags; a moving readout of actual data and project figures. Pointer capture and damped momentum scrub dates. Arrow keys advance one session; Home/End jump to endpoints. The live text readout mirrors the selected date.
- **Badge:** condensed ELM with subtle mouse/pen spring response, followed by the owner's name, degree and GTSF role. Static under reduced motion.
- **Ticket stubs:** three direct project routes with stack information rather than invented project dates.
- **Project tickets:** large live renderer/shader figures, existing notebook plots, project facts, an opening link and optional annotations.
- **Opened tickets:** shared hash-routed overlay, stock background, sticky close bar, inert backdrop, focus trap and focus restoration.
- **Lab:** lazy Chess and strategy previews lead to their full interactive overlays. The contained chip canvas retains Release/Reset/Replay and its touch-scroll-safe physics.
- **Clearing desk:** large mail link, LinkedIn and résumé request mailto.

## Motion and lifecycle

Board power-on lasts approximately 600ms. Ticket opening is 320ms with `cubic-bezier(.32,.72,0,1)`; closing is 200ms. Reduced-motion tickets fade for 150ms; the board and chip pile are static. Ordinary transitions name their properties and stay within 200ms. Fine-pointer hover styles live in their media query, and pressables scale to .97 when active.

Board drawing and physics pause offscreen and in hidden tabs. Runtime libraries remain vendored and lazy-loaded. Every pagehide teardown preserves bfcache entries by checking `event.persisted`.

## Evidence and boundaries

The board consumes `lab/strategy/data/spy.json`; signal logic remains in `lab/strategy/engine.js`. Figures and project claims retain their existing data provenance. No project date is fabricated. Notebook-image provenance is embedded in PNG metadata and WebP sidecars.

The thermal illustration retains its depth ramp and optional grain because those demonstrate the shader's actual controls, not decorative page gradients. It must not become a background treatment elsewhere.

Keep content visible by default. Do not add glows, glass, decorative gradients, scroll-reveal fades, extra font families, invented metrics or trading/wagering functionality. Preserve the no-build static deployment and existing hosting configuration.
