import { json, escape as e, sourceText } from './ui.js';
import { pokerSelection, pokerChanges, selectHand } from './poker-store.js';

const card = value => `<span class="playing-card ${/[hd]$/.test(value) ? 'red' : ''}">${e(value.slice(0,-1))}${({h:'♥',d:'♦',c:'♣',s:'♠'})[value.at(-1)] || ''}</span>`;
export async function mount(root,{signal}) {
  const data=await json('/prototypes/data/poker-run.json',signal);
  root.innerHTML=`<p class="notice">Hero observations only. Each frame is before a logged hero decision—not a full-information hand history. Unknown streets and opponent cards are never filled in.</p><label>Featured hand<select data-hand></select></label><div class="replay-content"></div><p class="source">${e(sourceText(data.source))}</p>`;
  function render() {
    const number=pokerSelection.hand ?? data.featured[0], hand=data.hands.find(h=>h.number===number);
    const options=[...new Set([...data.featured,number])].sort((a,b)=>a-b);
    root.querySelector('[data-hand]').innerHTML=options.map(n=>`<option value="${n}">Hand ${n}${data.hands.find(h=>h.number===n)?.tags.length ? ' · '+e(data.hands.find(h=>h.number===n).tags.join(', ')) : ''}</option>`).join('');
    root.querySelector('[data-hand]').value=number;root.dataset.hand=number;
    const host=root.querySelector('.replay-content');
    if (!hand) {host.innerHTML='<p role="status">No hero decision observation was logged for this hand. No full-information replay is substituted.</p>';return;}
    const index=Math.min(pokerSelection.index,hand.decisions.length-1), decision=hand.decisions[index], obs=decision.observation;
    const streets=[...new Set(hand.decisions.map(d=>d.street))];
    host.innerHTML=`<div class="prototype-controls replay-streets" aria-label="Observed streets">${streets.map(street=>`<button data-street="${street}" ${street===decision.street ? 'aria-current="step"' : ''}>${street}</button>`).join('')}</div><p class="observation-label">Hand ${number} · ${decision.street} · observation ${index+1} / ${hand.decisions.length} · ${e(hand.tags.join(' · '))}</p><div class="poker-table"><p>Board · ${obs.board.length ? obs.board.map(card).join('') : 'not dealt in this observation'}</p><p>Hero · seat ${obs.my_seat} · ${obs.hero_cards.map(card).join('')}</p><strong>Pot ${obs.pot_total} · to call ${obs.to_call}</strong><p>Hero decision: ${e(decision.applied_action.kind)}${decision.applied_action.amount===null ? '' : ' '+decision.applied_action.amount}</p></div><div class="table-scroll"><table><caption>Stacks before this hero decision · chips</caption><thead><tr><th>Seat</th><th>Position</th><th>Stack</th><th>Bet</th><th>State</th></tr></thead><tbody>${obs.seats.map(s=>`<tr><th>${s.seat}${s.seat===obs.my_seat ? ' · hero' : ''}</th><td>${e(s.position)}</td><td>${s.stack}</td><td>${s.bet_this_street}</td><td>${s.all_in ? 'All-in' : s.folded ? 'Folded' : 'Active'}</td></tr>`).join('')}</tbody></table></div><details><summary>Action history before this decision (${obs.action_history.length})</summary><ol>${obs.action_history.map(a=>`<li>${e(a.street)} · seat ${a.seat ?? '?'} · ${e(a.kind)}${a.amount===null ? '' : ' '+a.amount}</li>`).join('')}</ol></details><div class="prototype-controls"><button data-previous ${index===0?'disabled':''}>← Previous observation</button><button data-next ${index===hand.decisions.length-1?'disabled':''}>Next observation →</button></div>`;
  }
  root.addEventListener('change',event=>{if(event.target.matches('[data-hand]'))selectHand(event.target.value);},{signal});
  root.addEventListener('click',event=>{
    const hand=data.hands.find(h=>h.number===Number(root.dataset.hand));if(!hand)return;
    const street=event.target.closest('[data-street]')?.dataset.street;
    if(street)selectHand(hand.number,hand.decisions.findIndex(d=>d.street===street));
    if(event.target.closest('[data-next]'))selectHand(hand.number,Math.min(hand.decisions.length-1,pokerSelection.index+1));
    if(event.target.closest('[data-previous]'))selectHand(hand.number,Math.max(0,pokerSelection.index-1));
  },{signal});
  pokerChanges.addEventListener('change',render,{signal});render();return()=>root.replaceChildren();
}
