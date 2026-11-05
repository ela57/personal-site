import { backtest } from "../strategy/engine.js";

export function createBoardModel(rows) {
  const result = backtest(rows, { short: 20, long: 100 });
  const indices = new Map(rows.map(([date], index) => [date, index]));
  const flags = result.markers.map(marker => ({ ...marker, index: indices.get(marker.time), signalIndex: indices.get(marker.time) - 1 }));
  return { rows: result.rows, fast: result.fast, slow: result.slow, flags };
}

export function readoutAt(model, index) {
  if (!model.rows.length) return null;
  const i = Math.max(0, Math.min(model.rows.length - 1, Math.round(index)));
  const [date, price] = model.rows[i], previous = model.rows[i - 1]?.[1];
  return { index: i, date, price, changePercent: previous ? (price / previous - 1) * 100 : null, fast: model.fast[i], slow: model.slow[i] };
}

export function indexAtFraction(length, fraction) {
  return Math.round(Math.max(0, Math.min(1, fraction)) * Math.max(0, length - 1));
}
