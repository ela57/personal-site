import { projects } from './projects.js';

export const labStages = ['encounter', 'understand', 'experiment', 'inspect', 'reflect'];
const strategy = projects.find(project => project.id === 'strategy');

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
}];
