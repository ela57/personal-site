import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { prototypes, scoreKeys } from '../content/prototypes.js';
import { annualizedReturn, rollingCloseVol } from '../prototypes/finance.js';

const labels=['Working project integration','Illustrative simulation','Research prototype','Proposed future feature'];
test('prototype registry has valid scores, sources, mounts and recommendations',async()=>{
  assert.equal(new Set(prototypes.map(p=>p.id)).size,prototypes.length);
  for(const p of prototypes){
    for(const key of ['id','title','area','shows'])assert.ok(p[key]);
    assert.ok(labels.includes(p.label));assert.ok(['main','detour','experiment'].includes(p.recommendation));
    assert.deepEqual(Object.keys(p.scores),scoreKeys);
    for(const score of Object.values(p.scores)){assert.ok(Number.isInteger(score.value)&&score.value>=1&&score.value<=5);assert.ok(score.rationale.trim());}
    assert.ok(p.sources.length);
    for(const source of p.sources){assert.ok(existsSync(new URL(`../${source.path}`,import.meta.url)));if(source.repo){assert.match(source.commit,/^[a-f0-9]{40}$/);assert.equal(source.seed,1000000);const exported=JSON.parse(readFileSync(new URL(`../${source.path}`,import.meta.url)));assert.equal(exported.source.commit,source.commit);assert.equal(exported.source.repo,source.repo);}}
    const module=await import(`..${p.mount.module}`);assert.equal(typeof module[p.mount.export],'function');
  }
});
test('development gallery is noindex and absent from public navigation',()=>{
  assert.match(readFileSync(new URL('../dev/index.html',import.meta.url),'utf8'),/<meta name="robots" content="noindex">/);
  for(const page of ['index.html','journey/shell.html','projects/index.html'])assert.ok(!readFileSync(new URL(`../${page}`,import.meta.url),'utf8').includes('href="/dev/'));
});
test('annualized return uses session convention and handles empty input',()=>{
  assert.equal(annualizedReturn(.1,252),.10000000000000009);assert.equal(annualizedReturn(.1,0),0);assert.equal(annualizedReturn(-1,252),-1);
});
test('rolling close-to-close estimator uses sample log-return variance and warm-up',()=>{
  assert.deepEqual(rollingCloseVol([],2),[]);
  const values=rollingCloseVol([['a',100],['b',110],['c',99]],2);
  assert.deepEqual(values.slice(0,2),[null,null]);
  assert.ok(Math.abs(values[2]-Math.abs(Math.log(1.1)-Math.log(.9))/Math.sqrt(2)*Math.sqrt(252))<1e-10);
  assert.deepEqual(rollingCloseVol([['a',1],['b',1],['c',1]],2),[null,null,0]);
  assert.throws(()=>rollingCloseVol([],1),RangeError);
});
