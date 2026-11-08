import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMachine,step,instructions} from '../prototypes/accumulator-engine.js';
import {clock,leds} from '../prototypes/fsm-engine.js';
import {motionPose,techniques} from '../dev/motion-poses.js';
import {tourStepAt,tourStops} from '../journey/tour.js';
import {getStations} from '../journey/route.js';
import {presets} from '../prototypes/thermal-gallery.js';

test('generic accumulator program finds the maximum of all four nibbles, including zero and the full word',()=>{
  for(const word of [0,1,16,0x012b,0x0123,0x8000,0x1111,0xabcd,0xffff]){const m=createMachine(word);let limit=50000;while(!m.halted&&limit--)step(m);assert.ok(m.halted);assert.equal(m.memory[5],Math.max(...word.toString(16).split('').map(c=>parseInt(c,16))));assert.equal(m.memory[4],0);assert.deepEqual(m.stack,[]);const cycles=m.cycles;step(m);assert.equal(m.cycles,cycles);}
  assert.ok(instructions.some(([op])=>op==='CALL'));assert.ok(instructions.some(([op])=>op==='RETURN'));
});
test('generic accumulator branches, signed subtraction and invalid programs are explicit',()=>{
  const m=createMachine();step(m,[['SUB',1]]);assert.equal(m.ac,-16);assert.deepEqual(m.last,{op:'SUB',arg:1,before:0,operand:16,after:-16});
  for(const value of [-1,65536,NaN,1.5])assert.throws(()=>createMachine(value),RangeError);
  assert.throws(()=>step(createMachine(),[]),RangeError);assert.throws(()=>step(createMachine(),[['LOAD',99]]),RangeError);assert.throws(()=>step(createMachine(),[['RETURN']]),/Empty/);assert.throws(()=>step(createMachine(),[['INVALID']]),/Unknown/);
});
test('Moore outputs depend only on state and sampled input sequence advances or resets',()=>{
  const inputs={start:true,box:false,safe:true};let state=clock('IDLE',inputs);assert.equal(state,'FEED');assert.deepEqual(leds(state),{feed:true,press:false,eject:false});assert.equal(clock(state,inputs),'FEED');state=clock(state,{...inputs,box:true});assert.equal(state,'PRESS');assert.equal(clock(state,inputs),'EJECT');assert.equal(clock('EJECT',inputs),'IDLE');for(const s of ['IDLE','FEED','PRESS','EJECT'])assert.equal(clock(s,{...inputs,safe:false}),'IDLE');assert.throws(()=>clock('',inputs),RangeError);assert.throws(()=>leds('missing'),RangeError);
});
test('all eight motion paths have finite changing poses and zero roll at endpoints and midpoint',()=>{
  assert.equal(techniques.length,8);
  for(const technique of techniques){const poses=[0,.5,1].map(p=>motionPose(technique.id,p));for(const pose of poses){assert.ok([...pose.position,...pose.target].every(Number.isFinite));assert.equal(pose.roll,0);}assert.notDeepEqual(poses[0].position,poses[1].position);assert.notDeepEqual(poses[1].position,poses[2].position);assert.deepEqual(motionPose(technique.id,NaN),motionPose(technique.id,0));assert.deepEqual(motionPose(technique.id,-1),motionPose(technique.id,0));}
  assert.throws(()=>motionPose('missing',.5),RangeError);
  assert.match(readFileSync(new URL('../dev/motion.html',import.meta.url),'utf8'),/name="robots" content="noindex"/);
});
test('tour is four supported stops at fifteen seconds each; invalid time stays at the first stop',()=>{
  const ids=getStations().map(s=>s.id);assert.equal(tourStops.length,4);tourStops.forEach(stop=>{assert.ok(ids.includes(stop.id));assert.ok(stop.caption);});assert.deepEqual([0,14.99,15,30,45,60].map(tourStepAt),[0,0,1,2,3,3]);assert.equal(tourStepAt(NaN),0);assert.equal(tourStepAt(-1),0);
});
test('thermal presets vary real ranges, edges and grain without duplicating illustration code',()=>{
  assert.equal(presets.length,4);assert.equal(new Set(presets.map(p=>p.range)).size,4);for(const p of presets){assert.ok(p.range>0);assert.equal(typeof p.edges,'boolean');assert.equal(typeof p.grain,'boolean');}
  assert.ok(readFileSync(new URL('../main.js',import.meta.url),'utf8').includes('import { createRenderer } from "./lab/renderer.js"'));
});
