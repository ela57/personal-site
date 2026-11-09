import { json, escape as e, sourceText } from './ui.js';
import { pokerSelection, pokerChanges, selectHand } from './poker-store.js';

export async function mount(root,{signal}) {
  const data=await json('/prototypes/data/poker-run.json',signal);
  const rows=data.hands.flatMap(hand=>hand.decisions.map((d,index)=>({...d,hand:hand.number,index})));
  root.innerHTML=`<p class="notice">Decision-time legal actions and bot diagnostics, not omniscient evaluations or a claim of playing strength.</p><div class="prototype-controls"><label>Street<select data-street><option value="">All</option>${[...new Set(rows.map(d=>d.street))].map(s=>`<option>${s}</option>`).join('')}</select></label><label>Applied action<select data-action><option value="">All</option>${[...new Set(rows.map(d=>d.applied_action.kind))].map(s=>`<option>${s}</option>`).join('')}</select></label></div><label>Decision<select data-decision></select></label><div class="decision-content"></div><p class="source">${e(sourceText(data.source))}</p>`;
  function render() {
    const filtered=rows.filter(d=>(!root.querySelector('[data-street]').value || d.street===root.querySelector('[data-street]').value)&&(!root.querySelector('[data-action]').value || d.applied_action.kind===root.querySelector('[data-action]').value));
    const select=root.querySelector('[data-decision]');select.innerHTML=filtered.map(d=>`<option value="${d.hand}:${d.index}">Hand ${d.hand} · ${e(d.street)} · ${e(d.applied_action.kind)} · observation ${d.index+1}</option>`).join('');
    const d=filtered.find(d=>d.hand===pokerSelection.hand &&d.index===pokerSelection.index)||filtered[0];
    root.querySelector('.decision-content').innerHTML=d ? `<p>${filtered.length} matching decisions · position <strong>${e(d.position)}</strong> · stack bucket ${e(d.stack_bucket)} · to call <strong>${d.observation.to_call}</strong></p><div class="decision-columns">${[['Legal actions',d.legal_actions],['Requested',d.requested_action],['Applied',d.applied_action],['Bot diagnostics',d.diagnostics]].map(([title,value])=>`<section><h3>${title}</h3><pre>${e(JSON.stringify(value,null,2))}</pre></section>`).join('')}</div>` : '<p role="status">No decisions match these filters.</p>';
    if(d){select.value=`${d.hand}:${d.index}`;root.dataset.hand=d.hand;root.dataset.street=d.street;}
  }
  root.addEventListener('change',event=>{if(event.target.matches('[data-decision]')){const[h,i]=event.target.value.split(':').map(Number);selectHand(h,i);}else render();},{signal});
  pokerChanges.addEventListener('change',render,{signal});render();return()=>root.replaceChildren();
}
