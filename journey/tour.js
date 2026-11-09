export const tourStops=[
  {id:'observatory',caption:'Compare SMA strategies on the bundled SPY series.'},
  {id:'workshop',caption:'Inspect the site’s renderer and thermal illustration.'},
  {id:'clearing',caption:'Try a validated chess puzzle; explore the recorded poker work.'},
  {id:'overlook',caption:'Meet Ethan and find contact details.'}
];
export function tourStepAt(seconds){return Math.min(tourStops.length-1,Math.floor(Math.max(0,Number.isFinite(seconds)?seconds:0)/15));}
export function mountTour(root,{navigate,origin='entrance'}){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),controller=new AbortController();
  const style=document.createElement('link');style.rel='stylesheet';style.href='/journey/tour.css';document.head.append(style);
  const panel=document.createElement('aside');panel.className='guided-tour';panel.setAttribute('aria-label','60-second guided tour');panel.innerHTML='<strong>60-second tour</strong><p data-caption aria-live="polite">Four supported stops. Start when you’re ready.</p><output data-time>0 / 60 seconds</output><div><button data-start>Start tour</button><button data-pause disabled>Pause</button><button data-skip disabled>Skip stop</button><button data-exit>Exit tour</button></div>';root.append(panel);
  let elapsed=0,index=-1,running=false,last=performance.now();
  const show=()=>{const next=tourStepAt(elapsed);if(next!==index){index=next;navigate(tourStops[index].id,{instant:reduced.matches,push:false});panel.querySelector('[data-caption]').textContent=tourStops[index].caption;}panel.dataset.step=index;panel.dataset.running=running;panel.querySelector('[data-time]').textContent=`${Math.floor(elapsed)} / 60 seconds${reduced.matches?' · reduced motion: instant cuts':''}`;panel.querySelector('[data-pause]').textContent=running?'Pause':'Resume';panel.querySelector('[data-pause]').disabled=index<0||elapsed>=60;panel.querySelector('[data-skip]').disabled=index<0||elapsed>=60;};
  const timer=setInterval(()=>{const now=performance.now(),dt=(now-last)/1000;last=now;if(!running||document.hidden||document.querySelector('dialog[open]'))return;elapsed=Math.min(60,elapsed+dt);if(elapsed===60)running=false;show();},200);
  const destroy=()=>{clearInterval(timer);controller.abort();panel.remove();style.remove();};
  panel.addEventListener('click',e=>{if(e.target.matches('[data-start]')){elapsed=0;index=-1;running=true;}if(e.target.matches('[data-pause]'))running=!running;if(e.target.matches('[data-skip]')){elapsed=Math.min(60,(index+1)*15);if(elapsed===60)running=false;}if(e.target.matches('[data-exit]')){navigate(origin,{instant:true,push:false});destroy();return;}last=performance.now();show();},{signal:controller.signal});
  addEventListener('pagehide',destroy,{once:true,signal:controller.signal});return destroy;
}
