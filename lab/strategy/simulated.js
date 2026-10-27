export const simulation = { seed: 57021, drift: 0.07, volatility: 0.18, days: 1260, start: "2020-01-02", initial: 100 };

export function simulateGBM({ seed, drift, volatility, days, start, initial } = simulation) {
  let state = seed >>> 0, price = initial;
  const random = () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const date = new Date(start + "T00:00:00Z"), data = [];
  while (data.length < days) {
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) {
      if (data.length) {
        const normal = Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
        price *= Math.exp((drift - volatility ** 2 / 2) / 252 + volatility / Math.sqrt(252) * normal);
      }
      data.push([date.toISOString().slice(0, 10), price]);
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return data;
}
