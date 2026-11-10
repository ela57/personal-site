import { about } from './eportfolio.js';

// Destination keys are content identifiers, not newly implemented hash routes.
export const projects = [
  {
    id: "renderer", title: "A renderer with no graphics API", destination: "renderer",
    label: "Illustrative simulation",
    summary: "A JavaScript and Canvas 2D illustration of a Python rendering pipeline.",
    body: [
      "The original renderer computes transformation matrices and shaded triangles in Python and NumPy, then draws them with Matplotlib.",
      "The pipeline includes world, view and projection transforms, perspective divide, backface culling, depth clipping, painter’s sorting and diffuse lighting.",
      "The browser bench re-implements the stages in JavaScript and Canvas 2D; the original Python renderer clips in NDC, while this browser illustration clips in view space before projecting.",
      "Painter’s algorithm sorts whole faces rather than keeping a per-pixel depth buffer, and cannot resolve intersecting faces or cyclic overlap."
    ],
    links: [{ title: "Case study and pipeline bench", href: "#project/renderer" }, { title: "Selected work", href: "#projects" }],
    assets: ["assets/renderer-cover.webp", "assets/renderer-cover-768.webp", "assets/pipeline-1.png", "assets/pipeline-2.png", "assets/pipeline-3.png", "assets/pipeline-4.png", "assets/pipeline-5.png"],
    dataSources: [{ repo: "personal-site", path: "projects/index.html", section: "#tpl-renderer, #tpl-bench, .pipeline" }, { repo: "personal-site", path: "main.js", symbol: "createRenderer" }, { repo: "personal-site", path: "lab/pipeline.js" }],
    needsContent: false
  },
  {
    id: "thermal", title: "Seeing depth as heat", destination: "thermal",
    label: "Illustrative simulation",
    summary: "A browser illustration of a depth-based thermal-vision effect.",
    body: [
      "The original effect is written in HLSL and exposed through a Unity PostProcessing volume.",
      "Scene depth maps onto a cold-to-hot colour ramp; surfaces beyond the adjustable max distance clamp to the coldest colour.",
      "A Sobel operator on the depth buffer finds silhouettes, and a procedural grain pass adds sensor noise.",
      "The browser illustration uses SVG. The real shader runs on the GPU inside Unity."
    ],
    links: [{ title: "Case study and Try it", href: "#project/thermal" }],
    assets: ["assets/shader-cover.webp", "assets/shader-cover-768.webp"],
    dataSources: [{ repo: "personal-site", path: "projects/index.html", section: "#tpl-thermal" }, { repo: "personal-site", path: "main.js", symbol: "mountThermal" }],
    needsContent: false
  },
  {
    id: "vol", title: "Does today’s volatility predict tomorrow’s return?", destination: "volatility-research",
    label: "Research prototype",
    summary: "A hypothesis-driven study of realized volatility and next-day SPY returns.",
    body: [
      "The study uses close-to-close, Parkinson, Garman–Klass and Rogers–Satchell estimators on daily SPY data from 2000 onward.",
      "Correlation, quintile buckets and OLS regressions use a time-based train, validation and test split.",
      "Volatility alone has R² = 0.000; adding lagged return and volatility change lifts R² to 0.004, with a negative lagged-return coefficient and p = 0.005.",
      "The notebook reports test-period signal Sharpe 0.66 versus 0.55 for buy-and-hold, with about 49% average daily turnover; transaction costs matter."
    ],
    links: [{ title: "Case study", href: "#project/vol" }],
    assets: ["assets/projects/realized-vol-equity.png", "assets/projects/realized-vol-equity.webp", "assets/projects/realized-vol-rolling.png", "assets/projects/realized-vol-rolling.webp"],
    dataSources: [
      { repo: "personal-site", path: "projects/index.html", section: "#tpl-vol" },
      { repo: "ela57/Projects", path: "realized_vol_spy.ipynb", revision: "2c21c801147cd2b768fb80a611cf59690d33f6d3", url: "https://github.com/ela57/Projects/blob/2c21c801147cd2b768fb80a611cf59690d33f6d3/realized_vol_spy.ipynb" },
      { repo: "ela57/Projects", path: "realized_volatility_writeup.pdf", revision: "2c21c801147cd2b768fb80a611cf59690d33f6d3" }
    ],
    needsContent: false
  },
  {
    id: "strategy", title: "Strategy sandbox", destination: "strategy",
    label: "Working project integration",
    summary: "A moving-average model with historical prices, explicit assumptions and trading costs.",
    body: [
      "The strategy is long when the short SMA exceeds the long SMA, otherwise flat; close signals fill at the next close.",
      "Date selection slices prices before warm-up; costs apply to traded notional on entries and exits.",
      "Adjusted-price fills are a modelling convention, not executable quotes. There is no cash interest, tax or slippage beyond the selected cost."
    ],
    links: [{ title: "Open the sandbox", href: "#lab/strategy" }],
    assets: ["assets/strategy-preview.svg"],
    dataSources: [{ repo: "personal-site", path: "lab/strategy/data/spy.json", source: "https://finance.yahoo.com/quote/SPY/history/", series: "Adj Close", retrieved: "2026-10-27", period: ["2005-01-03", "2026-10-27"] }, { repo: "personal-site", path: "lab/strategy/sandbox.js" }, { repo: "personal-site", path: "lab/strategy/engine.js" }],
    needsContent: false
  },
  {
    id: "strategy-simulation", title: "Simulated strategy dataset", destination: "strategy-simulation",
    label: "Illustrative simulation",
    summary: "Seeded GBM, not market data.",
    body: ["The sandbox offers a seeded GBM price series alongside the bundled SPY prices."],
    links: [{ title: "Sandbox dataset selector", href: "/projects/#lab/strategy/simulated" }],
    assets: [],
    dataSources: [{ repo: "personal-site", path: "lab/strategy/simulated.js" }, { repo: "personal-site", path: "lab/strategy/sandbox.js" }],
    needsContent: false
  },
  {
    id: "chess", title: "Chess puzzles", destination: "chess",
    label: "Working project integration",
    summary: "Twelve chess puzzles: a board, a few clues and a move that changes everything.",
    body: ["Drag a piece, or select a piece and its destination. Arrow keys navigate; Enter or Space selects.", "The first puzzle is White to move: the three pawns deny the king an escape square, and the rook owns the eighth rank."],
    links: [{ title: "Play the puzzles", href: "#lab/chess" }],
    assets: ["assets/chess-preview.svg", "lab/chess/PIECES-LICENSE"],
    dataSources: [{ repo: "personal-site", path: "projects/index.html", section: "#lab" }, { repo: "personal-site", path: "lab/chess/puzzles.js" }, { repo: "personal-site", path: "lab/chess/board.js" }, { repo: "personal-site", path: "vendor/chess.js" }],
    needsContent: false
  },
  {
    id: "poker", title: "Poker Practice", destination: "poker",
    label: "Research prototype",
    summary: "A local, deterministic Texas Hold’em simulation for developing and comparing bots.",
    body: [
      "PokerKit owns betting, side pots, refunds and showdown resolution; the practice runner owns tournaments, schedules, observations, timing and logs.",
      "MyBot implements act(obs) with optional table-start and hand-end hooks; hero source files are snapshotted and hashed.",
      "Practice defaults and timing budgets are assumptions, not official competition specifications. Opponents are configurable heuristics, not optimal play or proxies for real competitors.",
      "Hero logs retain the hero’s observations; omniscient replay includes private hands and hindsight flags. Offline equity is calculated after the run and labelled separately from decisions.",
      "The build does not implement external network or AI calls."
    ],
    links: [], assets: [],
    dataSources: [{ repo: "pokerbot", path: "README.md", revision: "eb245bfc6ec94a1f7158c30b403d6b5a07b4a878" }, { repo: "pokerbot", path: "docs/LOGGING.md" }, { repo: "pokerbot", path: "pokerpractice/logging_store.py" }, { repo: "pokerbot", path: "bots/my_bot.py" }],
    needsContent: false
  },
  {
    id: "portfolio-manager", title: "Portfolio Manager", destination: "portfolio-manager",
    label: "Proposed future feature",
    summary: "Capital allocation, rebalancing and risk constraints in a central Python portfolio controller.",
    body: ["Portfolio Manager, Quant Sector — GTSF Investment Committee, Georgia Tech Student Foundation; Aug 2025–present.", "Built a central portfolio controller in Python for capital allocation, rebalancing and risk constraints.", "Reworked trading scripts and the backtesting pipeline for reproducible, out-of-sample validation.", "Led the integration of two independent strategies into one production-ready system."],
    links: [{ title: "Existing experience text", href: "/projects/#experience" }], assets: [],
    dataSources: [{ repo: "personal-site", path: "projects/index.html", section: "#experience" }],
    needsContent: false
  },
  {
    id: "data-universe", title: "Data Universe", destination: "data-universe",
    label: "Proposed future feature", summary: "", body: [], links: [], assets: [], dataSources: [], needsContent: true
  },
  {
    id: "malware-research", title: "Malware research (IDA CFG)", destination: "malware-research",
    label: "Proposed future feature", summary: "", body: [], links: [], assets: [], dataSources: [], needsContent: true
  },
  {
    id: "scomp", title: "SCOMP", destination: "scomp",
    label: "Proposed future feature", summary: "", body: [], links: [], assets: [], dataSources: [], needsContent: true
  },
  {
    id: "palletizer-fsm", title: "VHDL / palletizer FSM", destination: "palletizer-fsm",
    label: "Proposed future feature", summary: "", body: [], links: [], assets: [], dataSources: [], needsContent: true
  },
  {
    id: "human-interaction", title: "Human-interaction research", destination: "human-interaction",
    label: "Proposed future feature", summary: "", body: [], links: [], assets: [], dataSources: [], needsContent: true
  },
  {
    id: "chess-buddies", title: "Chess Buddies leadership", destination: "chess-buddies",
    label: "Working project integration",
    summary: 'President · Aug 2022–May 2024 · Chess Buddies',
    body: [about[3]],
    links: [{ title: 'Chess Buddies leadership', href: '/about/#chess-buddies' }], assets: [],
    dataSources: [{ repo: 'personal-site', path: 'assets/Lam_Ethan_Resume.pdf' }, { repo: 'personal-site', path: 'about/index.html', section: '#chess-buddies' }], needsContent: false
  },
  {
    id: "resume", title: "Résumé", destination: "resume",
    label: "Working project integration",
    summary: "Computer engineering at Georgia Tech, class of 2028.",
    body: ["Cybersecurity and Distributed Systems & Software Design threads.", "B.S. Computer Engineering, Georgia Institute of Technology, 2028."],
    links: [{ title: "View résumé", href: "/resume/" }, { title: "About", href: "/about/" }, { title: "Contact", href: "/projects/#contact" }, { title: "Email", href: "mailto:ethanlam52@gmail.com" }, { title: "LinkedIn", href: "https://www.linkedin.com/in/ethanlam7/" }],
    assets: ['assets/Lam_Ethan_Resume.pdf'], dataSources: [{ repo: "personal-site", path: "assets/Lam_Ethan_Resume.pdf" }],
    needsContent: false
  }
];
