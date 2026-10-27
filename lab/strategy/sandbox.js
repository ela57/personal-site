import { createChart, LineSeries, createSeriesMarkers } from "../../vendor/lightweight-charts.js";
import { backtest } from "./engine.js";
import { simulateGBM, simulation } from "./simulated.js";

const defaults = { short: 20, long: 100, costBps: 5 };
const percent = value => (value * 100).toFixed(2) + "%";
const price = value => value.toFixed(2);

export function mountStrategy(root) {
  const controller = new AbortController(), opts = { signal: controller.signal };
  let spy = null, dataset = "spy", timer = 0, result = null;
  const simulated = simulateGBM();
  root.innerHTML = `<p class="strategyDisclaimer mono">Educational historical simulation. Not live trading performance or investment advice.</p>
    <div class="strategyControls">
      <label>Dataset<select name="dataset"><option value="spy">SPY · adjusted close</option><option value="simulated">Simulated · seeded GBM</option></select></label>
      <label>Short SMA · sessions<span class="strategyPair"><input type="range" name="shortRange" min="1" max="200" value="20" aria-label="Short SMA sessions"><input type="number" name="short" min="1" max="200" value="20" aria-label="Short SMA sessions, number"></span></label>
      <label>Long SMA · sessions<span class="strategyPair"><input type="range" name="longRange" min="2" max="400" value="100" aria-label="Long SMA sessions"><input type="number" name="long" min="2" max="400" value="100" aria-label="Long SMA sessions, number"></span></label>
      <label>Cost · bps per change<input type="number" name="costBps" min="0" max="100" step="1" value="5"></label>
      <label>Start · inclusive<input type="date" name="start"></label>
      <label>End · inclusive<input type="date" name="end"></label>
    </div>
    <div class="strategyActions mono"><button type="button" data-reset>Reset defaults</button><p role="status" aria-live="polite" data-status>Loading bundled prices…</p></div>
    <p class="strategySource mono" data-source></p>
    <section class="strategyChartSection" aria-labelledby="strategyPriceTitle"><header><h3 id="strategyPriceTitle">SPY · adjusted close &amp; moving averages</h3><p class="mono">Price / short SMA / long SMA · ▲ buy · ▼ sell</p></header><div class="strategyChart strategyPriceChart" role="img" aria-label="Daily price, moving averages and executed buy/sell markers"></div></section>
    <section class="strategyChartSection" aria-labelledby="strategyEquityTitle"><header><h3 id="strategyEquityTitle">Equity · Strategy vs Buy &amp; hold</h3><p class="mono">Rebased to 1 at range start · net of costs · blue: Strategy · ink: Buy &amp; hold</p></header><div class="strategyChart strategyEquityChart" role="img" aria-label="Strategy and buy-and-hold equity curves"></div></section>
    <p class="strategyAttribution mono">TradingView Lightweight Charts™<br>Copyright (с) 2025 TradingView, Inc. <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">Charts by TradingView ↗</a></p>
    <section class="strategyResults"><div><h3>Performance / <span data-result-label>SPY</span></h3><table class="strategyMetrics mono"><caption class="srOnly">Strategy and buy-and-hold performance</caption><thead><tr><th scope="col">Metric</th><th scope="col">Strategy</th><th scope="col">Buy &amp; hold</th></tr></thead><tbody data-metrics></tbody></table></div>
    <div class="strategyMethod"><h3>Model notes</h3><p>Long when short SMA exceeds long SMA; otherwise flat. Signals on close, filled next close. No position during warm-up; date selection slices prices first, with warm-up taken from within the range.</p><p>Costs apply to traded notional on every entry and exit. Buy &amp; hold pays one entry cost at the first selected close. Open trades are marked to the last close, with entry cost only; no assumed liquidation cost.</p><p>Adjusted-price fills are a modelling convention, not executable quotes. Volatility uses sample daily standard deviation × √252; Sharpe uses mean daily return × 252 / annualized volatility, rf=0. Initial costs enter daily returns and drawdown. No cash interest, taxes or slippage beyond the selected cost.</p></div></section>
    <section class="strategyTrades"><header><h3>Trade ledger / <span data-trade-count>0</span></h3><p class="mono">Prices in dataset units · holding days are calendar days · net of costs</p></header><div class="strategyTableScroll" tabindex="0" role="region" aria-label="Scrollable trade ledger"><table class="mono"><thead><tr><th scope="col">Entry date</th><th scope="col">Entry price</th><th scope="col">Exit date</th><th scope="col">Exit price</th><th scope="col">Net return</th><th scope="col">Days</th></tr></thead><tbody data-trades></tbody></table></div></section>`;
  const field = name => root.querySelector(`[name="${name}"]`);
  const status = root.querySelector("[data-status]");
  const source = root.querySelector("[data-source]");
  const paper = "#F2EFE7", ink = "#151513", blue = "#1D44F0";
  const chartOptions = {
    layout: { background: { color: paper }, textColor: "#686559", fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, attributionLogo: false },
    grid: { vertLines: { visible: false }, horzLines: { color: "rgba(21,21,19,.08)" } },
    rightPriceScale: { borderColor: "rgba(21,21,19,.16)" },
    timeScale: { borderColor: "rgba(21,21,19,.16)", timeVisible: false, minBarSpacing: 0.01 },
    handleScroll: false, handleScale: false
  };
  const priceHost = root.querySelector(".strategyPriceChart"), equityHost = root.querySelector(".strategyEquityChart");
  const priceChart = createChart(priceHost, { ...chartOptions, width: priceHost.clientWidth, height: 310 });
  const equityChart = createChart(equityHost, { ...chartOptions, width: equityHost.clientWidth, height: 250 });
  equityChart.priceScale("right").applyOptions({ scaleMargins: { top: 0.25, bottom: 0.1 }, entireTextOnly: true });
  const line = (chart, color, title) => chart.addSeries(LineSeries, { color, title, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
  const closeLine = line(priceChart, ink, "Price"), shortLine = line(priceChart, blue, "Short SMA"), longLine = line(priceChart, "#97835E", "Long SMA");
  const strategyLine = line(equityChart, blue, "Strategy"), holdLine = line(equityChart, ink, "Buy & hold");
  const markers = createSeriesMarkers(closeLine, []);
  const resize = new ResizeObserver(() => {
    priceChart.resize(priceHost.clientWidth, 310); equityChart.resize(equityHost.clientWidth, 250);
    priceChart.timeScale().fitContent(); equityChart.timeScale().fitContent();
  });
  resize.observe(priceHost); resize.observe(equityHost);
  const data = () => dataset === "simulated" ? simulated : spy?.data || [];
  function setDates() {
    const rows = data();
    for (const name of ["start", "end"]) {
      field(name).min = rows[0]?.[0] || ""; field(name).max = rows.at(-1)?.[0] || "";
      field(name).value = name === "start" ? field(name).min : field(name).max;
    }
  }
  function describe() {
    const label = dataset === "simulated" ? "Simulated" : "SPY";
    root.querySelector("#strategyPriceTitle").textContent = `${label} · ${dataset === "spy" ? "adjusted close" : "GBM price"} & moving averages`;
    root.querySelector("#strategyEquityTitle").textContent = `${label} equity · Strategy vs Buy & hold`;
    root.querySelector("[data-result-label]").textContent = label;
    if (dataset === "simulated") source.textContent = `Simulated · GBM, not market data. Mulberry32 seed ${simulation.seed}; annual drift ${(simulation.drift * 100).toFixed(0)}%, volatility ${simulation.volatility * 100}%; dt=1/252, initial 100, ${simulation.days} weekday observations (no holiday calendar).`;
    else {
      source.textContent = spy ? `${spy.description}. Bundled ${spy.data[0][0]}–${spy.data.at(-1)[0]}; total-return-style prices, rounded to 4 decimals. ` : "Loading Yahoo Finance adjusted closes…";
      if (spy) {
        const link = document.createElement("a"); link.href = spy.source; link.textContent = "Source ↗"; link.target = "_blank"; link.rel = "noopener noreferrer"; source.append(link);
      }
    }
  }
  function display(next) {
    result = next;
    closeLine.setData(result.rows.map(([time, value]) => ({ time, value })));
    for (const [series, values] of [[shortLine, result.fast], [longLine, result.slow]]) series.setData(result.rows.flatMap(([time], i) => values[i] === null ? [] : [{ time, value: values[i] }]));
    strategyLine.setData(result.equity); holdLine.setData(result.holdEquity);
    markers.setMarkers(result.markers.map(m => ({ time: m.time, position: m.side === "buy" ? "belowBar" : "aboveBar", color: m.side === "buy" ? blue : ink, shape: m.side === "buy" ? "arrowUp" : "arrowDown" })));
    priceChart.timeScale().fitContent(); equityChart.timeScale().fitContent();
    root.querySelector("[data-metrics]").innerHTML = [["Cumulative", "cumulative"], ["Annual vol", "volatility"], ["Sharpe · rf=0", "sharpe"], ["Max drawdown", "maxDrawdown"]].map(([label, key]) => `<tr><th scope="row">${label}</th><td>${result.rows.length ? key === "sharpe" ? result.strategy[key].toFixed(2) : percent(result.strategy[key]) : "—"}</td><td>${result.rows.length ? key === "sharpe" ? result.buyHold[key].toFixed(2) : percent(result.buyHold[key]) : "—"}</td></tr>`).join("");
    root.querySelector("[data-trades]").innerHTML = result.trades.length ? result.trades.map(t => `<tr><td>${t.entryDate}</td><td>${price(t.entryPrice)}</td><td>${t.open ? "Open" : t.exitDate}</td><td>${t.open ? "—" : price(t.exitPrice)}</td><td>${percent(t.netReturn)}</td><td>${t.holdingDays}</td></tr>`).join("") : '<tr><td colspan="6">No trades in this range.</td></tr>';
    root.querySelector("[data-trade-count]").textContent = result.trades.length;
    root.dataset.markers = result.markers.length;
    root.dataset.revision = Number(root.dataset.revision || 0) + 1;
  }
  function compute() {
    clearTimeout(timer);
    describe();
    if (dataset === "spy" && !spy) return;
    const short = Math.max(1, Math.min(200, Math.round(Number(field("short").value) || defaults.short)));
    const long = Math.max(short + 1, Math.min(400, Math.round(Number(field("long").value) || defaults.long)));
    const costBps = Math.max(0, Math.min(100, Number(field("costBps").value) || 0));
    for (const [name, value] of Object.entries({ short, long, costBps })) field(name).value = value;
    field("shortRange").value = short; field("longRange").value = long;
    try {
      display(backtest(data(), { short, long, costBps, start: field("start").value, end: field("end").value }));
      status.textContent = result.rows.length ? `${dataset === "simulated" ? "Simulated · " : ""}${result.rows.length.toLocaleString()} sessions · ${result.markers.length} fills${result.rows.length <= long ? " · insufficient warm-up; strategy stays flat" : ""}` : "No prices in this range. Choose different dates.";
    } catch (error) {
      display(backtest([])); status.textContent = error.message;
    }
  }
  function reset() {
    dataset = "spy"; field("dataset").value = dataset;
    for (const [name, value] of Object.entries(defaults)) field(name).value = value;
    setDates(); compute();
  }
  root.addEventListener("input", e => {
    if (!e.target.name || e.target.name === "dataset") return;
    if (e.target.name.endsWith("Range")) field(e.target.name.replace("Range", "")).value = e.target.value;
    clearTimeout(timer); timer = setTimeout(compute, 150);
  }, opts);
  field("dataset").addEventListener("change", () => { dataset = field("dataset").value; setDates(); compute(); }, opts);
  root.querySelector("[data-reset]").addEventListener("click", reset, opts);
  fetch(new URL("./data/spy.json", import.meta.url), opts).then(response => {
    if (!response.ok) throw new Error("Bundled prices could not load.");
    return response.json();
  }).then(value => {
    if (controller.signal.aborted) return;
    spy = value;
    if (dataset === "spy") { setDates(); compute(); }
  }).catch(error => {
    if (controller.signal.aborted) return;
    status.textContent = `${error.message} You can still choose Simulated.`;
  });
  return () => { controller.abort(); clearTimeout(timer); resize.disconnect(); markers.detach(); priceChart.remove(); equityChart.remove(); root.replaceChildren(); };
}
