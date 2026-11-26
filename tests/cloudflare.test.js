import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import worker,{RankingStore} from '../cloudflare/worker.js';import {Game} from '../src/game.js';import {seededRandom} from '../src/progression.js';
function fixture(t){let now=100000;t.mock.method(Date,'now',()=>now);const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 const ctx={storage:{sql:{exec(sql,...args){const statement=db.prepare(sql);const rows=/^\s*SELECT/i.test(sql)?statement.all(...args):(statement.run(...args),[]);return{toArray:()=>rows}}},transactionSync(fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}}};
 let store=new RankingStore(ctx);return{advance:ms=>now+=ms,restart:()=>store=new RankingStore(ctx),async request(route,body,extra={}){const request=new Request('https://after-you.test/api/'+route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Afteryou-Client':'client',...extra},body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)});const response=await store.fetch(request);return{status:response.status,data:await response.json()}}};}
function replay(stage,seed,fall=false){const g=new Game({stage,random:seededRandom(seed)}),route=g.hintRoute(),moves=[];g.advance(g.config.hint);for(let i=0;i<g.config.rows;i++){const side=fall?1-route[i]:route[i];moves.push({at:g.clock,side});g.move(side);g.advance(420);if(fall){g.advance(1400);break}}return{moves,end:g.clock};}
test('Workers persists shared ranking, active runs and idempotent replies across object restarts',async t=>{
 const f=fixture(t),alice=(await f.request('runs',{name:'감자왕'})).data,first=replay(0,alice.seed);f.advance(first.end);
 const checkpoint={token:alice.token,...first,score:999999};const response=await f.request(`runs/${alice.runId}/checkpoint`,checkpoint);assert.equal(response.status,200);assert.equal(response.data.peak,8);assert.equal(response.data.stage,1);
 f.restart();assert.deepEqual((await f.request(`runs/${alice.runId}/checkpoint`,checkpoint)).data,response.data);
 const fall=replay(1,response.data.seed,true);f.advance(fall.end);const back=await f.request(`runs/${alice.runId}/checkpoint`,{token:response.data.token,...fall});assert.equal(back.data.stage,0);assert.equal(back.data.peak,8);
 let bob=(await f.request('runs',{name:'비둘기왕'})).data;const id=bob.runId;for(let i=0;i<2;i++){const play=replay(i,bob.seed);f.advance(play.end);bob=(await f.request(`runs/${id}/checkpoint`,{token:bob.token,...play})).data;}
 f.restart();assert.deepEqual((await f.request('leaderboard')).data.entries.map(e=>[e.name,e.height]),[['비둘기왕',18],['감자왕',8]]);
 assert.equal((await f.request('health')).data.storage,'durable-object-sqlite');
});
test('Workers rejects forged scores, accelerated clocks, invalid JSON and cross-origin requests atomically',async t=>{
 const f=fixture(t),run=(await f.request('runs',{name:'도전자'})).data,play=replay(0,run.seed);
 assert.equal((await f.request(`runs/${run.runId}/checkpoint`,{token:run.token,...play})).status,422);f.advance(play.end);
 assert.equal((await f.request(`runs/${run.runId}/checkpoint`,{token:'fake',...play})).status,409);
 assert.equal((await f.request('runs','{')).status,400);assert.equal((await f.request('runs',{name:'침입자'},{Origin:'https://other.test'})).status,403);
 assert.equal((await f.request('runs',{name:'x',padding:'x'.repeat(65000)})).status,413);
 assert.deepEqual((await f.request('leaderboard')).data.entries,[]);
 assert.equal((await f.request(`runs/${run.runId}/checkpoint`,{token:run.token,...play})).data.peak,8);
});
test('Workers rate limit and session expiry survive a restart',async t=>{
 const f=fixture(t);let first;for(let i=0;i<60;i++){const result=await f.request('runs',{name:'도전자'});assert.equal(result.status,201);first??=result.data;}
 f.restart();assert.equal((await f.request('runs',{name:'초과'})).status,429);f.advance(3600001);
 assert.equal((await f.request(`runs/${first.runId}/checkpoint`,{token:first.token,moves:[],end:1})).status,410);
 assert.equal((await f.request('runs',{name:'새 도전'})).status,201);
});
test('edge serves assets and overwrites spoofed rate keys with hashed edge IP',async()=>{
 let key;const env={ASSETS:{fetch:async()=>new Response('asset')},RANKINGS:{idFromName:name=>name,get:()=>({fetch:async request=>{key=request.headers.get('X-Afteryou-Client');return new Response('ok')}})}};
 assert.equal(await(await worker.fetch(new Request('https://after-you.test/'),env)).text(),'asset');
 const response=await worker.fetch(new Request('https://after-you.test/api/health',{headers:{'CF-Connecting-IP':'192.0.2.1','X-Afteryou-Client':'spoofed'}}),env);assert.equal(response.status,200);assert.match(key,/^[0-9a-f]{64}$/);assert.notEqual(key,'spoofed');
 assert.equal((await worker.fetch(new Request('https://after-you.test/api/runs',{method:'POST',headers:{Origin:'https://elsewhere.test'},body:'{}'}),env)).status,403);
});
