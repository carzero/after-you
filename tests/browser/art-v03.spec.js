import {test,expect} from '@playwright/test';
for(const id of ['duck','rabbit'])test(`${id}: aspect-correct art, VFX, rescue and retry on a 320px phone`,async({page})=>{
  await page.setViewportSize({width:320,height:568});
  await page.route('**/api/**',route=>route.fulfill({status:404,contentType:'application/json',body:'{}'}));
  await page.addInitScript(()=>{localStorage.setItem('after-you.save.v1',JSON.stringify({version:1,chapterComplete:true}));Math.random=()=>0;});
  await page.clock.install({time:new Date('2026-11-18T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-18T00:00:01Z'));await page.goto('/');
  await page.locator(`button[data-character="${id}"]`).click();await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
  await page.clock.runFor(2700);
  const player=page.locator('.actor.player');await expect(player.locator('svg')).toHaveAttribute('data-art-character',id);
  const ratio=await player.locator('image').evaluate(el=>+el.getAttribute('width')/+el.getAttribute('height'));
  // The approved idle pack uses square 1254px originals for both characters.
  expect(ratio).toBeCloseTo(1,5);
  await expect(player.locator('image')).toHaveAttribute('href',new RegExp(`idle-20261124/${id}/idle.*webp`));
  await page.screenshot({path:`test-results/v03-${id}-idle-320.png`});
  await page.locator('#left').click();await expect(page.locator('#world-effects .takeoff')).toHaveCount(1);
  await page.clock.runFor(440);await expect(player.locator('[data-pose="land"]')).toBeVisible();
  await expect(page.locator('#world-effects .landing')).toHaveCount(1);await expect(page.locator('#left')).toBeEnabled();
  if(id==='duck'){
    const landRatio=await player.locator('image').evaluate(el=>+el.getAttribute('width')/+el.getAttribute('height'));
    expect(landRatio).toBeCloseTo(1312/1199,5);
  }
  const effectBefore=await page.locator('#world-effects').innerHTML();await page.locator('#pause').click();await page.clock.runFor(1000);expect(await page.locator('#world-effects').innerHTML()).toBe(effectBefore);
  await page.locator('#resume').click();await page.clock.runFor(180);await expect(page.locator('#world-effects .landing')).toHaveCount(0);
  await page.locator('#right').click();await page.clock.runFor(1150);await expect(player.locator('[data-pose="fall"]')).toBeVisible();
  await page.screenshot({path:`test-results/v03-${id}-fall-320.png`});
  await page.clock.runFor(450);await expect(page.locator('#rescue-scene .recovery-effect')).toBeVisible();
  await page.clock.runFor(350);await expect(page.locator('#result-art .parcel-art')).toBeVisible();
  await page.screenshot({path:`test-results/v03-${id}-rescue-320.png`});
  await page.locator('#retry').click();await expect(page.locator('#world-effects')).toBeEmpty();await expect(page.locator('#rescue-scene')).toBeHidden();
  await page.locator('#settings-open').click();await page.locator('#reducedMotion').check();await page.getByRole('button',{name:'설정 완료'}).click();
  await page.clock.runFor(2700);await page.locator('#left').click();await expect(page.locator('#world-effects')).toBeEmpty();
});
