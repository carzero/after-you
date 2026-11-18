import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, chooseNpc, JUMP_MS, FALL_MS, STAGES } from '../src/game.js';
import { defaults, loadSave, recordWin, storeSave, SAVE_KEY } from '../src/save.js';
const setup = (options = {}) => { const g = new Game({ random: () => 0, ...options }); g.advance(g.config.hint); return g; };
test('fixed route survives moves; observed safe tiles remain safe and repeatable', () => {
  const g = new Game({random: () => 0}); const route = g.hintRoute(); route.fill(1);
  assert.deepEqual(g.hintRoute(), Array(8).fill(0));
  g.advance(g.config.hint); assert.equal(g.hintRoute(), null);
  g.move(0); g.advance(JUMP_MS); assert.equal(g.player.row, 0); assert.equal(g.observed[0][0], 'safe');
  const npc = g.actors[1]; g.move(0, npc); g.advance(JUMP_MS);
  assert.equal(npc.row, 0); assert.equal(npc.state, 'idle'); assert.equal(g.observed[0][0], 'safe');
});
test('duplicate movement input is rejected until landing', () => {
  const g = setup(); assert.equal(g.move(0), true); for (let i=0;i<30;i++) assert.equal(g.move(1), false);
  g.advance(JUMP_MS); assert.equal(g.player.row, 0); assert.equal(g.move(0), true);
});
test('NPC decision uses only public knowledge and its own random choice', () => {
  assert.equal(chooseNpc({row:0,observed:[['unknown','safe']],courage:0}, () => { throw Error('must follow observation'); }), 1);
  assert.equal(chooseNpc({row:0,observed:[['broken','unknown']],courage:0}, Math.random), 1);
  assert.equal(chooseNpc({row:0,observed:[['unknown','unknown']],courage:0}, () => .5), null);
  assert.equal(chooseNpc({row:0,observed:[['unknown','unknown']],courage:1}, () => .8), 1);
});
test('simultaneous arrivals resolve once without collision or changing the path', () => {
  const g = setup(); g.move(0); g.move(0, g.actors[1]); g.advance(JUMP_MS);
  assert.equal(g.player.row,0); assert.equal(g.actors[1].row,0);
  assert.equal(g.drainEvents().filter(e => e.type === 'land_safe').length,2);
  g.advance(10); assert.equal(g.drainEvents().filter(e => e.type === 'land_safe').length,0);
});
test('fall sequence emits crack, fall, rescue, finish once; retry has clean state', () => {
  const g = setup(); g.move(1); g.advance(JUMP_MS); assert.equal(g.phase,'rescuing'); assert.equal(g.move(0),false);
  g.advance(FALL_MS); assert.equal(g.result,'fall');
  assert.deepEqual(g.drainEvents().filter(e=>e.player).map(e=>e.type),['jump','tile_crack','fall','rescue','finish']);
  g.advance(10000); assert.equal(g.drainEvents().length,0);
  const fresh = setup(); assert.equal(fresh.player.row,-1); assert.equal(fresh.observed[0][1],'unknown');
});
test('pause freezes timer, NPC, hint and in-flight landing', () => {
  const g = new Game({ random:()=>0 }); g.setPaused(true); g.advance(99999); assert.equal(g.clock,0);
  g.setPaused(false); g.advance(g.config.hint); g.move(0); g.advance(100);
  const snapshot = JSON.stringify(g); g.setPaused(true); g.advance(10000); g.setPaused(false); assert.equal(JSON.stringify(g),snapshot);
  g.advance(320); assert.equal(g.player.row,0);
});
test('deadline wins exact landing tie; finish cannot be duplicated', () => {
  const g = setup(); for (const a of g.actors.slice(1)) a.state='rescued';
  for(let i=0;i<7;i++) {g.move(0);g.advance(JUMP_MS);}
  g.remaining = JUMP_MS; g.move(0); g.advance(JUMP_MS);
  assert.equal(g.result,'timeout'); assert.equal(g.player.row,6);
  assert.equal(g.drainEvents().filter(e=>e.type==='finish').length,1);
});
test('all three stages finish with expected row count and separate fresh paths', () => {
  STAGES.forEach((s,stage)=>{const g=setup({stage});for(let i=0;i<s.rows;i++){g.move(0);g.advance(JUMP_MS);}assert.equal(g.result,'success');assert.equal(g.activeTime,s.rows*JUMP_MS);});
});
test('save restores progression/settings, repairs corrupt or incompatible data, handles blocked storage', () => {
  let value=null; const storage={getItem:key=>{assert.equal(key,SAVE_KEY);return value;},setItem:(key,v)=>value=v};
  const save=defaults(); recordWin(save,0,5000); recordWin(save,0,6000); recordWin(save,2,7000); save.settings.sound=false;save.settings.reducedMotion=true;
  assert.equal(storeSave(storage,save),true);assert.deepEqual(loadSave(storage),save);assert.equal(save.best[0],5000);
  value='{oops';assert.deepEqual(loadSave(storage),defaults());
  value=JSON.stringify({version:8});assert.deepEqual(loadSave(storage),defaults());
  value=JSON.stringify({version:1,unlockedStage:999,best:{0:-2},settings:{sound:'false'}});assert.equal(loadSave(storage).unlockedStage,2);assert.equal(loadSave(storage).settings.sound,true);
  assert.equal(storeSave({setItem(){throw Error();}},save),false);assert.deepEqual(loadSave(null),defaults());
});
test('skipping rescue preserves the failure, emits once and cannot run while paused or playing', () => {
  const g=setup();assert.equal(g.skipRescue(),false);
  g.move(1);g.advance(JUMP_MS);const remaining=g.remaining,clock=g.clock;
  g.setPaused(true);assert.equal(g.skipRescue(),false);g.setPaused(false);
  assert.equal(g.skipRescue(),true);assert.equal(g.result,'fall');assert.equal(g.remaining,remaining);assert.equal(g.clock,clock);
  assert.equal(g.skipRescue(),false);g.advance(10000);
  const events=g.drainEvents().filter(e=>e.player);
  assert.equal(events.filter(e=>e.type==='rescue').length,1);assert.equal(events.find(e=>e.type==='rescue').skipped,true);
  assert.equal(events.filter(e=>e.type==='finish').length,1);assert.equal(events.some(e=>e.type==='land_safe'),false);
});
