import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { stageConfig, restartStage, floorsBefore, heightReached } from '../src/progression.js';
test('endless stages get shorter hints, remain playable after stage three and have a minimum hint',()=>{
  for(let i=1;i<11;i++)assert.ok(stageConfig(i).hint<stageConfig(i-1).hint);
  assert.equal(stageConfig(999).hint,600);assert.equal(stageConfig(999).rows,20);
  const g=new Game({stage:20,random:()=>0});g.advance(g.config.hint);
  for(let i=0;i<g.config.rows;i++){g.move(0);g.advance(420);}
  assert.equal(g.result,'success');assert.equal(g.stage,20);
});
test('fall goes one stage back; first stage has a floor; timeout retries; cleared height cannot be farmed',()=>{
  assert.equal(restartStage(2,'fall'),1);assert.equal(restartStage(0,'fall'),0);assert.equal(restartStage(2,'timeout'),2);assert.equal(restartStage(2,'success'),3);
  assert.equal(floorsBefore(3),30);assert.equal(floorsBefore(7),98);
  let peak=30;const g=new Game({stage:1,random:()=>0});g.advance(g.config.hint);g.move(1);g.advance(1820);
  assert.equal(heightReached(g),8);peak=Math.max(peak,heightReached(g));assert.equal(peak,30);
});
