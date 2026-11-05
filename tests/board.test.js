import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createBoardModel, readoutAt, indexAtFraction } from "../lab/board/model.js";
import { backtest, sma } from "../lab/strategy/engine.js";
const rows = JSON.parse(readFileSync(new URL("../lab/strategy/data/spy.json",import.meta.url))).data;
test("board readout maps exact dates, adjusted prices, changes and SMAs",()=>{
  const model=createBoardModel(rows);
  for(const index of [0,100,2000,rows.length-1]){
    const r=readoutAt(model,index);assert.equal(r.date,rows[index][0]);assert.equal(r.price,rows[index][1]);
    assert.equal(r.changePercent,index?(rows[index][1]/rows[index-1][1]-1)*100:null);
    assert.equal(r.fast,sma(rows.map(r=>r[1]),20)[index]);
  }
  assert.equal(readoutAt(model,-100).index,0);assert.equal(readoutAt(model,1e6).index,rows.length-1);
});
test("board flags are engine fills, one close after the crossover signal",()=>{
  const model=createBoardModel(rows),engine=backtest(rows);
  assert.ok(model.flags.length>0);
  assert.deepEqual(model.flags.map(({time,side})=>({time,side})),engine.markers);
  for(const flag of model.flags){assert.equal(rows[flag.index][0],flag.time);assert.equal(flag.signalIndex+1,flag.index);assert.equal(engine.positions[flag.index],engine.signals[flag.signalIndex]);assert.notEqual(engine.positions[flag.index],engine.positions[flag.index-1]);}
});
test("board fraction/index endpoints, empty data and malformed prices",()=>{
  assert.equal(indexAtFraction(5489,0),0);assert.equal(indexAtFraction(5489,1),5488);assert.equal(indexAtFraction(5489,.5),2744);
  assert.equal(indexAtFraction(1,2),0);assert.equal(readoutAt(createBoardModel([]),0),null);
  assert.throws(()=>createBoardModel([["2020-01-01",-1]]),RangeError);
});
