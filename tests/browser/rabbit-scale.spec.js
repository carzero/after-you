import {test,expect} from '@playwright/test';
// Manually reviewed skull widths in source pixels, excluding ears and outstretched arms.
const head={idle:[382,1254],jump:[372,1254],descent:[350,1254],land:[367,1254],relief:[326,1536],inspect:[410,1024],after_you:[370,1199]};
test('rabbit keeps anatomical size through idle, jump, descent, land, relief and inspect',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route('**/api/**',r=>r.fulfill({status:404,body:'{}'}));await page.addInitScript(()=>{localStorage.setItem('after-you.save.v1',JSON.stringify({version:1,chapterComplete:true}));Math.random=()=>0});
 await page.clock.install({time:new Date('2026-11-27')});await page.clock.pauseAt(new Date('2026-11-27T00:00:01Z'));await page.goto('/');await page.locator('[data-character="rabbit"]').click();await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
 const sprite=page.locator('.actor.player svg');let baseline;
 async function check(pose){await expect(sprite).toHaveAttribute('data-pose',pose);const [skull,canvas]=head[pose];const width=await sprite.locator('image').getAttribute('width');const visible=skull*Number(width)/canvas;if(!baseline)baseline=visible;expect(visible/baseline,pose+' anatomical ratio').toBeGreaterThan(.9);expect(visible/baseline,pose+' anatomical ratio').toBeLessThan(1.1);await page.screenshot({path:`test-results/rabbit-scale-${pose}.png`});}
 await check('idle');await page.clock.runFor(2700);await page.locator('#left').click();await check('jump');await page.clock.runFor(310);await check('descent');await page.clock.runFor(150);await check('land');await page.clock.runFor(180);await check('relief');await page.clock.runFor(400);await check('inspect');
 await page.locator('#right').click();await page.clock.runFor(500);await expect(sprite).toHaveAttribute('data-pose','hover');await page.clock.runFor(650);await expect(sprite).toHaveAttribute('data-pose','fall');
});
