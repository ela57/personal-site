import { projects } from './projects.js';

export const labStages = ['encounter', 'understand', 'experiment', 'inspect', 'reflect'];
const strategy = projects.find(project => project.id === 'strategy');
const chess = projects.find(project => project.id === 'chess');

export const labs = [{
  id: 'strategy', title: strategy.title, projectId: strategy.id, label: strategy.label,
  stages: {
    encounter: {
      title: 'A signal, and the cost of following it',
      paragraphs: ['A moving-average model. Historical prices, explicit assumptions, and the cost of being wrong.', 'This read-only view runs the same sandbox with its default 20 / 100-session averages and 5 bps per change. The bundled SPY adjusted closes are historical data, not live prices.'],
      mount: { module: '/lab/strategy/lab.js', export: 'mountEncounter' }
    },
    understand: {
      title: 'Separate the signal from the fill',
      problem: ['A crossing of moving averages is not an executable return. The model must distinguish observed prices, a signal, a later fill and the cost of changing position.'],
      approach: ['Long when the short SMA exceeds the long SMA; otherwise flat. Signals on close, filled next close. No position during warm-up.', 'Date selection slices prices first, with warm-up taken from within the range. The strategy and buy-and-hold curves start at 1, with costs applied to traded notional.']
    },
    experiment: {
      title: 'Change an assumption',
      paragraphs: ['Adjust the SMA windows, date range or cost per position change. Compare the equity curves, fill markers and trade ledger.', 'SPY uses bundled adjusted closes. The alternative dataset is explicitly simulated, seeded GBM—not market data. Reset defaults returns to SPY and the original parameters.'],
      mount: { module: '/lab/strategy/lab.js', export: 'mountExperiment' }
    },
    inspect: {
      title: 'Follow the calculation',
      paragraphs: ['These excerpts are loaded from the actual engine file at runtime, not copied into the presentation. Positions lag signals; returns use the position held before the close, then charge any change at that close.'],
      excerpts: [
        { title: 'Prices, averages and the lagged signal', path: 'lab/strategy/engine.js', start: 29, end: 39 },
        { title: 'Returns, fills and costs', path: 'lab/strategy/engine.js', start: 40, end: 57 },
        { title: 'An open trade and the returned results', path: 'lab/strategy/engine.js', start: 58, end: 63 }
      ],
      steps: ['Prices', 'Moving averages', 'Signal', 'Positions', 'Costs', 'Equity']
    },
    reflect: {
      title: 'What this model leaves out',
      lessons: ['Keeping signals, positions and returns separate makes the execution convention inspectable.', 'Entry and exit costs change both the trade ledger and compounded equity. Open trades are marked to the last close, without an assumed liquidation cost.'],
      limitations: ['The historical mode contains one asset, SPY. It is not a multi-asset portfolio or index-membership study.', 'Parameters are selected on the displayed history; the code has no separate hold-out or walk-forward evaluation.', 'Fills use adjusted closing prices, not executable quotes. The fixed basis-point charge does not separately model bid/ask spread, market impact or an order book.', 'No cash interest, taxes or slippage beyond the selected cost. Sharpe uses rf=0 and volatility uses a 252-session annualization.'],
      improvements: ['A possible next step is explicit hold-out or walk-forward evaluation before interpreting parameter comparisons.', 'Separate execution assumptions from the current single basis-point charge. These are potential improvements, not implemented features.']
    }
  }
}, {
  id: 'chess', title: chess.title, projectId: chess.id, label: chess.label,
  stages: {
    encounter: {
      title: 'Find the forcing move',
      paragraphs: ['Twelve curated puzzles, three difficulty levels and a board backed by chess.js. This read-only position is the first bundled puzzle: The locked back rank.', 'Experiment enables legal moves, hints, undo and solution playback. The preview does not change saved progress.'],
      mount: { module: '/lab/chess/lab.js', export: 'mountEncounter' }
    },
    understand: {
      title: 'A legal move is not always the forcing line',
      problem: ['A mate claim needs more than a plausible sequence. Starting positions, side to move, legal moves and the available defences must agree.'],
      approach: ['Puzzle entries supply a FEN, a strict SAN solution and a declared mate length. The tests validate these and check the claim against every defence.', 'The board uses chess.js for legal destinations and move attempts. Scripted replies follow the stored line; this is not a general-purpose chess opponent.']
    },
    experiment: {
      title: 'Play, inspect a hint, try again',
      paragraphs: ['Select a piece and destination, drag a piece, or use the arrow keys with Enter / Space. Try Hint, Undo or another difficulty.', 'Show solution plays the stored line but is not counted as a solve. Progress is local to this browser when storage is available.'],
      mount: { module: '/lab/chess/lab.js', export: 'mountExperiment' }
    },
    inspect: {
      title: 'From a FEN to a verified mate',
      paragraphs: ['The board compares legal attempts with the stored SAN line. A different final move is accepted if it delivers checkmate. The test search distinguishes an attacking choice from every defending choice.'],
      excerpts: [
        { title: 'Position, side to move and mate metadata', path: 'lab/chess/puzzles.js', start: 1, end: 13 },
        { title: 'Expected move and legal destinations', path: 'lab/chess/board.js', start: 51, end: 62 },
        { title: 'Legal attempts and the final checkmate test', path: 'lab/chess/board.js', start: 119, end: 132 },
        { title: 'Validation against all defences', path: 'tests/chess-puzzles.test.js', start: 33, end: 44 }
      ],
      steps: ['FEN + solution + mate length', 'Validate the starting position', 'Apply legal moves with chess.js', 'Check every defending reply in tests', 'Verify final checkmate']
    },
    reflect: {
      title: 'A small, inspectable puzzle system',
      lessons: ['Board orientation comes from the side to move in the FEN. The rendering and legality engine share the same position.', 'A cooperative line is not proof of forced mate; the tests explicitly consider defences.'],
      limitations: ['The twelve puzzles are curated, not generated or adaptively rated.', 'Opponent replies in the UI use the stored line rather than a general search engine.', 'Progress uses optional localStorage. There is no account or cross-device synchronization.'],
      improvements: ['A possible extension is exploring alternative defending lines in the UI, rather than only in validation tests.', 'More positions would need the same legality and mate checks before being added. Neither extension is implemented here.']
    }
  }
}];
