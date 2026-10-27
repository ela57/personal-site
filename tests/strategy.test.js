import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sma, backtest, metrics, sliceData } from "../lab/strategy/engine.js";
import { simulateGBM, simulation } from "../lab/strategy/simulated.js";

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);
const fixture = closes => closes.map((close, i) => [`2024-01-${String(i + 1).padStart(2, "0")}`, close]);

test("SMA values, warm-up and window validation", () => {
  assert.deepEqual(sma([1, 2, 3, 4], 3), [null, null, 2, 3]);
  assert.deepEqual(sma([], 3), []);
  assert.deepEqual(sma([1, 2], 3), [null, null]);
  assert.throws(() => sma([1], 0), RangeError);
});
test("signals use only observed closes; positions execute exactly one close later", () => {
  const data = fixture([10, 12, 14, 16, 8, 6, 5]);
  const a = backtest(data, { short: 1, long: 3, costBps: 0 });
  assert.deepEqual(a.signals, [null, null, 1, 1, 0, 0, 0]);
  assert.deepEqual(a.positions, [0, 0, 0, 1, 1, 0, 0]);
  assert.deepEqual(a.markers, [{ time: "2024-01-04", side: "buy" }, { time: "2024-01-06", side: "sell" }]);
  assert.deepEqual(a.returns.slice(0, 4), [0, 0, 0, 0]);
  const b = backtest(fixture([10, 12, 14, 16, 8, 600, 500]), { short: 1, long: 3 });
  assert.deepEqual(a.signals.slice(0, 5), b.signals.slice(0, 5));
  assert.deepEqual(a.positions.slice(0, 6), b.positions.slice(0, 6));
});
test("entry/exit costs on traded notional, buy-and-hold entry cost, closed/open trades", () => {
  const a = backtest(fixture([10, 12, 14, 16, 8, 6, 5]), { short: 1, long: 3, costBps: 100 });
  near(a.returns[3], -.01);
  near(a.returns[4], -.5);
  near(a.returns[5], .75 * .99 - 1);
  near(a.strategy.cumulative, 6 / 16 * .99 ** 2 - 1);
  near(a.buyHold.cumulative, 5 / 10 * .99 - 1);
  near(a.holdReturns[0], -.01);
  near(a.trades[0].netReturn, 6 / 16 * .99 ** 2 - 1);
  assert.equal(a.trades[0].holdingDays, 2);
  assert.equal(a.trades[0].open, false);
  const open = backtest(fixture([10, 12, 14, 16, 18]), { short: 1, long: 3, costBps: 100 }).trades[0];
  assert.equal(open.open, true); assert.equal(open.exitDate, null);
  near(open.netReturn, 18 / 16 * .99 - 1);
});
test("metrics: sample annualized volatility, rf=0 Sharpe and initial-equity drawdown", () => {
  const a = metrics([.1, -.1, 0]);
  near(a.cumulative, -.01); near(a.volatility, .1 * Math.sqrt(252)); near(a.sharpe, 0); near(a.maxDrawdown, -.1);
  const b = metrics([.1, 0]);
  near(b.sharpe, .05 / Math.sqrt(.005) * Math.sqrt(252));
  near(metrics([-.01]).maxDrawdown, -.01);
  assert.deepEqual(metrics([]), { cumulative: 0, volatility: 0, sharpe: 0, maxDrawdown: 0 });
  assert.equal(metrics([0, 0]).sharpe, 0);
});
test("inclusive date slicing occurs before warm-up; empty ranges and invalid inputs", () => {
  const data = fixture([10, 12, 14, 16, 8]);
  assert.deepEqual(sliceData(data, "2024-01-02", "2024-01-04"), data.slice(1, 4));
  const a = backtest(data, { short: 1, long: 3, start: "2024-01-03", end: "2024-01-05" });
  assert.deepEqual(a.positions, [0, 0, 0]);
  assert.deepEqual(a.slow, [null, null, 38 / 3]);
  assert.deepEqual(backtest([]).trades, []);
  assert.equal(backtest(data, { start: "2025-01-01" }).equity.length, 0);
  for (const options of [{ short: 3, long: 3 }, { short: 4, long: 3 }, { short: 1.5 }, { costBps: -1 }, { start: "2024-02-01", end: "2024-01-01" }]) assert.throws(() => backtest(data, options), RangeError);
  assert.throws(() => backtest(fixture([10, -2])), RangeError);
});
test("Simulated GBM is deterministic and seed-dependent", () => {
  const a = simulateGBM();
  assert.deepEqual(a, simulateGBM());
  assert.notDeepEqual(a, simulateGBM({ ...simulation, seed: 42 }));
  assert.equal(a.length, 1260); assert.deepEqual(a[0], ["2020-01-02", 100]);
  assert.ok(a.every(([date, price]) => Number.isFinite(price) && price > 0 && ![0, 6].includes(new Date(date).getUTCDay())));
});
test("bundled SPY adjusted closes carry source, retrieval and dividend adjustment evidence", () => {
  const text = readFileSync(new URL("../lab/strategy/data/spy.json", import.meta.url), "utf8");
  const spy = JSON.parse(text);
  assert.ok(Buffer.byteLength(text) < 150000);
  assert.equal(spy.autoAdjust, false); assert.equal(spy.series, "Adj Close");
  assert.match(spy.description, /Yahoo Finance adjusted close \(splits \+ dividends\), retrieved \d{4}-\d{2}-\d{2} via yfinance/);
  assert.equal(spy.data[0][0], "2005-01-03");
  assert.ok(spy.data.length > 5000);
  assert.ok(spy.adjustmentEvidence[1].dividend > 0);
  assert.ok(spy.adjustmentEvidence[0].closeToAdjustedRatio > spy.adjustmentEvidence[1].closeToAdjustedRatio);
  assert.doesNotThrow(() => backtest(spy.data));
});
