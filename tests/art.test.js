import test from 'node:test';
import assert from 'node:assert/strict';
import { poseFor } from '../src/art-layout.js';
import { AudioBus } from '../src/audio.js';

test('art poses follow simulation boundaries and landing art never delays input', () => {
  const actor = {state:'fall',until:1400};
  for (const [time,expected] of [[0,'land'],[149,'land'],[150,'hover'],[599,'hover'],[600,'fall'],[1049,'fall'],[1050,'rescued'],[1399,'rescued']]) assert.equal(poseFor(actor,time),expected);
  assert.equal(poseFor({state:'idle'},100,0),'land');assert.equal(poseFor({state:'idle'},160,0),'idle');
  assert.equal(poseFor({state:'jump'},110,0),'jump');assert.equal(poseFor({state:'finished'},110),'finished');
});
test('rescue and delayed result cues can finish; reset stops even scheduled sounds', () => {
  const nodes=[];
  const bus = new AudioBus({sound:true,music:false});
  bus.context={state:'running',currentTime:10,destination:{},createOscillator(){const n={frequency:{setValueAtTime(hz,t){n.hz=hz;n.at=t;}},connect(target){return target;},disconnect(){},start(){},stop(at){n.stops.push(at);},stops:[]};nodes.push(n);return n;},createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}};
  bus.event('rescue');bus.event('finish',.14);
  assert.equal(nodes[0].hz,270);assert.equal(nodes[1].hz,740);assert.ok(nodes[1].at-nodes[0].at>.12);
  assert.deepEqual(nodes[0].stops,[10.12]);
  bus.stop();assert.equal(bus.nodes.size,0);assert.equal(nodes[1].stops.at(-1),undefined);
  bus.settings.sound=false;bus.event('rescue');assert.equal(nodes.length,2);
});
test('VFX follow simulation clocks and are omitted for reduced motion',async()=>{
  const {worldEffects}=await import('../src/art-layout.js');
  assert.deepEqual(worldEffects(100,100,undefined),[{kind:'takeoff',opacity:1}]);
  assert.deepEqual(worldEffects(260,100,undefined),[]);
  assert.equal(worldEffects(219,undefined,100)[0].kind,'landing');
  assert.deepEqual(worldEffects(220,undefined,100),[]);
  assert.deepEqual(worldEffects(100,100,100,true),[]);
});
