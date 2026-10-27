export function sma(values, window) {
  if (!Number.isInteger(window) || window < 1) throw new RangeError("Window must be a positive integer.");
  let sum = 0;
  return values.map((value, i) => {
    sum += value;
    if (i >= window) sum -= values[i - window];
    return i >= window - 1 ? sum / window : null;
  });
}

export function sliceData(data, start, end) {
  if (start && end && start > end) throw new RangeError("Start must be on or before end.");
  return data.filter(([date]) => (!start || date >= start) && (!end || date <= end));
}

export function metrics(returns) {
  if (!returns.length) return { cumulative: 0, volatility: 0, sharpe: 0, maxDrawdown: 0 };
  let equity = 1, peak = 1, maxDrawdown = 0;
  for (const value of returns) {
    equity *= 1 + value; peak = Math.max(peak, equity);
    maxDrawdown = Math.min(maxDrawdown, equity / peak - 1);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.length > 1 ? returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1) : 0;
  const volatility = Math.sqrt(variance * 252);
  return { cumulative: equity - 1, volatility, sharpe: volatility ? mean * 252 / volatility : 0, maxDrawdown };
}

export function backtest(data, { short = 20, long = 100, costBps = 5, start, end } = {}) {
  if (!Number.isInteger(short) || !Number.isInteger(long) || short < 1 || short >= long) throw new RangeError("Use integer windows with 1 ≤ short < long.");
  if (!Number.isFinite(costBps) || costBps < 0 || costBps >= 10000) throw new RangeError("Cost must be between 0 and 10,000 bps (exclusive).");
  const rows = sliceData(data, start, end);
  if (rows.some(([date, close], i) => !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(close) || close <= 0 || (i && date <= rows[i - 1][0]))) throw new RangeError("Prices must be positive, dated and strictly ascending.");
  const closes = rows.map(row => row[1]), fast = sma(closes, short), slow = sma(closes, long);
  const signals = closes.map((_, i) => slow[i] === null ? null : Number(fast[i] > slow[i]));
  const positions = signals.map((_, i) => i ? (signals[i - 1] ?? 0) : 0);
  const returns = [], holdReturns = [], equity = [], holdEquity = [], trades = [], markers = [];
  const cost = costBps / 10000;
  let value = 1, hold = 1, entry = null;
  rows.forEach(([date, price], i) => {
    const previous = i ? positions[i - 1] : 0;
    const marketReturn = i ? price / closes[i - 1] - 1 : 0;
    const changed = positions[i] !== previous;
    const daily = (1 + previous * marketReturn) * (changed ? 1 - cost : 1) - 1;
    const holdDaily = i ? marketReturn : -cost;
    returns.push(daily); holdReturns.push(holdDaily);
    value *= 1 + daily; hold *= 1 + holdDaily;
    equity.push({ time: date, value }); holdEquity.push({ time: date, value: hold });
    if (changed) {
      markers.push({ time: date, side: positions[i] ? "buy" : "sell" });
      if (positions[i]) entry = { entryDate: date, entryPrice: price };
      else {
        trades.push({ ...entry, exitDate: date, exitPrice: price, netReturn: price / entry.entryPrice * (1 - cost) ** 2 - 1, holdingDays: (Date.parse(date) - Date.parse(entry.entryDate)) / 86400000, open: false });
        entry = null;
      }
    }
  });
  if (entry) {
    const [date, price] = rows.at(-1);
    trades.push({ ...entry, exitDate: null, exitPrice: null, netReturn: price / entry.entryPrice * (1 - cost) - 1, holdingDays: (Date.parse(date) - Date.parse(entry.entryDate)) / 86400000, open: true });
  }
  return { rows, fast, slow, signals, positions, returns, holdReturns, equity, holdEquity, trades, markers, strategy: metrics(returns), buyHold: metrics(holdReturns) };
}
