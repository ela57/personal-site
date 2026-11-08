export function timelineData(rows, stride = 40) {
  if (!Array.isArray(rows) || rows.length < 2) throw new RangeError('At least two prices are required.');
  if (!Number.isInteger(stride) || stride < 1) throw new RangeError('Invalid sampling stride.');
  if (rows.some(r => !Array.isArray(r) || !/^\d{4}-\d{2}-\d{2}$/.test(r[0]) || !Number.isFinite(r[1]) || r[1] <= 0)) throw new RangeError('Invalid dated price.');
  const max = Math.max(...rows.map(r => r[1]));
  const point = index => ({ index, date: rows[index][0], x: -90 + 90 * index / (rows.length - 1), y: 1 + rows[index][1] / max * 12 });
  const samples = rows.flatMap((_, i) => i % stride === 0 || i === rows.length - 1 ? [point(i)] : []);
  const lastYear = rows.at(-1)[0].slice(0, 4);
  const years = rows.flatMap((row, i) => {
    const year = row[0].slice(0, 4), first = !i || year !== rows[i - 1][0].slice(0, 4);
    return first && (!i || Number(year) % 5 === 0 || year === lastYear) ? [{ ...point(i), year }] : [];
  });
  return { samples, years, atProgress(input) {
    const p = Math.max(0, Math.min(1, Number.isFinite(input) ? input : 0)), index = p * (rows.length - 1);
    const right = Math.max(1, samples.findIndex(s => s.index >= index)), a = samples[right - 1], b = samples[right], t = (index - a.index) / (b.index - a.index);
    const row = rows[Math.round(index)];
    return { x: -90 + p * 90, y: a.y + (b.y - a.y) * t, date: row[0], price: row[1] };
  } };
}
