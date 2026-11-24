import {test,expect} from '@playwright/test';

test('draft art is loaded, poses freeze with pause, rescue layers reset on retry', async({page})=>{
  await page.setViewportSize({width:375,height:812});
  const failures=[];page.on('pageerror',e=>failures.push(e.message));
  page.on('response',r=>{if(r.url().includes('.webp')&&!r.ok()) failures.push(r.url());});
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.clock.install({time:new Date('2026-11-15T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-11-15T12:00:01Z'));await page.goto('/');
  await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
  await page.clock.runFor(2700);await expect(page.locator('#left')).toBeEnabled();
  const player=page.locator('.actor.player');
  await expect(player.locator('[data-pose="idle"]')).toBeVisible();
  await expect(player.locator('image')).toHaveAttribute('href',/idle-20261124\/potato\/idle.*webp/);
  await page.screenshot({path:'test-results/art-idle-375.png'});
  await page.locator('#left').click();await expect(player.locator('[data-pose="jump"]')).toBeVisible();
  await page.clock.runFor(440);await expect(player.locator('[data-pose="land"]')).toBeVisible();
  await expect(page.locator('#left')).toBeEnabled(); // visual landing does not lock input
  await page.locator('#right').click();await page.clock.runFor(450);
  await expect(page.locator('.tile.cracking')).toHaveCount(1);
  await page.clock.runFor(180);await expect(player.locator('[data-pose="hover"]')).toBeVisible();
  await page.locator('#pause').click();await page.clock.runFor(1000);await expect(player.locator('[data-pose="hover"]')).toBeVisible();
  await page.locator('#resume').click();await page.clock.runFor(430);
  await expect(player.locator('[data-pose="fall"]')).toBeVisible();await page.screenshot({path:'test-results/art-fall-375.png'});
  await page.clock.runFor(450);await expect(page.locator('#rescue-scene')).toBeVisible();
  await expect(page.locator('#rescue-scene [data-pose="rescued"]')).toBeVisible();
  await page.screenshot({path:'test-results/art-rescue-375.png'});
  await page.clock.runFor(400);await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#result-art .in-box')).toBeVisible();
  await expect(page.locator('#result-art .parcel-art')).toBeVisible();await page.screenshot({path:'test-results/art-result-375.png'});
  await page.setViewportSize({width:320,height:568});
  const resultBox = await page.locator('#result .panel').boundingBox();expect(resultBox.y).toBeGreaterThanOrEqual(0);expect(resultBox.y+resultBox.height).toBeLessThanOrEqual(568);
  await page.screenshot({path:'test-results/art-result-320.png'});
  await page.locator('#retry').click();await expect(page.locator('#rescue-scene')).toBeHidden();
  await expect(page.locator('#progress')).toHaveText('0 / 8');expect(failures).toEqual([]);
});
