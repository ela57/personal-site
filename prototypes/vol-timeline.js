import { json, path, pct } from './ui.js';
import { rollingCloseVol } from './finance.js';

export async function mount(root,{signal}) {
  const {data:rows} = await json('/lab/strategy/data/spy.json',signal);
  if (!rows.length) {root.textContent='No bundled prices available.';return()=>root.replaceChildren();}
  root.innerHTML = `<p class="notice">Close-to-close log returns from bundled SPY adjusted closes; sample standard deviation × √252. Not the notebook's Garman–Klass estimator. No event annotations are inferred from prices.</p><div class="prototype-controls"><label>Rolling window · returns<select data-window><option>20</option><option>60</option><option>120</option></select></label><label>Timeline session<input type="range" data-scrub min="0" max="${rows.length-1}" value="${rows.length-1}" aria-label="Timeline session"></label></div><div class="timeline-chart"></div><p data-readout aria-live="polite"></p>`;
  let values = [], index = rows.length-1;
  const x = i => 65+i/(rows.length-1)*650;
  function scrub() {
    root.querySelector('[data-scrub]').value=index;
    root.querySelector('.scrub-line').setAttribute('x1',x(index));root.querySelector('.scrub-line').setAttribute('x2',x(index));
    root.querySelector('[data-readout]').textContent=`${rows[index][0]} · adjusted close ${rows[index][1].toFixed(2)} · realized vol ${values[index] === null ? 'warming up' : pct(values[index])}`;
    root.dataset.index=index;
  }
  function render() {
    values = rollingCloseVol(rows,Number(root.querySelector('[data-window]').value));
    const maxVol = Math.max(.01,...values.filter(v=>v!==null)), maxPrice = Math.max(...rows.map(r=>r[1]));
    root.querySelector('.timeline-chart').innerHTML=`<svg viewBox="0 0 760 380" tabindex="0" role="img" aria-label="Rolling close-to-close volatility above adjusted price; scrub with the session slider"><text x="12" y="20">Realized volatility · ${pct(maxVol)} top</text><path class="series accent" d="${path(values,x,v=>155-v/maxVol*120)}"/><path class="chart-grid" d="M65 175H715"/><text x="12" y="202">Adjusted price · ${maxPrice.toFixed(0)} top</text><path class="series" d="${path(rows.map(r=>r[1]),x,v=>335-v/maxPrice*120)}"/><text x="65" y="365">${rows[0][0]}</text><text x="620" y="365">${rows.at(-1)[0]}</text><line class="scrub-line" x1="0" x2="0" y1="25" y2="340"/></svg>`;
    scrub();
  }
  root.querySelector('[data-window]').addEventListener('change',render,{signal});
  root.querySelector('[data-scrub]').addEventListener('input',event=>{index=Number(event.target.value);scrub();},{signal});
  root.querySelector('.timeline-chart').addEventListener('pointermove',event=>{const box=event.currentTarget.getBoundingClientRect();index=Math.max(0,Math.min(rows.length-1,Math.round(((event.clientX-box.left)/box.width*760-65)/650*(rows.length-1))));scrub();},{signal});
  render();return()=>root.replaceChildren();
}
