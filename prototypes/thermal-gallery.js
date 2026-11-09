import { mountThermal } from '../lab/thermal.js';
export const presets=[{name:'Near / clean',range:.4,edges:false,grain:false},{name:'Edges / near',range:.55,edges:true,grain:false},{name:'Balanced',range:.7,edges:true,grain:true},{name:'Wide / grain',range:1.2,edges:false,grain:true}];
export function mount(root,{signal}){
  root.innerHTML='<p class="notice">Illustrative simulation. Existing SVG depth illustration; the Unity/HLSL source is not in this repository. Not a live thermal sensor or GPU shader.</p><div class="thermal-presets"></div><h3 data-name></h3><div data-live-thermal></div><div class="prototype-controls"><label>Depth range<input data-range type="range" min=".2" max="1.4" step=".01"></label><label>Edges<input data-edges type="checkbox"></label><label>Grain<input data-grain type="checkbox"></label></div>';
  const thumbs=root.querySelector('.thermal-presets');
  presets.forEach((preset,i)=>{const button=document.createElement('button');button.dataset.preset=i;button.setAttribute('aria-label',preset.name);button.innerHTML=`<span></span>${preset.name}`;thumbs.append(button);mountThermal(button.querySelector('span'),preset);});
  const live=mountThermal(root.querySelector('[data-live-thermal]'));
  function select(i){const preset=presets[i];root.querySelector('[data-name]').textContent=preset.name;for(const key of ['range','edges','grain']){const input=root.querySelector(`[data-${key}]`);if(key==='range')input.value=preset[key];else input.checked=preset[key];}live.set(preset);root.dataset.preset=i;thumbs.querySelectorAll('button').forEach((b,n)=>b.setAttribute('aria-pressed',String(i===n)));}
  thumbs.addEventListener('click',e=>{const button=e.target.closest('[data-preset]');if(button)select(Number(button.dataset.preset));},{signal});
  root.querySelector('.prototype-controls').addEventListener('input',()=>live.set({range:Number(root.querySelector('[data-range]').value),edges:root.querySelector('[data-edges]').checked,grain:root.querySelector('[data-grain]').checked}),{signal});select(2);return()=>root.replaceChildren();
}
