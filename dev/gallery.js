import { prototypes, scoreKeys } from '../content/prototypes.js';
import { escape as e } from '../prototypes/ui.js';

const gallery=document.querySelector('#gallery'), table=document.querySelector('#scores');
const labels={connection:'Real-work connection',visual:'Visual quality',clarity:'Clarity',distinctiveness:'Distinctiveness',performanceCost:'Performance cost',maintenanceEffort:'Maintenance effort'};
let sort='connection', direction=-1;
const mounts=new Map();
const matches=p=>(!document.querySelector('#area').value || p.area===document.querySelector('#area').value)&&(!document.querySelector('#label').value || p.label===document.querySelector('#label').value);
for(const field of ['area','label']) for(const value of new Set(prototypes.map(p=>p[field])))document.querySelector(`#${field}`).insertAdjacentHTML('beforeend',`<option>${e(value)}</option>`);
gallery.innerHTML=prototypes.map(p=>`<section class="prototype-card" id="${p.id}" aria-labelledby="title-${p.id}"><div class="card-heading"><p class="eyebrow">${e(p.area)} · ${p.recommendation}</p><h2 id="title-${p.id}">${e(p.title)}</h2><span class="classification">${e(p.label)}</span><p>${e(p.shows)}</p><details class="sources"><summary>Data / code sources</summary><ul>${p.sources.map(s=>`<li><code>${e(s.path)}</code>${s.repo ? ` · ${e(s.repo)} · seed ${s.seed} · commit <code>${e(s.commit)}</code>` : ''}</li>`).join('')}</ul></details></div><div class="prototype-live" data-prototype="${p.id}" data-state="idle"><p>Live preview mounts when this area enters the viewport.</p></div></section>`).join('');
function stop(host){
  const state=mounts.get(host);if(!state)return;
  host.style.minHeight=`${Math.max(540,host.getBoundingClientRect().height)}px`;
  state.version++;state.controller?.abort();state.cleanup?.();state.cleanup=null;state.active=false;
  host.dataset.state='idle';host.innerHTML='<p>Preview paused outside the viewport.</p>';
}
async function start(host){
  let state=mounts.get(host);if(!state){state={version:0,active:false};mounts.set(host,state);}
  if(state.active)return;
  state.active=true;const token=++state.version;state.controller=new AbortController();
  host.dataset.state='loading';host.innerHTML='<p role="status">Loading prototype…</p>';
  const p=prototypes.find(p=>p.id===host.dataset.prototype);
  try{
    const module=await import(p.mount.module);if(token!==state.version)return;
    const cleanup=await module[p.mount.export](host,{signal:state.controller.signal});
    if(token!==state.version){cleanup?.();return;}
    state.cleanup=cleanup;host.dataset.state='ready';host.dataset.mounts=Number(host.dataset.mounts||0)+1;
  }catch(error){if(token===state.version && !state.controller.signal.aborted){host.dataset.state='error';host.innerHTML='<p role="status">This prototype could not load. Scroll away and back to retry.</p>';}}
}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const host=entry.target,p=prototypes.find(p=>p.id===host.dataset.prototype);if(entry.isIntersecting && matches(p))start(host);else stop(host);}},{threshold:0});
document.querySelectorAll('[data-prototype]').forEach(host=>observer.observe(host));
function renderTable(){
  const rows=prototypes.filter(matches).sort((a,b)=>direction*(a.scores[sort].value-b.scores[sort].value)||a.title.localeCompare(b.title));
  table.querySelector('thead').innerHTML=`<tr><th scope="col">Prototype</th>${scoreKeys.map(key=>`<th scope="col" ${sort===key?`aria-sort="${direction===1?'ascending':'descending'}"`:''}><button data-sort="${key}">${labels[key]} ${sort===key?(direction===1?'↑':'↓'):''}</button></th>`).join('')}<th scope="col">Recommendation</th></tr>`;
  table.querySelector('tbody').innerHTML=rows.map(p=>`<tr data-row="${p.id}"><th scope="row"><a href="#${p.id}">${e(p.title)}</a></th>${scoreKeys.map(key=>`<td><details><summary>${p.scores[key].value} / 5</summary><p>${e(p.scores[key].rationale)}</p></details></td>`).join('')}<td>${p.recommendation}</td></tr>`).join('');
  document.querySelector('#count').textContent=`${rows.length} / ${prototypes.length} prototypes`;
}
for(const field of ['area','label'])document.querySelector(`#${field}`).addEventListener('change',()=>{for(const p of prototypes){const card=document.getElementById(p.id);card.hidden=!matches(p);if(card.hidden)stop(card.querySelector('[data-prototype]'));}renderTable();});
table.addEventListener('click',event=>{const key=event.target.closest('[data-sort]')?.dataset.sort;if(key){direction=sort===key?-direction:-1;sort=key;renderTable();table.querySelector(`[data-sort="${key}"]`).focus();}});
addEventListener('pagehide',()=>{observer.disconnect();for(const host of mounts.keys())stop(host);});
renderTable();
