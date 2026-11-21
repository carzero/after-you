import test from 'node:test';
import assert from 'node:assert/strict';
import {themeForStage} from '../src/scene.js';
import {actingPose} from '../src/art-layout.js';
import {loadSave,SAVE_KEY} from '../src/save.js';
test('background cycle is cosmetic and preference overrides it without adding unlocks',()=>{
  for(const[stage,expected]of [[0,'ch01'],[4,'ch01'],[5,'ch02'],[10,'ch03'],[15,'ch04'],[20,'ch05'],[25,'ch01']])assert.equal(themeForStage(stage),expected);
  assert.equal(themeForStage(100,'ch04'),'ch04');assert.equal(themeForStage(-2),'ch01');
  const save=loadSave({getItem:key=>{assert.equal(key,SAVE_KEY);return JSON.stringify({version:1,theme:'ch05'});}});
  assert.equal(save.theme,'ch05');assert.equal(save.unlockedStage,0);assert.equal(save.chapterComplete,false);
});
test('acting follows public observations and preserves jump/landing/fall states',()=>{
  const unknown=[['unknown','unknown']],known=[['safe','unknown']];
  assert.equal(actingPose({state:'idle',player:false,row:-1},1000,undefined,unknown),'after_you');
  assert.equal(actingPose({state:'idle',player:false,row:-1},1000,undefined,known),'idle');
  assert.equal(actingPose({state:'idle',player:true,row:0},1200,1000,unknown),'relief');
  assert.equal(actingPose({state:'jump',player:true,row:0},1200,1000,unknown),'jump');
});
