import {test,expect} from '@playwright/test';
async function ready(page){
  await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}));
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.clock.install({time:new Date('2026-11-21T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-21T00:00:01Z'));await page.goto('/');
  await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
}
test('five layered themes preserve hidden tile art and settings restore at 320px',async({page})=>{
  await page.setViewportSize({width:320,height:568});const requested=[];page.on('request',r=>{if(r.resourceType()==='image'&&r.url().includes('.webp'))requested.push(r.url());});await ready(page);
  expect(requested.some(url=>/layers\/ch02\/sky/.test(url))).toBe(false);
  await page.clock.runFor(2700);
  const before=await page.locator('#timer').textContent();
  for(const theme of ['ch01','ch02','ch03','ch04','ch05']){
    await page.locator('#settings-open').click();await page.locator('#theme-select').selectOption(theme);await expect(page.locator('#theme-select')).toBeEnabled();
    await expect(page.locator('#scene')).toHaveAttribute('data-theme',theme);
    await page.getByRole('button',{name:'설정 완료'}).click();await page.clock.runFor(20);
    const tiles=await page.locator('.tile[data-row="0"] img').evaluateAll(imgs=>imgs.map(img=>img.getAttribute('src')));
    expect(tiles).toHaveLength(2);expect(tiles[0]).toBe(tiles[1]);
    await page.screenshot({path:`test-results/integration-${theme}-320.png`});
  }
  expect(+await page.locator('#timer').textContent()).toBeGreaterThanOrEqual(+before-1);
  await page.reload();await page.locator('#settings-open').evaluate(el=>el.click());await expect(page.locator('#theme-select')).toHaveValue('ch05');
});
test('failed background load keeps the previous scene and allows continued play',async({page})=>{
  await page.route('**/layers/ch03/sky.webp*',r=>r.request().resourceType()==='image'?r.abort():r.continue());await ready(page);await page.clock.runFor(2700);
  await page.locator('#settings-open').click();await page.locator('#theme-select').selectOption('ch03');
  await expect(page.locator('#theme-status')).toContainText('이전 배경');await expect(page.locator('#scene')).toHaveAttribute('data-theme','ch01');
  await expect(page.locator('#theme-select')).toHaveValue('auto');await page.getByRole('button',{name:'설정 완료'}).click();await page.clock.runFor(20);
  await page.locator('#left').click();await page.clock.runFor(480);await expect(page.locator('#progress')).toHaveText('1 / 8');
});
test('corrected sprites and single composite parcel replace superseded artwork',async({page})=>{
  await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}));
  await page.addInitScript(()=>{localStorage.setItem('after-you.save.v1',JSON.stringify({version:1,chapterComplete:true}));Math.random=()=>0;});
  await page.clock.install({time:new Date('2026-11-21T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-21T00:00:01Z'));await page.goto('/');
  await page.locator('button[data-character="duck"]').click();await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();await page.clock.runFor(2700);
  await page.locator('#right').click();await expect(page.locator('.actor.player image')).toHaveAttribute('href',/poses-20261124\/duck\/jump.webp/);
  await page.clock.runFor(1850);await expect(page.locator('#result-art .parcel-art')).toHaveCount(1);await expect(page.locator('#result-art .recovery-person')).toHaveCount(0);
  await page.screenshot({path:'test-results/integration-parcel.png'});
});
