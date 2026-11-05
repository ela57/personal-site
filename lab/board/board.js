import { createBoardModel, readoutAt, indexAtFraction } from "./model.js";
import { dotText } from "./dots.js";

export async function mountBoard(root) {
  if (!root) return;
  const canvas = root.querySelector("canvas"), ctx = canvas.getContext("2d"), live = root.querySelector("[data-board-readout]");
  const controller = new AbortController(), opts = { signal: controller.signal }, reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let model, selected = 0, width = 0, height = 0, raf = 0, visible = false, disposed = false, last = 0, power = 0, crawl = 0, velocity = 0, drag = null;
  const pointers = new Set();
  const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0; velocity = 0; };
  const active = () => visible && !document.hidden && !disposed;
  const format = value => value === null ? "N/A" : value.toFixed(2);
  function announce() {
    const r = readoutAt(model, selected);
    live.textContent = `SPY adjusted close ${r.price.toFixed(2)} · change ${r.changePercent === null ? "unavailable" : r.changePercent.toFixed(2) + "%"} · ${r.date}. 20-day SMA ${format(r.fast)}; 100-day SMA ${format(r.slow)}. Historical data, not a live quote.`;
    root.dataset.index = r.index;
  }
  function draw() {
    if (!model || !width || !active()) return;
    const r = readoutAt(model, selected), small = width < 650, pad = small ? 16 : 32, cell = small ? 1.85 : Math.min(3, width / 405);
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = "#14161A"; ctx.fillRect(0, 0, width, height);
    const spacing = small ? 6 : 5;
    ctx.fillStyle = "#342A19";
    for (let y = 12; y < height; y += spacing) for (let x = 12; x < width; x += spacing) { ctx.beginPath(); ctx.arc(x,y,.65,0,Math.PI*2);ctx.fill(); }
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, width, height * (.12 + .88 * Math.min(1, power / 600))); ctx.clip();
    if (small) {
      dotText(ctx, `SPY LAST ${r.price.toFixed(2)}`, pad, 26, 2.2);
      dotText(ctx, `CHG ${r.changePercent === null ? 'N/A' : (r.changePercent >= 0 ? '+' : '') + r.changePercent.toFixed(2) + '%'}`, pad, 56, cell);
      dotText(ctx, `DATE ${r.date}`, pad, 80, cell);
    } else dotText(ctx, `SPY  LAST ${r.price.toFixed(2)}  CHG ${r.changePercent === null ? 'N/A' : (r.changePercent>=0?'+':'')+r.changePercent.toFixed(2)+'%'}  DATE ${r.date}`, pad, 32, cell);
    const top = small ? 125 : 100, bottom = height - (small ? 124 : 100), left = pad, right = width - pad;
    const values = model.rows.map(row => row[1]), lo = Math.min(...values) * .92, hi = Math.max(...values) * 1.07;
    const px = i => left + i / (values.length - 1) * (right - left), py = v => bottom - (v - lo) / (hi - lo) * (bottom - top);
    const trace = (series, color, radius) => {
      ctx.fillStyle = color; let previous = -Infinity;
      series.forEach((v,i) => { if (v === null || px(i)-previous < spacing) return; previous=px(i);ctx.beginPath();ctx.arc(Math.round(px(i)/spacing)*spacing,Math.round(py(v)/spacing)*spacing,radius,0,Math.PI*2);ctx.fill(); });
    };
    trace(model.slow,"#A5B8EB",small?1.65:1.2);trace(model.fast,"#E4DCC6",small?1.65:1.2);trace(values,"#F2A30F",small?2.5:1.8);
    ctx.strokeStyle = "#AE8947";ctx.lineWidth=1;ctx.setLineDash([2,5]);ctx.beginPath();ctx.moveTo(px(r.index),top);ctx.lineTo(px(r.index),bottom+8);ctx.stroke();ctx.setLineDash([]);
    for (const flag of model.flags) {
      const x=px(flag.index),y=py(values[flag.index]),buy=flag.side==='buy';
      ctx.strokeStyle=buy?'#A5B8EB':'#F0A49B';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+(buy?15:-15));ctx.lineTo(x+4,y+(buy?12:-12));ctx.stroke();
    }
    dotText(ctx,model.rows[0][0].slice(0,4),pad,bottom+22,1.8,"#D3B781");dotText(ctx,model.rows.at(-1)[0].slice(0,4),width-pad-44,bottom+22,1.8,"#D3B781");
    ctx.strokeStyle="#5A3D07";ctx.beginPath();ctx.moveTo(pad,height-(small?76:42));ctx.lineTo(right,height-(small?76:42));ctx.stroke();
    const ticker=`SMA20 ${format(r.fast)} / SMA100 ${format(r.slow)} / SPY ${r.price.toFixed(2)} / 12 VERTICES / 20 FACES / `;
    if (small) {
      dotText(ctx,`SMA20 ${format(r.fast)} / SMA100 ${format(r.slow)}`,pad,height-56,1.8);
      dotText(ctx,`SPY ${r.date} / 12 VERTICES / 20 FACES / `,pad-crawl%510,height-27,1.8);
    } else {
      const period=ticker.length*9.6;
      for(let x=pad-crawl%period;x<width;x+=period)dotText(ctx,ticker,x,height-25,1.6);
    }
    ctx.restore();
  }
  function frame(time) {
    raf=0;if(!active()||!model)return;
    const dt=last?Math.min(time-last,32):16;last=time;
    power=reduced.matches?600:Math.min(600,power+dt);
    if(!drag&&!reduced.matches&&Math.abs(velocity)>.0005){selected=Math.max(0,Math.min(model.rows.length-1,selected+velocity*dt));velocity*=Math.exp(-dt/160);announce();}
    if(!reduced.matches)crawl+=dt*.025;
    draw();if(!reduced.matches)raf=requestAnimationFrame(frame);
  }
  const wake=()=>{if(active()&&model&&!raf)raf=requestAnimationFrame(frame);};
  function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  const ro=new ResizeObserver(resize);ro.observe(canvas);
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){resize();wake();}else stop();});io.observe(canvas);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();else wake();},opts);
  reduced.addEventListener("change",()=>{stop();power=600;draw();wake();},opts);
  canvas.addEventListener("pointerdown",e=>{
    if(!model||e.button!==0)return;
    pointers.add(e.pointerId);
    if(pointers.size>1){if(drag&&canvas.hasPointerCapture(drag.id))canvas.releasePointerCapture(drag.id);drag=null;velocity=0;return;}
    drag={id:e.pointerId,x:e.clientX,index:selected,time:e.timeStamp};velocity=0;canvas.setPointerCapture(e.pointerId);
  },opts);
  canvas.addEventListener("pointermove",e=>{
    if(!drag||drag.id!==e.pointerId||pointers.size!==1)return;
    const next=indexAtFraction(model.rows.length,drag.index/Math.max(1,model.rows.length-1)+(e.clientX-drag.x)/width);
    velocity=(next-selected)/Math.max(1,e.timeStamp-drag.time);selected=next;drag.time=e.timeStamp;announce();draw();wake();
  },opts);
  const end=e=>{pointers.delete(e.pointerId);if(drag?.id===e.pointerId){drag=null;if(e.type==='pointercancel')velocity=0;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);wake();}};
  addEventListener("pointerup",end,opts);addEventListener("pointercancel",end,opts);
  canvas.addEventListener("wheel",e=>{if(!model||Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();velocity=0;selected=Math.max(0,Math.min(model.rows.length-1,selected+e.deltaX/width*(model.rows.length-1)));announce();draw();},{...opts,passive:false});
  canvas.addEventListener("keydown",e=>{
    if(!model||!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
    e.preventDefault();velocity=0;
    selected=e.key==='Home'?0:e.key==='End'?model.rows.length-1:Math.max(0,Math.min(model.rows.length-1,Math.round(selected)+(e.key==='ArrowRight'?1:-1)));
    announce();draw();
  },opts);
  function cleanup(){disposed=true;stop();ro.disconnect();io.disconnect();controller.abort();}
  addEventListener("pagehide",e=>{if(!e.persisted)cleanup();},opts);
  try{
    const response=await fetch(new URL("../strategy/data/spy.json",import.meta.url),{signal:controller.signal});
    if(!response.ok)throw new Error("Bundled SPY prices could not load. Reload to try again.");
    const payload=await response.json();if(disposed)return cleanup;
    model=createBoardModel(payload.data);if(!model.rows.length)throw new Error("No bundled SPY prices available.");
    selected=model.rows.length-1;power=reduced.matches?600:0;announce();resize();wake();
  }catch(error){if(!disposed)live.textContent=error.message;}
  return cleanup;
}
