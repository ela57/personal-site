import { backtest } from '../lab/strategy/engine.js';
import { annualizedReturn } from './finance.js';

self.onmessage = async ({data}) => {
  try {
    const response = await fetch(new URL('../lab/strategy/data/spy.json',import.meta.url));
    if (!response.ok) throw new Error('Prices unavailable');
    const prices = (await response.json()).data;
    const points = [];
    for (const short of [5,10,20,30,40,60]) for (const long of [50,75,100,150,200,250]) {
      if (short >= long) continue;
      const result = backtest(prices,{short,long,costBps:data.cost});
      points.push({id:`${short}/${long}`,short,long,annual:annualizedReturn(result.strategy.cumulative,prices.length),volatility:result.strategy.volatility,drawdown:result.strategy.maxDrawdown,fills:result.markers.length});
      if (short === 20 && long === 100) points.push({id:'hold',annual:annualizedReturn(result.buyHold.cumulative,prices.length),volatility:result.buyHold.volatility,drawdown:result.buyHold.maxDrawdown,fills:1});
    }
    postMessage({points,sessions:prices.length,start:prices[0][0],end:prices.at(-1)[0]});
  } catch { postMessage({error:'Bundled SPY prices or calculation could not load.'}); }
};
