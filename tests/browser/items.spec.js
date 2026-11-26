import {test,expect} from '@playwright/test';
test('earn and use item, carry it through fall, reset on a new expedition at 320px',async({page})=>{
 await page.setViewportSize({width:320,height:568});await page.route('**/api/**',r=>r.fulfill({status:404,body:'{}'}));await page.addInitScript(()=>{Math.random=()=>0});
 await page.clock.install({time:new Date('2026-11-26')});await page.clock.pauseAt(new Date('2026-11-26T00:00:01Z'));await page.goto('/');await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();await page.clock.runFor(2700);
 for(let i=0;i<6;i++){await page.locator('#left').click();await page.clock.runFor(440);}
 await expect(page.locator('#item-status')).toContainText('기억 쪽지 획득');
 await expect(page.locator('[data-item-slot="0"]')).toBeEnabled();
 const button=await page.locator('[data-item-slot="0"]').boundingBox();expect(button.height).toBeGreaterThanOrEqual(44);
 await page.screenshot({path:'test-results/items-earned-320.png'});
 await page.locator('[data-item-slot="0"]').click();await expect(page.locator('#item-status')).toContainText('사용 중');await expect(page.locator('#left')).toBeDisabled();await expect(page.locator('#hint-map span')).toHaveCount(2);
 await page.screenshot({path:'test-results/items-hint-320.png'});await page.clock.runFor(1100);await expect(page.locator('#left')).toBeEnabled();
 for(let i=0;i<2;i++){await page.locator('#left').click();await page.clock.runFor(440);}await expect(page.locator('#result')).toBeVisible();await page.locator('#next').click();await expect(page.locator('#result')).toBeHidden();await page.clock.runFor(2500);
 for(let i=0;i<6;i++){await page.locator('#left').click();await page.clock.runFor(440);}await expect(page.locator('[data-item-slot="0"]')).toBeEnabled();await page.locator('#right').click();await page.clock.runFor(5000);await expect(page.locator('#result')).toBeVisible();await page.locator('#retry').click();await expect(page.locator('#result')).toBeHidden();await page.clock.runFor(2700);await expect(page.locator('[data-item-slot="0"]')).toBeEnabled();
 await page.locator('#pause').click();await page.locator('#pause-home').click();await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();await page.clock.runFor(2700);await expect(page.locator('[data-item-slot="0"]')).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
