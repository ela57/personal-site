import { route, getStations } from '../journey/route.js';
import { stationProjects } from '../content/destinations.js';
import { escape as e } from './ui.js';
export function mount(root,{signal}){
  const stations=getStations(), projects=stations.flatMap(s=>stationProjects(s.id));
  root.innerHTML='<p class="notice">Working project integration · site-wide route and audited project metadata. The map is schematic, not a geographic survey. Placeholder entries remain Content needed.</p><div class="prototype-controls"><label>Classification<select data-label><option value="">All classifications</option></select></label><label>Area / station<select data-area><option value="">All areas</option></select></label></div><div data-map></div><div data-projects></div>';
  root.querySelector('[data-label]').insertAdjacentHTML('beforeend',[...new Set(projects.map(p=>p.label))].map(label=>`<option>${e(label)}</option>`).join(''));
  root.querySelector('[data-area]').insertAdjacentHTML('beforeend',stations.map(s=>`<option value="${s.id}">${s.name}</option>`).join(''));
  const x=p=>110+(p.x+30)*7,y=p=>45+(24-p.z)*2;
  const points=route.getPoints(160), path=points.map((p,i)=>`${i?'L':'M'}${x(p)},${y(p)}`).join('');
  function draw(){const label=root.querySelector('[data-label]').value,area=root.querySelector('[data-area]').value;let lists='';
    root.querySelector('[data-map]').innerHTML=`<svg viewBox="0 0 760 510" aria-label="Journey route, station positions and project counts"><path d="${path}" fill="none" stroke="#73836d" stroke-width="4"/>${stations.map(s=>{const matches=stationProjects(s.id).filter(p=>(!label||p.label===label)&&(!area||s.id===area));if(matches.length)lists+=`<h3>${s.name}</h3><ul>${matches.map(p=>`<li>${e(p.title)} · ${e(p.label)}${p.needsContent?' · Content needed':''}</li>`).join('')}</ul>`;return `<a href="/#/at/${s.id}" class="map-station ${matches.length?'matching':'muted'}" data-station="${s.id}"><circle cx="${x({x:s.position[0]})}" cy="${y({z:s.position[2]})}" r="9"/><text x="${x({x:s.position[0]})+18}" y="${y({z:s.position[2]})+5}">${s.name} · ${matches.length}/${stationProjects(s.id).length}</text></a>`;}).join('')}</svg>`;
    root.querySelector('[data-projects]').innerHTML=lists||'<p>No matching projects.</p>';
  }root.querySelector('.prototype-controls').addEventListener('change',draw,{signal});draw();return()=>root.replaceChildren();
}
