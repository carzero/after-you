import {test,expect} from '@playwright/test';
for(const id of ['pigeon','duck','rabbit'])test(`${id}: local breathing frames, pause, reduced motion and registered jump`,async({page})=>{
 await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}));
 await page.addInitScript(()=>{localStorage.setItem('after-you.save.v1',JSON.stringify({version:1,chapterComplete:true}));Math.random=()=>0});
 await page.clock.install({time:new Date('2026-11-24T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-24T00:00:01Z'));await page.goto('/');await page.locator(`[data-character="${id}"]`).click();await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
 const sprite=page.locator('.actor.player svg'),img=sprite.locator('image');await expect(sprite).toHaveAttribute('data-registered-pose','true');
 const first=await img.getAttribute('href'),top=await img.getAttribute('y');await page.clock.runFor(500);expect(await img.getAttribute('href')).not.toBe(first);expect(await img.getAttribute('y')).toBe(top);
 await page.locator('#settings-open').click();const frozen=await img.getAttribute('href');await page.clock.runFor(4000);expect(await img.getAttribute('href')).toBe(frozen);
 await page.locator('#reducedMotion').check();await expect(sprite).toHaveAttribute('data-frame','idle');await page.getByRole('button',{name:'설정 완료'}).click();await page.clock.runFor(2700);await expect(sprite).toHaveAttribute('data-frame','idle');
 await page.screenshot({path:`test-results/registered-${id}-idle.png`});
 await page.locator('#left').click();await expect(sprite).toHaveAttribute('data-pose','jump');await expect(sprite).toHaveAttribute('data-registered-pose','true');await expect(sprite).not.toHaveAttribute('data-idle-motion','true');
 await page.clock.runFor(440);await expect(sprite).toHaveAttribute('data-pose','land');await page.screenshot({path:`test-results/registered-${id}-land.png`});
});
