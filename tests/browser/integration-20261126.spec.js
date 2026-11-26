import {test,expect} from '@playwright/test';
async function ready(page){
 await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}));
 await page.addInitScript(()=>{
  Math.random=()=>0;window.__audioSources=[];window.__decodedAudio=[];
  const proto=AudioContext.prototype,decode=proto.decodeAudioData,create=proto.createBufferSource;
  proto.decodeAudioData=function(...args){return decode.apply(this,args).then(buffer=>{window.__decodedAudio.push(buffer.duration);return buffer})};
  proto.createBufferSource=function(){const node=create.call(this),entry={node,active:false};window.__audioSources.push(entry);const start=node.start.bind(node),stop=node.stop.bind(node);node.start=(...a)=>{entry.active=true;return start(...a)};node.stop=(...a)=>{entry.active=false;return stop(...a)};node.addEventListener('ended',()=>entry.active=false);return node};
 });
 await page.clock.install({time:new Date('2026-11-26T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-26T00:00:01Z'));await page.goto('/');
 await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
}
test('real audio buffers loop once, stop on settings and use selected chapter',async({page})=>{
 await ready(page);await page.clock.runFor(40);
 expect(await page.evaluate(()=>window.__decodedAudio.length)).toBe(28);
 expect(await page.evaluate(()=>window.__audioSources.filter(e=>e.active&&e.node.loop).length)).toBe(1);
 await page.locator('#settings-open').click();expect(await page.evaluate(()=>window.__audioSources.filter(e=>e.active).length)).toBe(0);
 await page.locator('#theme-select').selectOption('ch04');await expect(page.locator('#theme-select')).toBeEnabled();await page.getByRole('button',{name:'설정 완료'}).click();await page.clock.runFor(40);
 const loops=await page.evaluate(()=>window.__audioSources.filter(e=>e.active&&e.node.loop).map(e=>e.node.loopEnd));expect(loops).toHaveLength(1);expect(loops[0]).toBeGreaterThan(43);expect(loops[0]).toBeLessThan(44);
 await page.locator('#settings-open').click();await page.locator('#music').uncheck();await page.getByRole('button',{name:'설정 완료'}).click();await page.clock.runFor(100);
 expect(await page.evaluate(()=>window.__audioSources.filter(e=>e.active&&e.node.loop).length)).toBe(0);
});
test('descent, unsafe outcome, actor mask, result and retry retain the game timeline',async({page})=>{
 await ready(page);await page.clock.runFor(2700);const sprite=page.locator('.actor.player .character-art');
 await page.locator('#right').click();await page.clock.runFor(320);await expect(sprite).toHaveAttribute('data-pose','descent');
 await page.clock.runFor(140);await expect(sprite).toHaveAttribute('data-pose','hover');await expect(page.locator('.tile.cracking')).toHaveCount(1);
 await page.clock.runFor(1400);await expect(page.locator('.actor.player .actor-visual')).toHaveCSS('visibility','hidden');
 await page.clock.runFor(200);await expect(page.locator('#rescue-scene')).toBeVisible();await expect(page.locator('#rescue-scene .recovery-person')).toHaveCSS('visibility','hidden');
 await page.clock.runFor(260);await expect(page.locator('#rescue-scene .recovery-person')).toHaveCSS('visibility','visible');await expect(page.locator('#rescue-scene .rescue-cover')).toHaveCount(1);
 await page.screenshot({path:'test-results/integrated-rescue.png'});
 await page.clock.runFor(2300);await expect(page.locator('#result')).toBeVisible();await expect(page.locator('#result-text')).toContainText('STAGE 1 → STAGE 1');
 const active=await page.evaluate(()=>window.__audioSources.filter(e=>e.active));expect(active.length).toBeLessThanOrEqual(1);
 await page.locator('#retry').click();await expect(page.locator('#result')).toBeHidden();await expect(page.locator('#rescue-scene')).toBeHidden();
});
test('new title and dedicated edge clouds keep the center clear at 320px',async({page})=>{
 await page.setViewportSize({width:320,height:568});await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}));await page.goto('/');
 await expect(page.locator('.title-art')).toHaveAttribute('src',/integration-20261126\/ui\/title/);await expect(page.locator('.lobby-logo')).toHaveAttribute('src',/integration-20261126\/ui\/logo/);
 const startBox=await page.locator('#start').boundingBox();expect(startBox.y+startBox.height).toBeLessThanOrEqual(568);
 await page.screenshot({path:'test-results/integrated-title-320.png'});await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
 for(const theme of ['ch04','ch05']){await page.locator('#settings-open').click();await page.locator('#theme-select').selectOption(theme);await expect(page.locator('#theme-select')).toBeEnabled();await page.getByRole('button',{name:'설정 완료'}).click();await expect(page.locator('.back_cloud_3')).toHaveCount(0);await expect(page.locator('.front_left')).toHaveAttribute('src',new RegExp(`clouds/${theme}/front_left`));
 const boxes=await page.evaluate(()=>{const a=document.querySelector('#scene').getBoundingClientRect(),l=document.querySelector('.front_left').getBoundingClientRect(),r=document.querySelector('.front_right').getBoundingClientRect();return{left:l.right-a.left,right:r.left-a.left,width:a.width,page:document.documentElement.scrollWidth,viewport:innerWidth}});
 expect(boxes.left).toBeLessThan(boxes.width*.27);expect(boxes.right).toBeGreaterThan(boxes.width*.85);expect(boxes.page).toBeLessThanOrEqual(boxes.viewport);
 await page.screenshot({path:`test-results/integrated-${theme}-320.png`});}
});

test('timeout result and retry preserve the stage and actual failure reason',async({page})=>{await ready(page);await page.clock.runFor(40);await page.clock.fastForward(40000);await expect(page.locator('#result-title')).toHaveText('접수 시간이 끝났어요.');await expect(page.locator('#result-text')).toContainText('STAGE 1');await expect(page.locator('#next')).toBeHidden();await page.locator('#retry').click();await expect(page.locator('#progress')).toHaveText('0 / 8');});
