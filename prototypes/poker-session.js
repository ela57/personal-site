import { json, path, escape as e, sourceText } from './ui.js';
import { selectHand } from './poker-store.js';

export async function mount(root,{signal}) {
  const data=await json('/prototypes/data/poker-session.json',signal), hands=data.hands;
  if(!hands.length){root.textContent='No session totals available.';return()=>root.replaceChildren();}
  root.innerHTML=`<p class="notice">Hero stack at each hand's end · all ${hands.length} hands. Public chip totals only; not every hand has a hero decision log. Triangles mark elimination seats; vertical lines mark blind changes.</p><div class="session-chart"></div><div class="prototype-controls"><label>Hand<input type="range" min="1" max="${hands.length}" value="1" data-hand aria-label="Session hand"></label><button data-open>Open hand in replay →</button></div><p data-readout aria-live="polite"></p><p class="source">${e(sourceText(data.source))}</p>`;
  const max=Math.max(...hands.map(h=>h.hero_end),hands[0].hero_start)*1.1,x=i=>65+i/Math.max(1,hands.length-1)*650,y=v=>300-v/max*260;
  const changes=hands.filter((h,i)=>i &&h.blinds[1]!==hands[i-1].blinds[1]);
  root.querySelector('.session-chart').innerHTML=`<svg viewBox="0 0 760 360" aria-label="Hero end-of-hand stack over 200 hands"><text x="12" y="20">Hero chips · ${Math.ceil(max)} top</text>${changes.map(h=>`<line class="level-line" x1="${x(h.number-1)}" x2="${x(h.number-1)}" y1="30" y2="305"><title>Hand ${h.number} · blinds ${h.blinds.join('/')}</title></line>`).join('')}<path class="series accent" d="${path(hands.map(h=>h.hero_end),x,y)}"/>${hands.map((h,i)=>`<circle data-hand="${h.number}" cx="${x(i)}" cy="${y(h.hero_end)}" r="3"><title>Hand ${h.number}: ${h.hero_end} chips</title></circle>${h.eliminations.length ? `<path class="elimination" d="M${x(i)} 312l-5 10h10Z"><title>Hand ${h.number}: eliminated seats ${h.eliminations.join(', ')}</title></path>` : ''}`).join('')}<text x="65" y="350">Hand 1</text><text x="630" y="350">Hand ${hands.length}</text></svg>`;
  function describe(){const hand=hands[Number(root.querySelector('input').value)-1];root.querySelector('[data-readout]').textContent=`Hand ${hand.number} · ${hand.hero_start} → ${hand.hero_end} chips · blinds ${hand.blinds.join('/')}${hand.eliminations.length ? ' · eliminated seats '+hand.eliminations.join(', ') : ''}`;root.dataset.hand=hand.number;}
  function open(){selectHand(root.dataset.hand);document.querySelector('#poker-replay')?.scrollIntoView({behavior:'instant',block:'start'});}
  root.querySelector('input').addEventListener('input',describe,{signal});root.querySelector('[data-open]').addEventListener('click',open,{signal});
  root.querySelector('.session-chart').addEventListener('click',event=>{const number=event.target.closest('[data-hand]')?.dataset.hand;if(number){root.querySelector('input').value=number;describe();open();}},{signal});
  describe();return()=>root.replaceChildren();
}
