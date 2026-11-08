import * as THREE from '../vendor/three.module.min.js';
import {createWorld} from '../journey/world.js';
import {techniques,motionPose} from './motion-poses.js';
import {projects} from '../content/projects.js';
import {json,escape as e} from '../prototypes/ui.js';
import {route} from '../journey/route.js';
import {timelineData} from './timeline-ribbon.js';

const $=s=>document.querySelector(s),select=$('#technique'),scrub=$('#scrub'),surface=$('.motion-surface'),canvas=$('#motion-canvas');
select.innerHTML=techniques.map(t=>`<option value="${t.id}">${t.title}</option>`).join('');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),camera=new THREE.PerspectiveCamera(64,1,.15,1800);camera.rotation.order='YXZ';
let renderer,world,raf=0,last=0,playing=false,alive=true,initialized=false;
const target=new THREE.Vector3(),diagnostics={ready:false,settled:false,progress:0,pose:[],roll:0,assetFailures:[]};
const layers=new THREE.Group(),portal=new THREE.Group(),labels=['Base','Logic','Power','Cover'];
let ribbon=null,timeline=null,marker=null,markerStem=null,occluder=null,rows=[],dataError='';
const portalTrees=[];
function projectedLabel(text,point,kind='') {
  const v=point.clone().project(camera);
  return Math.abs(v.x)>1||Math.abs(v.y)>1||Math.abs(v.z)>1?'':`<span class="${kind}" style="left:${(v.x+1)*50}%;top:${(1-v.y)*50}%">${e(text)}</span>`;
}
const project=projects.find(p=>p.id==='renderer');
$('.portal-panel').innerHTML=`<p class="eyebrow">Project detail / existing site content</p><h2>${e(project.title)}</h2><p>${e(project.summary)}</p><p>Canvas illustration, not the original Python runtime.</p><a href="/projects/#project/renderer">Open the full project →</a>`;
const wake=()=>{if(alive&&!raf)raf=requestAnimationFrame(frame);};
function frame(now){raf=0;if(!alive||!world||document.hidden)return;const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
  if(playing&&!reduced.matches){scrub.value=Math.min(1,Number(scrub.value)+dt*.15*Number($('#speed').value));if(Number(scrub.value)>=1){playing=false;$('#play').textContent='Play';}}
  const p=Number(scrub.value),id=select.value,pose=motionPose(id,p),destination=new THREE.Vector3(...pose.position),look=new THREE.Vector3(...pose.target);
  const alpha=reduced.matches||!initialized?1:1-Math.exp(-Number($('#damping').value)*dt);camera.position.lerp(destination,alpha);target.lerp(look,alpha);initialized=true;camera.lookAt(target);camera.rotation.z=0;
  layers.visible=id==='exploded';layers.children.forEach((layer,i)=>{layer.position.y=.5+i*.45+p*i*2.2;});portal.visible=id==='portal';if(ribbon)ribbon.visible=id==='timeline';if(occluder)occluder.visible=id==='curved';
  for(const material of portalTrees){const transparent=id!=='portal';if(material.transparent!==transparent){material.transparent=transparent;material.depthWrite=!transparent;material.needsUpdate=true;}}
  camera.updateMatrixWorld();
  $('#layer-labels').innerHTML=layers.visible?layers.children.map((layer,i)=>{const v=layer.getWorldPosition(new THREE.Vector3()).project(camera);return`<span style="left:${Math.max(0,Math.min(80,(v.x+1)*50))}%;top:${Math.max(0,Math.min(90,(1-v.y)*50))}%">${labels[i]}</span>`;}).join(''):'';
  if(id==='timeline'&&timeline){const current=timeline.atProgress(p);marker.position.set(current.x,current.y+.3,.1);markerStem.position.set(current.x,.3,.1);markerStem.scale.y=current.y;$('#layer-labels').innerHTML=timeline.years.map(t=>projectedLabel(t.year,new THREE.Vector3(t.x,.3,-50),'timeline-year')).join('')+projectedLabel(current.date,new THREE.Vector3(current.x,current.y+1,-49.9),'timeline-current');diagnostics.timeline={...current,samples:timeline.samples.length,years:timeline.years.map(t=>t.year),thickness:.2,depth:.18};}
  const fade=id==='portal'?Math.max(0,Math.min(1,(p-.75)/.25)):0;$('.portal-panel').hidden=!fade;$('.portal-panel').style.opacity=fade;canvas.style.opacity=1-fade*.85;
  const row=rows[Math.round(p*(rows.length-1))];$('#data-note').textContent=id==='timeline'?(row?`${row[0]} · adjusted close ${row[1].toFixed(2)} · sampled ribbon of bundled SPY, not a forecast.`:dataError):'';
  world.update(p,true);renderer.render(world.scene,camera);
  diagnostics.progress=p;diagnostics.pose=[...camera.position.toArray(),camera.rotation.x,camera.rotation.y];diagnostics.roll=camera.rotation.z;diagnostics.technique=id;diagnostics.settled=camera.position.distanceTo(destination)<.003&&target.distanceTo(look)<.003;
  $('#pose').textContent=`${id} · ${Math.round(p*100)}% · camera [${camera.position.toArray().map(n=>n.toFixed(2)).join(', ')}] · roll 0 · ${reduced.matches?'reduced motion: instant cuts':'damped camera'}`;
  if(playing||!diagnostics.settled)wake();else last=0;
}
function update(){playing=false;$('#play').textContent='Play';$('#technique-note').textContent=techniques.find(t=>t.id===select.value).note;diagnostics.settled=false;wake();}
function fit(){if(!renderer)return;const rect=surface.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();wake();}
function dispose(){alive=false;cancelAnimationFrame(raf);if(world){const geometries=new Set(),materials=new Set(),textures=new Set();world.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}renderer?.dispose();renderer?.forceContextLoss();}
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  world=createWorld(renderer,wake);world.scene.add(layers,portal);
  labels.forEach((label,i)=>{const layer=new THREE.Mesh(new THREE.BoxGeometry(5,.3,3),new THREE.MeshStandardMaterial({color:['#ddd7c7','#695744','#87674a','#c2cbbd'][i],roughness:.8}));layer.position.set(40,.5+i*.45,-60);layers.add(layer);});
  for(const[x,y,w,h]of [[-3,3,.5,6],[3,3,.5,6],[0,6,6.5,.5]]){const bar=new THREE.Mesh(new THREE.BoxGeometry(w,h,.6),new THREE.MeshStandardMaterial({color:'#e3b677'}));bar.position.set(x,y,-8);portal.add(bar);}
  const resize=new ResizeObserver(fit);resize.observe(surface);fit();update();
  const results=await world.ready;diagnostics.assetFailures=results.filter(r=>!r.loaded).map(r=>r.name);world.scene.traverse(o=>{if(o.isInstancedMesh&&o.geometry.type==='PlaneGeometry')o.count=Math.min(o.count,24);});
  world.scene.traverse(o=>{if(o.isInstancedMesh&&o.material?.map?.image?.src?.includes('/trees-'))portalTrees.push(o.material);});
  let fernMap;world.scene.traverse(o=>{if(o.material?.map?.image?.src?.includes('foreground-ferns'))fernMap=o.material.map;});
  if(fernMap){occluder=new THREE.Mesh(new THREE.PlaneGeometry(4,3),new THREE.MeshBasicMaterial({map:fernMap,transparent:true,alphaTest:.02,depthWrite:false,side:THREE.DoubleSide}));const point=route.getPoint(.21),tangent=route.getTangent(.21);occluder.position.set(point.x+.7,1.8,point.z);occluder.rotation.y=Math.atan2(-tangent.x,-tangent.z);occluder.visible=false;world.scene.add(occluder);}
  try{
    const data=await json('/lab/strategy/data/spy.json');rows=data.data;timeline=timelineData(rows);
    ribbon=new THREE.Group();ribbon.position.z=-50;
    const shape=new THREE.Shape(),samples=timeline.samples;shape.moveTo(samples[0].x,samples[0].y+.1);
    samples.slice(1).forEach(t=>shape.lineTo(t.x,t.y+.1));[...samples].reverse().forEach(t=>shape.lineTo(t.x,t.y-.1));shape.closePath();
    ribbon.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:'#bd8d44',roughness:.7})));
    ribbon.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(samples.map(t=>new THREE.Vector3(t.x,t.y+.12,.19))),new THREE.LineBasicMaterial({color:'#fff3cc',toneMapped:false})));
    const posts=timeline.years.flatMap(t=>[new THREE.Vector3(t.x,.3,0),new THREE.Vector3(t.x,t.y-.14,0)]);
    ribbon.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(posts),new THREE.LineBasicMaterial({color:'#c2cbbd'})));
    marker=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),new THREE.MeshBasicMaterial({color:'#fff3cc',toneMapped:false}));
    markerStem=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,1,0)]),new THREE.LineBasicMaterial({color:'#fff3cc',toneMapped:false}));
    ribbon.add(marker,markerStem);
    ribbon.visible=false;world.scene.add(ribbon);
  }catch{rows=[];timeline=null;dataError='SPY data unavailable; timeline ribbon could not load.';}
  diagnostics.ready=true;$('#motion-status').textContent=diagnostics.assetFailures.length?'Some forest layers unavailable.':'Forest ready · wheel within the canvas to scrub';wake();
  addEventListener('pagehide',()=>{resize.disconnect();dispose();},{once:true});
}catch{$('#motion-status').textContent='WebGL unavailable. The motion playground requires a WebGL-capable browser.';}
for(const input of [select,scrub,$('#damping'),$('#speed')])input.addEventListener('input',update);
canvas.addEventListener('wheel',event=>{event.preventDefault();scrub.value=Math.max(0,Math.min(1,Number(scrub.value)+event.deltaY*.001*Number($('#speed').value)));update();},{passive:false});
$('#play').addEventListener('click',()=>{if(reduced.matches)return;playing=!playing;if(playing&&Number(scrub.value)>=1)scrub.value=0;$('#play').textContent=playing?'Pause':'Play';wake();});
const preference=()=>{playing=false;$('#play').disabled=reduced.matches;update();};reduced.addEventListener('change',preference);preference();
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else wake();});
window.motionDebug=diagnostics;
