import {route} from '../journey/route.js';
export const techniques=[
  {id:'forward',title:'Forward landscape travel',note:'Use for arrival and spatial continuity; cost: forest layers plus one moving camera.'},
  {id:'curved',title:'Curved route / foreground occlusion',note:'Use to conceal transitions and convey depth; cost: transparent near cards and overdraw.'},
  {id:'orbital',title:'Orbital project reveal',note:'Use to introduce one installation; cost: additional visible sides, no extra scene.'},
  {id:'portal',title:'Portal into a project',note:'Use to move from place to detail; cost: framed mesh and a DOM crossfade.'},
  {id:'horizontal',title:'Horizontal lab stations',note:'Use to compare adjacent tools; cost: multiple benches visible together.'},
  {id:'exploded',title:'Exploded box assembly',note:'Use to explain generic component layers; cost: four animated boxes and projected labels, not coursework hardware.'},
  {id:'timeline',title:'Historical price ribbon',note:'Use to connect dates to observed data; cost: a sampled extruded SPY mesh, no live feed.'},
  {id:'overview',title:'Return to overview',note:'Use to restore orientation, then return; cost: more of the forest visible at high altitude.'}
];
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function motionPose(id,input){if(!techniques.some(t=>t.id===id))throw new RangeError('Unknown motion technique.');const p=Math.min(1,Math.max(0,Number.isFinite(input)?input:0));let position,target;
  if(id==='forward'){position=lerp([0,3.2,24],[-15,3.2,-29],p);target=[position[0]-8,2,position[2]-30];}
  if(id==='curved'){position=route.getPoint(.04+.30*p).toArray();target=route.getPoint(.07+.30*p).toArray();target[1]=2.6;}
  if(id==='orbital'){const a=-Math.PI/2+p*Math.PI*.8;position=[-5+Math.cos(a)*18,5,-22+Math.sin(a)*18];target=[-5,3,-22];}
  if(id==='portal'){position=[0,3.2,20-29*p];target=[0,3.2,-18];}
  if(id==='horizontal'){position=[6+22*p,3.2,-90];target=[6+22*p,3,-108];}
  if(id==='exploded'){position=[48+3*p,7+4*p,-49];target=[40,2+4*p,-60];}
  if(id==='timeline'){position=[-90+90*p,8+7*p,-25];target=[-90+90*p,4+6*p,-50];}
  if(id==='overview'){const t=Math.sin(p*Math.PI);position=lerp([0,3.2,24],[80,145,-80],t);target=lerp([-24,2,-16],[0,0,-80],t);}
  return{position,target,roll:0,progress:p};
}
