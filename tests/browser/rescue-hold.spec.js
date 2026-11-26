import {test,expect} from '@playwright/test';
test('fall is readable and cloud catch rests before result; pause freezes the rest',async({page})=>{
 await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}));await page.addInitScript(()=>{Math.random=()=>0});await page.clock.install({time:new Date('2026-11-26')});await page.clock.pauseAt(new Date('2026-11-26T00:00:01Z'));await page.goto('/');await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();await page.clock.runFor(2700);
 await page.locator('#right').click();await page.clock.runFor(1440);await expect(page.locator('.actor.player svg')).toHaveAttribute('data-pose','fall');await expect(page.locator('#result')).toBeHidden();
 await page.clock.runFor(900);await expect(page.locator('#rescue-scene .recovery-person')).toBeVisible();await expect(page.locator('.rescue-caption')).toHaveText('구름이 받아줬어요!');
 await page.clock.runFor(800);await expect(page.locator('#result')).toBeHidden();await expect(page.locator('#message')).toContainText('구름이 받아줬어요');
 await page.screenshot({path:'test-results/cloud-catch-rest.png'});
 await page.locator('#pause').click();await page.clock.runFor(3000);await expect(page.locator('#result')).toBeHidden();await page.locator('#resume').click();await page.clock.runFor(600);await expect(page.locator('#result')).toBeHidden();await page.clock.runFor(600);await expect(page.locator('#result')).toBeVisible();await expect(page.locator('#result-text')).toContainText('1구간 → 1구간');
});
