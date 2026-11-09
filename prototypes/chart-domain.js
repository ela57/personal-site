export function niceDomain(values, count = 5) {
  if (!values.length) return { min: 0, max: 1, ticks: [0, .25, .5, .75, 1] };
  if (values.some(v => !Number.isFinite(v))) throw new RangeError('Chart values must be finite.');
  const low = Math.min(...values), high = Math.max(...values);
  const span = high - low || Math.max(Math.abs(low) * .2, .01);
  const paddedLow = low > 0 && low <= span * .25 ? 0 : low - span * .1;
  const paddedHigh = high < 0 && -high <= span * .25 ? 0 : high + span * .1;
  const rough = (paddedHigh - paddedLow) / count, power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].find(n => n * power >= rough) * power;
  const min = Math.floor(paddedLow / step) * step, max = Math.ceil(paddedHigh / step) * step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => Number((min + i * step).toPrecision(12)));
  return { min, max, ticks };
}
