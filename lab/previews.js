export function mountPreviews(root) {
  if (!root) return;
  const controller = new AbortController(), opts = { signal: controller.signal };
  const board = root.querySelector("[data-preview-chess]"), canvas = root.querySelector("[data-preview-chart]");
  const moveButton = root.querySelector("[data-preview-move]"), toggle = root.querySelector("[data-preview-toggle]");
  let loaded = false, disposed = false, visible = false, chartData = null, prices = false, timer = 0;
  function draw() {
    if (!chartData || !visible || document.hidden || disposed) return;
    const { rows, result } = chartData, { width, height } = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext("2d"); ctx.scale(dpr,dpr); ctx.fillStyle = "#14161A"; ctx.fillRect(0,0,width,height);
    const series = prices ? [rows.map(r=>r[1]), result.fast, result.slow] : [result.equity.map(r=>r.value), result.holdEquity.map(r=>r.value)];
    const all = series.flat().filter(v=>v!==null), lo = Math.min(...all), hi = Math.max(...all);
    ctx.strokeStyle = "#5A3D07";ctx.lineWidth=1;
    for(let y=40;y<height-30;y+=50){ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(width-20,y);ctx.stroke();}
    series.forEach((values,j)=>{
      ctx.beginPath();ctx.strokeStyle=["#F2A30F","#ECE7DA","#A5B8EB"][j];ctx.lineWidth=j?1:2;
      let first=true;
      values.forEach((v,i)=>{if(v===null)return;const x=20+i/(values.length-1)*(width-40),y=height-40-(v-lo)/(hi-lo||1)*(height-65);if(first){ctx.moveTo(x,y);first=false;}else ctx.lineTo(x,y);});ctx.stroke();
    });
    ctx.fillStyle="#ECE7DA";ctx.font='12px Archivo, Arial, sans-serif';ctx.fillText(rows[0][0],20,height-14);ctx.textAlign='right';ctx.fillText(rows.at(-1)[0],width-20,height-14);
    canvas.setAttribute("aria-label",prices?"SPY adjusted prices with 20 and 100-day SMAs, 2005–2026":"Strategy (amber) versus buy-and-hold (ivory), 2005–2026, rebased to one, net of costs");
  }
  async function load() {
    loaded=true;
    try {
      const [{ Chess }, { puzzles }, { pieceSVG }, { backtest }, response] = await Promise.all([
        import("../vendor/chess.js"), import("./chess/puzzles.js"), import("./chess/board.js"), import("./strategy/engine.js"),
        fetch(new URL("./strategy/data/spy.json",import.meta.url),{signal:controller.signal})
      ]);
      if(!response.ok)throw new Error("Preview prices could not load.");
      const payload=await response.json();if(disposed)return;
      const puzzle=puzzles[0];let game=new Chess(puzzle.fen),ply=0;
      const render=()=>{board.innerHTML=game.board().flat().map((piece,i)=>`<span class="previewSquare ${(Math.floor(i/8)+i%8)%2?'dark':''}">${piece?pieceSVG(piece):''}</span>`).join("");};render();
      moveButton.addEventListener("click",()=>{
        if(ply){game=new Chess(puzzle.fen);ply=0;render();moveButton.textContent="Play the line";root.querySelector("[data-preview-chess-status]").textContent="12 puzzles · 3 difficulties";return;}
        moveButton.disabled=true;
        const step=()=>{if(disposed)return;game.move(puzzle.solution[ply++]);render();if(ply<puzzle.solution.length)timer=setTimeout(step,400);else{moveButton.disabled=false;moveButton.textContent="Reset preview";root.querySelector("[data-preview-chess-status]").textContent=`${puzzle.title} · checkmate`;}};
        step();
      },opts);
      const result=backtest(payload.data);chartData={rows:payload.data,result};
      const percent=v=>(v>=0?'+':'')+(v*100).toFixed(1)+'%';
      root.querySelector("[data-preview-result]").textContent=`Strategy ${percent(result.strategy.cumulative)} / Hold ${percent(result.buyHold.cumulative)} · net of costs`;
      toggle.addEventListener("click",()=>{prices=!prices;toggle.textContent=prices?"Show equity":"Show prices";draw();},opts);draw();
    }catch(error){if(!disposed){root.querySelector("[data-preview-result]").textContent="Preview unavailable. Open the sandbox to try again.";moveButton.disabled=true;toggle.disabled=true;}}
  }
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){if(!loaded)load();else draw();}});io.observe(root);
  const ro=new ResizeObserver(draw);ro.observe(canvas);
  document.addEventListener("visibilitychange",draw,opts);
  addEventListener("pagehide",e=>{if(!e.persisted){disposed=true;clearTimeout(timer);io.disconnect();ro.disconnect();controller.abort();}},opts);
}
