import {test,expect} from '@playwright/test';
test('sprites remain mounted during idle, breathing, blinking, jump and descent',async({page})=>{
 await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}));
 await page.addInitScript(()=>{Math.random=()=>0});
 await page.clock.install({time:new Date('2026-11-26T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-26T00:00:01Z'));await page.goto('/');
 await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
 await page.evaluate(()=>{
  const actor=document.querySelector('.actor.player');window.__stableSprite={actor,svg:actor.querySelector('svg'),image:actor.querySelector('image'),removed:0};
  window.__spriteObserver=new MutationObserver(records=>{for(const r of records)for(const n of r.removedNodes)if(n===window.__stableSprite.actor||n.contains?.(window.__stableSprite.image))window.__stableSprite.removed++});
  window.__spriteObserver.observe(document.querySelector('#actors'),{subtree:true,childList:true});
 });
 await page.clock.runFor(3200);
 expect(await page.evaluate(()=>{const s=window.__stableSprite;return s.actor===document.querySelector('.actor.player')&&s.svg===s.actor.querySelector('svg')&&s.image===s.actor.querySelector('image')&&s.removed===0})).toBe(true);
 await page.locator('#left').click();await page.clock.runFor(320);await expect(page.locator('.actor.player svg')).toHaveAttribute('data-pose','descent');
 expect(await page.evaluate(()=>{const s=window.__stableSprite;return s.image===document.querySelector('.actor.player image')&&s.removed===0})).toBe(true);
 await page.clock.runFor(160);await expect(page.locator('#progress')).toHaveText('1 / 8');
 expect(await page.evaluate(()=>{const s=window.__stableSprite;return s.image===document.querySelector('.actor.player image')&&s.removed===0})).toBe(true);
 await page.screenshot({path:'test-results/stable-sprite-land.png'});
});
