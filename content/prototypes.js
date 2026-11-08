const rating = (value,rationale) => ({value,rationale});
const poker = {repo:'ela57/pokerbot',commit:'eb245bfc6ec94a1f7158c30b403d6b5a07b4a878',seed:1000000};
export const scoreKeys = ['connection','visual','clarity','distinctiveness','performanceCost','maintenanceEffort'];
export const prototypes = [
  {
    id:'strategy-risk',title:'Strategy risk / return map',area:'Quantitative research',label:'Working project integration',
    sources:[{path:'lab/strategy/engine.js'},{path:'lab/strategy/data/spy.json'}],
    shows:'Compare in-sample SMA parameter pairs against buy & hold using the real sandbox engine.',
    mount:{module:'/prototypes/risk-map.js',export:'mount'},recommendation:'main',
    scores:{connection:rating(5,'Uses the existing backtest and bundled prices.'),visual:rating(4,'A compact field of outcomes replaces a wall of curves.'),clarity:rating(4,'Two axes and explicit parameter details; in-sample is prominent.'),distinctiveness:rating(4,'Shows a parameter landscape instead of a single selected run.'),performanceCost:rating(3,'35 backtests run in a disposable worker, not the UI thread.'),maintenanceEffort:rating(2,'Engine remains shared; only the grid and chart are local.')}
  },
  {
    id:'realized-vol',title:'Close-to-close volatility timeline',area:'Quantitative research',label:'Research prototype',
    sources:[{path:'lab/strategy/data/spy.json'},{path:'prototypes/finance.js'}],
    shows:'Scrub adjusted price and rolling close-to-close realized volatility, distinct from notebook GK estimates.',
    mount:{module:'/prototypes/vol-timeline.js',export:'mount'},recommendation:'detour',
    scores:{connection:rating(4,'Uses the audited SPY series, not the notebook OHLCV inputs.'),visual:rating(4,'Aligned price and volatility share a movable date cursor.'),clarity:rating(5,'Window, return convention and estimator distinction are explicit.'),distinctiveness:rating(3,'A familiar timeline that complements the existing research.'),performanceCost:rating(2,'Linear rolling calculation and two SVG paths.'),maintenanceEffort:rating(2,'One estimator with no external event-data dependency.')}
  },
  {
    id:'poker-replay',title:'Poker hand replay · hero view',area:'Poker',label:'Research prototype',
    sources:[{...poker,path:'prototypes/data/poker-run.json'},{path:'tools/export_poker.py'}],
    shows:'Move among decision-time observations in 20 featured hands without filling in hidden information.',
    mount:{module:'/prototypes/poker-replay.js',export:'mount'},recommendation:'main',
    scores:{connection:rating(5,'Actual deterministic hero observations from the audited run.'),visual:rating(4,'Board, hero cards and public stacks form a readable table.'),clarity:rating(4,'Unknown streets stay unknown; every frame is before a decision.'),distinctiveness:rating(5,'Exposes the bot’s information boundary rather than an omniscient replay.'),performanceCost:rating(2,'One observation rendered at a time from a compact local export.'),maintenanceEffort:rating(3,'Exporter whitelist and observation schema must remain aligned.')}
  },
  {
    id:'poker-inspector',title:'Poker decision inspector',area:'Poker',label:'Research prototype',
    sources:[{...poker,path:'prototypes/data/poker-run.json'},{path:'tools/export_poker.py'}],
    shows:'Filter logged decisions and compare legal, requested and applied actions with recorded diagnostics.',
    mount:{module:'/prototypes/poker-inspector.js',export:'mount'},recommendation:'detour',
    scores:{connection:rating(5,'Displays the exact recorded decision interface.'),visual:rating(3,'Structured JSON favors precision over spectacle.'),clarity:rating(4,'Legal actions and request/application are separated.'),distinctiveness:rating(4,'Makes bot reasoning and execution differences inspectable.'),performanceCost:rating(1,'Filters only 200 decision records; no simulation.'),maintenanceEffort:rating(2,'Shares the replay export and selection store.')}
  },
  {
    id:'poker-session',title:'Poker session / stack chart',area:'Poker',label:'Research prototype',
    sources:[{...poker,path:'prototypes/data/poker-session.json'},{path:'tools/export_poker.py'}],
    shows:'Track hero end-of-hand chips across all 200 hands, with public elimination and blind-change markers.',
    mount:{module:'/prototypes/poker-session.js',export:'mount'},recommendation:'experiment',
    scores:{connection:rating(5,'Whitelisted public hand-boundary totals from the same audited run.'),visual:rating(4,'A stack curve contextualizes individual decisions.'),clarity:rating(3,'Missing hero observations are disclosed when opening a hand.'),distinctiveness:rating(3,'A useful navigation overview, not evidence of playing strength.'),performanceCost:rating(2,'200 SVG points and one path; no animation loop.'),maintenanceEffort:rating(3,'A separate public-summary whitelist protects the replay boundary.')}
  },
  {
    id:'chess-preview',title:'Chess puzzles / reusable lab',area:'Chess',label:'Working project integration',
    sources:[{path:'lab/chess/board.js'},{path:'lab/chess/puzzles.js'},{path:'tests/chess-puzzles.test.js'}],
    shows:'Play the existing validated puzzles; the same board mounts in the second five-stage lab.',
    mount:{module:'/prototypes/chess.js',export:'mount'},recommendation:'main',
    scores:{connection:rating(5,'Uses the real board, puzzles and legality engine.'),visual:rating(4,'Existing geometric pieces remain legible at small sizes.'),clarity:rating(5,'Hints, feedback and solution playback are already implemented.'),distinctiveness:rating(3,'Strong hands-on content in a familiar board format.'),performanceCost:rating(1,'64 squares with no continuous rendering loop.'),maintenanceEffort:rating(1,'Adapter reuses the existing tested puzzle system.')}
  }
];

const added = [
  ['renderer-play','Renderer lighting & materials','Graphics','Working project integration',['lab/renderer.js','lab/pipeline.js','main.js'],'Change light direction, diffuse color mixing and projection in the site’s Canvas renderer, not the original Python.','renderer-play.js','main',[[5,'The exact renderer is imported by the direct project view.'],[4,'Lighting and focal changes make the geometry readable.'],[4,'Uniform flat color is distinguished from per-face Lambert lighting.'],[4,'Shows the rendering assumptions rather than a prerecorded image.'],[2,'Twenty triangles on Canvas; demand redraw without auto-rotation.'],[2,'Default output stays shared with the existing bench.']]],
  ['thermal-gallery','Thermal illustration / preset gallery','Graphics','Illustrative simulation',['lab/thermal.js','main.js'],'Choose four range / edge / grain presets, then adjust the same existing SVG illustration.','thermal-gallery.js','detour',[[5,'Reuses the existing thermal illustration without pretending to run Unity.'],[4,'Four thumbnail treatments expose the effect vocabulary.'],[5,'Source absence and illustrative status are explicit.'],[3,'A compact comparison lens on an existing demo.'],[2,'Four small SVGs and one adjustable view; static noise filter.'],[2,'One shared SVG mount and four configuration objects.']]],
  ['project-map','Project world map','Site-wide','Working project integration',['journey/route.js','content/projects.js','content/destinations.js'],'Filter actual projects and see their stations along the authored camera curve.','world-map.js','main',[[5,'Route positions and project membership come from the site models.'],[4,'Schematic route links project filters to place.'],[4,'Counts include disclosed placeholders rather than hiding them.'],[4,'A direct overview of the immersive journey.'],[1,'A sampled SVG path and six markers; no WebGL.'],[1,'No copied route or project lists to keep synchronized.']]],
  ['guided-tour','60-second supported-station tour','Site-wide','Working project integration',['journey/tour.js','journey/main.js'],'A timed, pausable four-stop journey with reduced-motion cuts and explicit captions.','tour.js','detour',[[5,'Navigates the real journey through supported project stations.'],[4,'Uses the existing full forest world.'],[4,'Four captions, a timer, Pause, Skip and Exit.'],[3,'An accessible guided alternative to free exploration.'],[5,'An iframe runs the real WebGL world while mounted.'],[2,'A small navigation-injected module with no new route model.']]],
  ['accumulator','Generic accumulator / maximum nibble','Illustrative hardware','Illustrative simulation',['prototypes/accumulator-engine.js','prototypes/accumulator.js'],'Step a generic AC machine through repeated subtraction; inspect PC, memory and SUB. Not coursework or official SCOMP.','accumulator.js','experiment',[[2,'Connects only to the topic; no coursework source is present.'],[3,'Register and program views favor explanation over spectacle.'],[4,'Generic ISA, signed arithmetic and return-stack assumptions are stated.'],[4,'SUB makes division, comparison and branching inspectable.'],[1,'A bounded integer program and DOM updates only on interaction.'],[3,'An original pedagogical ISA needs its own behavior tests.']]],
  ['moore-fsm','Switches, LEDs & a Moore sequence','Illustrative hardware','Illustrative simulation',['prototypes/fsm-engine.js','prototypes/fsm.js'],'Clock a generic feed / press / eject sequence and inspect synchronized input/output traces. Not Ethan’s VHDL.','fsm.js','experiment',[[2,'Generic topic illustration, not evidence of the missing VHDL.'],[4,'LEDs and a timing diagram link state to visible output.'],[5,'Inputs change asynchronously; outputs advance on the sampled clock.'],[4,'Timing records reveal state transitions beyond a static diagram.'],[1,'Six SVG tracks, capped at 24 recorded clocks.'],[2,'Four states and pure transition/output functions.']]],
  ['motion-playground','Motion comparison playground','Site-wide','Illustrative simulation',['dev/motion.html','dev/motion.js','dev/motion-poses.js','journey/world.js','lab/strategy/data/spy.json'],'Eight camera techniques, one forest, adjustable damping / speed and deterministic scrubbing.','motion-link.js','experiment',[[4,'Reuses forest assets, authored route and bundled SPY prices.'],[4,'Each camera idea can be compared at the same progress.'],[4,'Technique notes state use and cost, not performance benchmarks.'],[5,'Includes portal, exploded assembly, overview and a price ribbon.'],[4,'Reduced tree cards still require a full WebGL scene.'],[3,'Eight deterministic paths plus a small display controller.']]]
];
prototypes.push(...added.map(([id,title,area,label,paths,shows,module,recommendation,ratings])=>({id,title,area,label,sources:paths.map(path=>({path})),shows,mount:{module:`/prototypes/${module}`,export:'mount'},recommendation,scores:Object.fromEntries(scoreKeys.map((key,i)=>[key,rating(...ratings[i])]))})));
