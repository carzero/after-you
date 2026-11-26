import {test,expect} from '@playwright/test';
async function ready(page) {
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.clock.install({time:new Date('2026-11-18T00:00:00Z')});
  await page.clock.pauseAt(new Date('2026-11-18T00:00:01Z'));await page.goto('/');
  await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
  await page.clock.runFor(2700);
}
test('second fall can skip once without unlocks; pause, retry and input remain consistent',async({page})=>{
  await ready(page);await page.locator('#right').click();await page.clock.runFor(500);
  await expect(page.locator('#skip-rescue')).toBeHidden();await page.clock.runFor(4000);
  await expect(page.locator('#result')).toBeVisible();await page.locator('#retry').click();await page.clock.runFor(2700);
  await page.locator('#right').click();await page.clock.runFor(500);await expect(page.locator('#skip-rescue')).toBeVisible();
  await page.locator('#pause').click();await expect(page.locator('#skip-rescue')).toBeHidden();await page.clock.runFor(2000);
  await page.locator('#resume').click();await page.clock.runFor(20);await expect(page.locator('#skip-rescue')).toBeVisible();
  await page.screenshot({path:'test-results/replay-skip.png'});
  await page.locator('#skip-rescue').click();await expect(page.locator('#result-title')).toHaveText('구름 회수 완료');
  await expect(page.locator('#skip-rescue')).toBeHidden();await expect(page.locator('#next')).toBeHidden();
  await page.clock.runFor(3000);await expect(page.locator('#result')).toBeVisible();
  await page.locator('#retry').click();await expect(page.locator('#progress')).toHaveText('0 / 8');await expect(page.locator('#rescue-scene')).toBeHidden();
  await page.clock.runFor(2700);await page.locator('#left').click();await page.clock.runFor(440);await expect(page.locator('#progress')).toHaveText('1 / 8');
});
test('system motion preference removes actual rotation and follows preference changes',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await expect(page.locator('body')).toHaveClass(/reduced-motion/);
  await page.locator('#right').click();await page.clock.runFor(1150);
  const actor=page.locator('.actor.player');await expect(actor.locator('[data-pose="fall"]')).toBeVisible();
  const rotation=()=>actor.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).b);
  expect(await rotation()).toBe(0);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.runFor(20);
  await expect(page.locator('body')).not.toHaveClass(/reduced-motion/);
  await page.clock.runFor(20);expect(Math.abs(await rotation())).toBeGreaterThan(.01);
  await page.locator('#settings-open').click();await page.locator('#reducedMotion').check();await page.getByRole('button',{name:'설정 완료'}).click();await page.clock.runFor(20);
  expect(await rotation()).toBe(0);
});
test('portrait and landscape keep game controls inside the viewport',async({page})=>{
  await page.goto('/');await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
  for(const [width,height] of [[320,568],[375,667],[390,844],[568,320],[844,390]]) {
    await page.setViewportSize({width,height});
    const rect=await page.locator('#right').boundingBox();expect(rect.y+rect.height).toBeLessThanOrEqual(height);expect(rect.height).toBeGreaterThanOrEqual(44);
    const metrics=await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}));expect(metrics.w).toBeLessThanOrEqual(width);expect(metrics.h).toBeLessThanOrEqual(height);
    if(width===844)await page.screenshot({path:'test-results/replay-landscape.png'});
  }
});
