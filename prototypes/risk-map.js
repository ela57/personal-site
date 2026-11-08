import { escape, pct } from './ui.js';

export function mount(root,{signal}) {
  root.innerHTML = '<p class="notice">In-sample · SPY only · fixed 5 bps per position change. These are parameter comparisons, not out-of-sample results.</p><p role="status">Computing SMA pairs in a worker…</p><label>SMA pair / reference<select data-pair-select disabled></select></label><div class="risk-plot"></div><p class="point-details" aria-live="polite"></p>';
  const worker = new Worker(new URL('./risk-worker.js',import.meta.url),{type:'module'});
  let points = [], selected = '20/100';
  const details = point => `${point.id === 'hold' ? 'Buy & hold' : `SMA ${point.id}`} · annualized return ${pct(point.annual)} · volatility ${pct(point.volatility)} · max drawdown ${pct(point.drawdown)} · ${point.fills} fills`;
  function choose(id) {
    selected = id; root.dataset.selected = id;
    root.querySelector('[data-pair-select]').value=id;
    for (const circle of root.querySelectorAll('[data-pair]')) { circle.classList.toggle('selected',circle.dataset.pair === id); circle.setAttribute('aria-pressed',String(circle.dataset.pair === id)); }
    root.querySelector('.point-details').textContent = details(points.find(point => point.id === id));
  }
  worker.onmessage = ({data}) => {
    if (signal.aborted) return;
    if (data.error) { root.querySelector('[role=status]').textContent = data.error; return; }
    points = data.points;
    root.querySelector('[data-pair-select]').innerHTML=points.map(p=>`<option value="${p.id}">${p.id==='hold'?'Buy & hold':`SMA ${p.id}`}</option>`).join('');
    root.querySelector('[data-pair-select]').disabled=false;
    root.querySelector('[role=status]').textContent = `${points.length-1} SMA pairs · ${data.sessions.toLocaleString()} sessions · ${data.start}–${data.end}. Tab to a point; Enter selects. Gold ring: selected; square: buy & hold.`;
    const maxX = Math.max(...points.map(p=>p.volatility))*1.12;
    const minY = Math.min(0,...points.map(p=>p.annual))*1.1, maxY = Math.max(.01,...points.map(p=>p.annual))*1.2;
    const x = v => 75+v/maxX*620, y = v => 315-(v-minY)/(maxY-minY)*260;
    root.querySelector('.risk-plot').innerHTML = `<svg viewBox="0 0 760 380" aria-label="In-sample annualized return versus annualized volatility"><text x="12" y="20">Annualized return ↑</text>${[0,.25,.5,.75,1].map(f=>`<path class="chart-grid" d="M75 ${y(minY+(maxY-minY)*f)}H695"/><text x="5" y="${y(minY+(maxY-minY)*f)+4}">${pct(minY+(maxY-minY)*f)}</text><text x="${x(maxX*f)-20}" y="340">${pct(maxX*f)}</text>`).join('')}<text x="260" y="375">Annualized volatility →</text>${points.map(p=>`<${p.id === 'hold' ? 'rect' : 'circle'} ${p.id === 'hold' ? `x="${x(p.volatility)-5}" y="${y(p.annual)-5}" width="10" height="10"` : `cx="${x(p.volatility)}" cy="${y(p.annual)}" r="5"`} data-pair="${p.id}" tabindex="0" role="button" aria-label="${escape(details(p))}"><title>${escape(details(p))}</title></${p.id === 'hold' ? 'rect' : 'circle'}>`).join('')}</svg>`;
    choose(selected); root.dataset.ready = 'true';
  };
  worker.onerror = event => { event.preventDefault(); root.querySelector('[role=status]').textContent = 'Worker unavailable. This prototype needs module-worker support.'; };
  root.addEventListener('click',event=>{const id=event.target.closest('[data-pair]')?.dataset.pair;if(id)choose(id);},{signal});
  root.querySelector('[data-pair-select]').addEventListener('change',event=>choose(event.target.value),{signal});
  root.addEventListener('focusin',event=>{const id=event.target.closest('[data-pair]')?.dataset.pair;if(id)choose(id);},{signal});
  root.addEventListener('pointerover',event=>{const id=event.target.closest('[data-pair]')?.dataset.pair;if(id)root.querySelector('.point-details').textContent=details(points.find(p=>p.id===id));},{signal});
  root.addEventListener('keydown',event=>{const id=event.target.closest('[data-pair]')?.dataset.pair;if(id && ['Enter',' '].includes(event.key)){event.preventDefault();choose(id);}},{signal});
  worker.postMessage({cost:5});
  return () => { worker.terminate(); root.replaceChildren(); delete root.dataset.ready; };
}
