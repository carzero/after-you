import {test,expect} from '@playwright/test';
test('idle breathing and blinking freeze on pause; reduced motion and jumps take priority',async({page})=>{
 await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}));
 await page.addInitScript(()=>{Math.random=()=>0});
 await page.clock.install({time:new Date('2026-11-24T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-24T00:00:01Z'));await page.goto('/');await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
 const sprite=page.locator('.actor.player .character-art');await expect(sprite).toHaveAttribute('data-idle-motion','true');
 const initial=await sprite.locator('g').getAttribute('transform');await page.clock.runFor(900);expect(await sprite.locator('g').getAttribute('transform')).not.toBe(initial);
 await page.locator('#settings-open').click();const frozen=await sprite.locator('g').getAttribute('transform');await page.clock.runFor(5000);expect(await sprite.locator('g').getAttribute('transform')).toBe(frozen);
 await page.locator('#reducedMotion').check();await expect(sprite).toHaveAttribute('data-pose','idle');expect(await sprite.locator('g').getAttribute('transform')).toContain('scale(1 1)');await page.getByRole('button',{name:'설정 완료'}).click();await page.clock.runFor(2250);await expect(sprite).toHaveAttribute('data-pose','idle');
 await page.locator('#settings-open').click();await page.locator('#reducedMotion').uncheck();await page.getByRole('button',{name:'설정 완료'}).click();
 for(let i=0;i<80 && await sprite.getAttribute('data-pose')!=='blink';i++)await page.clock.runFor(50);
 await expect(sprite).toHaveAttribute('data-pose','blink');
 await page.locator('#left').click();await page.clock.runFor(20);await expect(sprite).toHaveAttribute('data-pose','jump');await expect(sprite).not.toHaveAttribute('data-idle-motion','true');
 await page.screenshot({path:'test-results/idle-motion-jump.png'});
});
