import test from 'node:test';
import assert from 'node:assert/strict';
import { poseFor } from '../src/art-layout.js';
import { AudioBus } from '../src/audio.js';

test('art poses follow simulation boundaries and landing art never delays input', () => {
  const actor = {state:'fall',until:1400};
  for (const [time,expected] of [[0,'hover'],[149,'hover'],[150,'hover'],[599,'hover'],[600,'fall'],[1049,'fall'],[1050,'rescued'],[1399,'rescued']]) assert.equal(poseFor(actor,time),expected);
  assert.equal(poseFor({state:'idle'},100,0),'land');assert.equal(poseFor({state:'idle'},160,0),'idle');
  assert.equal(poseFor({state:'jump',until:420},110,0),'jump');assert.equal(poseFor({state:'finished'},110),'finished');
});
test('VFX follow simulation clocks and are omitted for reduced motion',async()=>{
  const {worldEffects}=await import('../src/art-layout.js');
  assert.deepEqual(worldEffects(100,100,undefined),[{kind:'takeoff',opacity:1}]);
  assert.deepEqual(worldEffects(260,100,undefined),[]);
  assert.equal(worldEffects(219,undefined,100)[0].kind,'landing');
  assert.deepEqual(worldEffects(220,undefined,100),[]);
  assert.deepEqual(worldEffects(100,100,100,true),[]);
});
