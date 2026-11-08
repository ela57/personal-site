export function annualizedReturn(cumulative, sessions) {
  return sessions > 0 && cumulative >= -1 ? (1 + cumulative) ** (252 / sessions) - 1 : 0;
}

export function rollingCloseVol(rows, window) {
  if (!Number.isInteger(window) || window < 2) throw new RangeError('Use at least two returns.');
  let sum = 0, squares = 0;
  const returns = rows.map((row,i) => i ? Math.log(row[1] / rows[i-1][1]) : null);
  return returns.map((value,i) => {
    if (!i) return null;
    sum += value; squares += value * value;
    if (i > window) { sum -= returns[i-window]; squares -= returns[i-window] ** 2; }
    return i >= window ? Math.sqrt(Math.max(0,(squares - sum * sum / window) / (window - 1)) * 252) : null;
  });
}
