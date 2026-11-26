import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/index.mjs';
import { Game } from '../src/game.js';
import { seededRandom } from '../src/progression.js';
async function fixture(t){
  let now=100000;const dir=fs.mkdtempSync(path.join(os.tmpdir(),'after-you-api-'));
  const app=createApp({dataDir:dir,clock:()=>now,seed:()=>123});await new Promise(r=>app.listen(0,'127.0.0.1',r));
  t.after(async()=>{await new Promise(r=>app.close(r));fs.rmSync(dir,{recursive:true,force:true});});
  const base=`http://127.0.0.1:${app.address().port}`;
  async function request(route,body,headers={}){const r=await fetch(base+'/api/'+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
  return {request,dir,advance:ms=>now+=ms};
}
function replay(stage,seed,fall=false){
  const g=new Game({stage,random:seededRandom(seed)}),route=g.hintRoute(),moves=[];
  g.advance(g.config.hint);
  for(let i=0;i<g.config.rows;i++){
    const side=fall?1-route[i]:route[i];moves.push({at:g.clock,side});g.move(side);g.advance(420);
    if(fall){g.advance(1400);break;}
  }
  return {moves,end:g.clock};
}
test('two players share persisted rankings; server validates routes, rollback and idempotent retry',async t=>{
  const f=await fixture(t);
  const alice=(await f.request('runs',{name:'감자왕'})).data;
  const play=replay(0,alice.seed);f.advance(play.end);
  const first=await f.request(`runs/${alice.runId}/checkpoint`,{token:alice.token,...play,score:999999});
  assert.equal(first.status,200);assert.equal(first.data.peak,8);assert.equal(first.data.stage,1);
  const duplicate=await f.request(`runs/${alice.runId}/checkpoint`,{token:alice.token,...play});assert.deepEqual(duplicate.data,first.data);
  const falling=replay(1,first.data.seed,true);f.advance(falling.end);
  const back=await f.request(`runs/${alice.runId}/checkpoint`,{token:first.data.token,...falling});assert.equal(back.data.stage,0);assert.equal(back.data.peak,8);
  const bob=(await f.request('runs',{name:'비둘기왕'})).data;
  let current=bob;
  for(let stage=0;stage<2;stage++){
    const moves=replay(stage,current.seed);f.advance(moves.end);
    current=(await f.request(`runs/${bob.runId}/checkpoint`,{token:current.token,...moves})).data;
  }
  const list=(await f.request('leaderboard')).data.entries;assert.deepEqual(list.map(e=>[e.name,e.height]),[['비둘기왕',18],['감자왕',8]]);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.dir,'leaderboard.json'))).length,2);
  const restored=createApp({dataDir:f.dir});await new Promise(r=>restored.listen(0,'127.0.0.1',r));
  try{const r=await fetch(`http://127.0.0.1:${restored.address().port}/api/leaderboard`);assert.deepEqual((await r.json()).entries,list);}finally{await new Promise(r=>restored.close(r));}
});
test('API rejects impossible timing, malformed input, forged token and cross-origin submissions',async t=>{
  const f=await fixture(t),run=(await f.request('runs',{name:'도전자'})).data;
  const good=replay(0,run.seed);
  assert.equal((await f.request(`runs/${run.runId}/checkpoint`,{token:run.token,...good})).status,422);
  f.advance(good.end);
  assert.equal((await f.request(`runs/${run.runId}/checkpoint`,{token:'fake',...good})).status,409);
  assert.equal((await f.request(`runs/${run.runId}/checkpoint`,{...good})).status,400);
  const invalid={token:run.token,moves:[good.moves[0],{at:good.moves[0].at+1,side:0}],end:good.end};
  assert.equal((await f.request(`runs/${run.runId}/checkpoint`,invalid)).status,422);
  assert.equal((await f.request('runs',{name:'other'},{Origin:'https://elsewhere.example'})).status,403);
  assert.equal((await f.request('runs',{name:''})).status,400);assert.equal((await f.request('leaderboard')).data.entries.length,0);
});
test('API carries earned items, validates use and ignores client-provided inventory',async t=>{
 const f=await fixture(t),run=(await f.request('runs',{name:'쪽지왕'})).data;
 function play(snapshot,use){const g=new Game({stage:snapshot.stage,random:seededRandom(snapshot.seed),items:snapshot.items}),route=g.hintRoute(),moves=[];g.advance(g.config.hint);if(use){moves.push({at:g.clock,type:'item',index:0});assert(g.useItem(0));g.advance(1000);}for(let i=0;i<g.config.rows;i++){moves.push({at:g.clock,side:route[i]});g.move(route[i]);g.advance(420);}return{g,moves,end:g.clock};}
 const first=play(run,false);f.advance(first.end);
 const a=(await f.request(`runs/${run.runId}/checkpoint`,{token:run.token,moves:first.moves,end:first.end,items:{inventory:['memory','memory','memory']}})).data;
 assert.deepEqual(a.items,first.g.itemState());assert.equal(a.items.inventory.length,1);
 const second=play(a,true);f.advance(second.end);
 const b=await f.request(`runs/${run.runId}/checkpoint`,{token:a.token,moves:second.moves,end:second.end});assert.equal(b.status,200);assert.deepEqual(b.data.items,second.g.itemState());
 const duplicate=await f.request(`runs/${run.runId}/checkpoint`,{token:a.token,moves:second.moves,end:second.end});assert.deepEqual(duplicate.data,b.data);
});
