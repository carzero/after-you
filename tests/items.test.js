import test from 'node:test';import assert from 'node:assert/strict';
import { Game } from '../src/game.js';import { seededRandom } from '../src/progression.js';import {validateCheckpoint} from '../server/validate-run.mjs';
function climb(g,count){const route=g.hintRoute();g.advance(g.config.hint);for(let i=0;i<count;i++){assert(g.move(route[i]));g.advance(420);}return route;}
test('sixth safe landing awards once, capacity is three and rollback does not farm',()=>{
 const g=new Game({random:()=>0});climb(g,6);assert.deepEqual(g.inventory,['memory']);assert.equal(g.rewardCeiling,0);
 const retry=new Game({random:()=>0,items:g.itemState()});climb(retry,6);assert.deepEqual(retry.inventory,['memory']);
 const full=new Game({stage:1,random:()=>0,items:{inventory:['memory','glasses','glasses'],rewardCeiling:0}});climb(full,6);assert.equal(full.inventory.length,3);assert.equal(full.rewardCeiling,1);
 const down=new Game({stage:0,random:()=>0,items:full.itemState()});climb(down,6);assert.equal(down.inventory.length,3);
 assert.deepEqual(new Game().inventory,[]);
});
test('NPC reaching sixth first removes reward; a fall on sixth gives none',()=>{
 const slow=new Game({random:()=>0});slow.advance(16000);climbAfterHint(slow);assert.equal(slow.inventory.length,0);
 function climbAfterHint(g){for(let i=0;i<6;i++){g.move(0);g.advance(420);}}
 const fall=new Game({random:()=>0});climb(fall,5);fall.move(1);fall.advance(420);assert.equal(fall.inventory.length,0);
});
test('hints consume one item, freeze actors while timer runs and respect pause',()=>{
 for(const kind of ['memory','glasses']){
 const g=new Game({random:()=>0,items:{inventory:[kind],rewardCeiling:-1}});climb(g,1);assert(g.useItem(0));assert.equal(g.inventory.length,0);assert(!g.useItem(0));assert(!g.move(0));
 const hint=g.hintRoute();assert.equal(hint.filter(v=>v!==null).length,kind==='memory'?7:1);assert.equal(hint[0],null);
 const before=g.remaining,actors=g.actors.map(a=>[a.row,a.state]);g.setPaused(true);g.advance(500);assert.equal(g.remaining,before);g.setPaused(false);g.advance(500);assert.equal(g.remaining,before-500);assert.deepEqual(g.actors.map(a=>[a.row,a.state]),actors);
 g.advance(500);assert.equal(g.hintRoute(),null);assert(g.move(0));
 }
});
test('checkpoint replay authoritatively earns, spends and carries items; rejects fabricated use',()=>{
 const run={stage:0,seed:123,peak:0,virtual:0,created:0},g=new Game({random:seededRandom(123)}),route=g.hintRoute(),moves=[];
 g.advance(g.config.hint);
 for(let i=0;i<g.config.rows;i++){
 if(i===6){assert.equal(g.inventory.length,1);moves.push({type:'item',index:0,at:g.clock});assert(g.useItem(0));g.advance(1000);}
 moves.push({at:g.clock,side:route[i]});assert(g.move(route[i]));g.advance(420);
 }
 const verified=validateCheckpoint(run,{moves,end:g.clock},100000);assert.equal(verified.outcome,'success');assert.deepEqual(verified.items,g.itemState());assert.equal(verified.items.rewardCeiling,0);
 assert.throws(()=>validateCheckpoint(run,{moves:[{type:'item',index:0,at:g.config.hint}],end:g.clock,inventory:['memory']},100000),/중복|이동/);
 const next=new Game({stage:1,random:()=>0,items:verified.items});climb(next,6);assert.equal(next.inventory.length,1);
});
test('tied sixth landing earns nothing and an item cannot extend the deadline',()=>{
 const tie=new Game({random:()=>0});climb(tie,5);assert(tie.move(0));Object.assign(tie.actors[1],{row:4,side:0,state:'jump',until:tie.player.until});tie.advance(420);assert.deepEqual(tie.inventory,[]);
 const g=new Game({random:()=>0,items:{inventory:['memory']}});g.advance(g.config.hint);g.remaining=500;assert(g.useItem(0));g.advance(1000);assert.equal(g.result,'timeout');assert.equal(g.hintRoute(),null);assert(!g.useItem(0));
});
test('NPC falling on the sixth wrong tile does not steal a safe landing reward',()=>{
 const g=new Game({random:()=>0});climb(g,5);Object.assign(g.actors[1],{row:5,side:1,state:'fall',until:g.clock+1400});assert(g.move(0));g.advance(420);assert.equal(g.inventory.length,1);
 const same=new Game({random:()=>0});climb(same,5);assert(same.move(0));Object.assign(same.actors[1],{row:4,side:1,state:'jump',until:same.player.until});same.advance(420);assert.equal(same.inventory.length,1);
});
