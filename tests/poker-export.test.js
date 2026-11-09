import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';

const load=name=>JSON.parse(readFileSync(new URL(`../prototypes/data/${name}.json`,import.meta.url)));
test('public boundary notes require a heads-up single preflop fold and net small blind',()=>{
  const script=`import runpy,json
f=runpy.run_path('tools/export_poker.py')['boundary_note']
h={'starting_stacks':[790,15210],'ending_stacks':[590,15410],'blinds':[200,400],'actions':[{'seat':0,'street':'preflop','kind':'fold'}]}
notes=[f(h,0)]
h['starting_stacks']=[590,15410];h['ending_stacks']=[790,15210];h['actions'][0]['seat']=1;notes.append(f(h,0))
h['actions'][0]['street']='river';notes.append(f(h,0))
h['actions']=[];notes.append(f(h,0))
h['actions']=[{'seat':1,'street':'preflop','kind':'fold'}];h['ending_stacks']=[800,15200];notes.append(f(h,0))
h['starting_stacks']=[590,15400,10];notes.append(f(h,0))
print(json.dumps(notes))`;
  const result=spawnSync('python3',['-c',script],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  const notes=JSON.parse(result.stdout);assert.match(notes[0],/hero folded/);assert.match(notes[1],/opponent folded/);assert.deepEqual(notes.slice(2),['','','','']);
});
function privateKeys(value){
  if(!value||typeof value!=='object')return;
  for(const[key,item]of Object.entries(value)){assert.ok(!/hole_cards|showdown|private|opponent_cards/.test(key),key);privateKeys(item);}
}
test('committed exports contain only hero cards, observed boards and card-free session totals',()=>{
  const replay=load('poker-run'),session=load('poker-session');privateKeys(replay);privateKeys(session);
  assert.equal(replay.featured.length,20);assert.equal(replay.hands.length,145);assert.equal(session.hands.length,200);
  assert.deepEqual(session.source,replay.source);
  assert.equal(replay.hands.flatMap(h=>h.decisions).length,200);
  const featured=replay.hands.filter(h=>replay.featured.includes(h.number));
  for(const tag of ['river decision','observed all-in','multiway postflop'])assert.ok(featured.some(h=>h.tags.includes(tag)));
  for(const hand of replay.hands)for(const d of hand.decisions){assert.equal(d.observation.my_seat,0);assert.equal(d.observation.hero_cards.length,2);for(const seat of d.observation.seats)assert.ok(!Object.keys(seat).some(key=>/card/.test(key)));}
  for(const hand of session.hands){assert.deepEqual(Object.keys(hand),['number','hero_start','hero_end','blinds','eliminations','note']);assert.equal(typeof hand.note,'string');}
});
test('exporter whitelist strips hostile private fields, full boards, showdown ranks and action diagnostics',()=>{
  const dir=mkdtempSync(join(tmpdir(),'poker-export-'));
  try{
    const out=join(dir,'out');mkdirSync(out);
    writeFileSync(join(dir,'manifest.json'),JSON.stringify({git_commit:'a'.repeat(40)}));
    const poison={hole_cards:['2c','3c'],showdown:'opponent private cards'};
    const observation={hole_cards:['Ah','Qh'],board:[],street:'preflop',my_seat:0,actor_seat:0,button_seat:1,pot_total:30,small_blind:10,big_blind:20,level:0,players_remaining:2,to_call:20,seats:[{seat:0,anon_id:'hero',stack:2000,active:true,position:'SB'},{seat:1,anon_id:'opponent',stack:2000,active:true,position:'BB',...poison}],action_history:[{seat_anon:'opponent',street:'preflop',kind:'raise',amount:20,...poison}],...{showdown:poison}};
    const decision={seed:1000000,bot_label:'hero',seat:0,hand_number:1,street:'preflop',position:'SB',stack_bucket:'100+',observation,legal_actions:{can_fold:true,can_call:true,call_amount:20,...poison},requested_action:{kind:'FOLD',amount:null,diag:poison},applied_action:{kind:'FOLD',amount:null,diag:poison},diagnostics:{reason:'fold',pot_odds:.4,...poison}};
    writeFileSync(join(dir,'decisions.jsonl.gz'),gzipSync(JSON.stringify(decision)+'\n'));
    writeFileSync(join(dir,'hands.jsonl.gz'),gzipSync(JSON.stringify({seed:1000000,hand_number:1,hero_seat:0,starting_stacks:[2000,2000],ending_stacks:[1990,2010],blinds:[10,20],eliminations:[],board:['2c','3c','4c'],...poison})+'\n'));
    const result=spawnSync('python3',[new URL('../tools/export_poker.py',import.meta.url).pathname,'--run',dir,'--out',out],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    const replay=JSON.parse(readFileSync(join(out,'poker-run.json'))),session=JSON.parse(readFileSync(join(out,'poker-session.json')));
    privateKeys(replay);privateKeys(session);
    assert.deepEqual(replay.hands[0].decisions[0].observation.hero_cards,['Ah','Qh']);assert.deepEqual(replay.hands[0].decisions[0].observation.board,[]);
    for(const file of ['poker-run.json','poker-session.json']){const text=readFileSync(join(out,file),'utf8');assert.ok(!text.includes('2c')&&!text.includes('3c'));}
  }finally{rmSync(dir,{recursive:true,force:true});}
});
