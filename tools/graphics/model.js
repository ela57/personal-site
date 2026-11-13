import { rollingCloseVol } from '../../prototypes/finance.js';

export const theme = {
  background: '#13201b', mist: '#ece7dc', ember: '#e3b677',
  lake: '#8faeb3', moss: '#9eae8e',
};

export function volatilityPairs(rows, window = 20) {
  if (rows.some(([date, price], i) => !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(price) || price <= 0 || (i && date <= rows[i - 1][0]))) {
    throw new RangeError('Expected dated, ascending, positive adjusted closes.');
  }
  const vol = rollingCloseVol(rows, window);
  return rows.flatMap(([date, price], i) => vol[i] === null || i === rows.length - 1 ? [] : [{
    date, nextDate: rows[i + 1][0], volatility: vol[i], nextReturn: rows[i + 1][1] / price - 1,
  }]);
}

export function publicStacks(session) {
  if (!Array.isArray(session.hands)) throw new TypeError('Expected public hand-boundary totals.');
  return session.hands.map((hand, i) => {
    const { number, hero_start: start, hero_end: end } = hand;
    if (!Number.isInteger(number) || number < 1 || (i && number <= session.hands[i - 1].number) || ![start, end].every(value => Number.isFinite(value) && value >= 0)) {
      throw new RangeError('Invalid public stack record.');
    }
    return { hand: number, start, end, eliminated: (hand.eliminations || []).length };
  });
}

export function leadershipFacts(projects) {
  const manager = projects.find(project => project.id === 'portfolio-manager');
  const buddies = projects.find(project => project.id === 'chess-buddies');
  if (!manager || !buddies) throw new Error('Missing sourced leadership projects.');
  const extract = (text, pattern) => {
    const match = text.match(pattern);
    if (!match) throw new Error(`Source copy no longer matches ${pattern}`);
    return match[1];
  };
  return {
    manager: {
      dates: extract(manager.body[0], /(Aug \d{4}–present)/),
      strategies: extract(manager.body[3], /(two independent strategies)/i),
      functions: ['Capital allocation', 'Rebalancing', 'Risk constraints'].map(label => {
        if (!manager.summary.toLowerCase().includes(label.toLowerCase())) throw new Error(`Missing controller fact: ${label}`);
        return label;
      }),
    },
    buddies: {
      dates: extract(buddies.summary, /(Aug \d{4}–May \d{4})/),
      children: extract(buddies.body[0], /more than (\d+) children/) + '+',
      team: extract(buddies.body[0], /(six)-person volunteer team/).toUpperCase(),
      events: extract(buddies.body[0], /more than (\d+) events each school year/) + '+',
      schools: extract(buddies.body[0], /at (two) schools/).toUpperCase(),
    },
  };
}
