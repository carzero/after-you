import { test, expect } from '@playwright/test';

test('mobile game: hint, guarded movement, pause, fall, retry and settings persist', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const errors = []; page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/');
  await expect(page.locator('#lobby-title')).toBeVisible();
  await expect(page.locator('[data-stage="1"]')).toBeDisabled();
  await page.getByRole('button', {name:'제가 먼저 갈게요 ↗'}).click();
  await expect(page.locator('.tile.hint')).toHaveCount(4);
  await expect(page.locator('#hint-map span')).toHaveCount(8);
  await expect(page.locator('#left')).toBeDisabled();
  await expect(page.locator('#left')).toBeEnabled({timeout:5000});
  await page.locator('#left').click();
  await expect(page.locator('#left')).toBeDisabled();
  await expect(page.locator('#progress')).toHaveText('1 / 8');
  await page.getByRole('button',{name:'일시정지', exact:true}).click();
  const before=await page.locator('#timer').textContent();await page.waitForTimeout(1200);expect(await page.locator('#timer').textContent()).toBe(before);
  await page.getByRole('button',{name:'다시 건너기',exact:true}).click();
  await page.locator('#right').click();
  await expect(page.locator('#result-title')).toHaveText('구름 회수 완료');
  await page.locator('#retry').click();await expect(page.locator('#progress')).toHaveText('0 / 8');
  await page.locator('#settings-open').click();await page.locator('#sound').uncheck();await page.locator('#reducedMotion').check();
  await page.getByRole('button',{name:'설정 완료'}).click();await page.reload();await page.locator('#settings-open').evaluate(el=>el.click());
  await expect(page.locator('#sound')).not.toBeChecked();await expect(page.locator('#reducedMotion')).toBeChecked();
  expect(errors).toEqual([]);
});

test('clear all stages, unlock characters, reload and mobile layout without scrolling', async ({ page }) => {
  test.setTimeout(60000); // Three real-time rounds include hints and 30 landing animations.
  await page.setViewportSize({width:320,height:568});await page.addInitScript(()=>{Math.random=()=>0;});await page.goto('/');
  await page.locator('#start').click();await expect(page.locator('#left')).toBeEnabled({timeout:5000});
  for(let i=0;i<8;i++){await page.locator('#left').click(); if(i<7) await expect(page.locator('#left')).toBeEnabled();}
  await expect(page.locator('#result-title')).toHaveText('무사히 도착했어요');
  for (const count of [10,12]) {
    await page.locator('#next').click();
    await expect(page.locator('#left')).toBeEnabled({timeout:5000});
    for(let i=0;i<count;i++){await page.locator('#left').click();if(i<count-1)await expect(page.locator('#left')).toBeEnabled();}
    await expect(page.locator('#result')).toBeVisible();
  }
  await expect(page.locator('#result-title')).toHaveText('구름 정거장 완료!');
  await page.locator('#unlock-show').click();await expect(page.locator('#unlock-panel>div')).toHaveCount(4);
  await page.screenshot({path:'test-results/integrated-unlock-320.png'});
  await expect(page.locator('#next')).toBeVisible();
  await page.locator('#next').click();
  await expect(page.locator('#stage-label')).toContainText('04');
  await expect(page.locator('#hint-map span')).toHaveCount(14);
  await page.reload();await expect(page.locator('[data-stage="1"]')).toBeEnabled();
  for (const id of ['potato','pigeon','duck','rabbit']) await expect(page.locator(`[data-character="${id}"]`)).toBeEnabled();
  await page.locator('#start').click();
  const dimensions=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,control:document.querySelector('#right').getBoundingClientRect().bottom}));
  expect(dimensions.sw).toBeLessThanOrEqual(dimensions.w);expect(dimensions.sh).toBeLessThanOrEqual(dimensions.h);expect(dimensions.control).toBeLessThan(dimensions.h);
  await expect(page.locator('#left')).toBeEnabled({timeout:5000});
  await page.screenshot({path:'test-results/mobile-320.png'});
});

test('tab background policy pauses until explicit resume', async ({page})=>{
  await page.goto('/');await page.locator('#start').click();await expect(page.locator('#left')).toBeEnabled({timeout:5000});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('#paused')).toBeVisible();const timer=await page.locator('#timer').textContent();await page.waitForTimeout(500);expect(await page.locator('#timer').textContent()).toBe(timer);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('#left')).toBeDisabled();await page.locator('#resume').click();await expect(page.locator('#left')).toBeEnabled();
});
