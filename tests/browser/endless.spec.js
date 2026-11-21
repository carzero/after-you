import {test,expect} from '@playwright/test';
test('clear stage one then fall on stage two: return to one with shorter hint on ascent and preserved peak',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.clock.install({time:new Date('2026-11-18T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-18T00:00:01Z'));await page.goto('/');
  await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();await page.clock.runFor(2700);
  for(let i=0;i<8;i++){await page.locator('#left').click();await page.clock.runFor(440);}
  await expect(page.locator('#result-text')).toContainText('최고 8층');
  await page.locator('#next').click();await expect(page.locator('#hint-map span')).toHaveCount(10);await page.clock.runFor(2450);
  await page.locator('#right').click();await page.clock.runFor(1850);
  await expect(page.locator('#result-text')).toContainText('STAGE 2 → STAGE 1');await expect(page.locator('#result-text')).toContainText('최고 8층');
  await page.locator('#retry').click();await expect(page.locator('#stage-label')).toContainText('01');await expect(page.locator('#progress')).toHaveText('0 / 8');
  await page.clock.runFor(2700);await page.locator('#left').click();await page.clock.runFor(440);
  await expect(page.locator('.hud small').first()).toContainText('최고 8층');
  await page.locator('#pause').click();await page.locator('#pause-home').click();await page.locator('#leaderboard-open').click();
  await expect(page.locator('#ranking-status')).toContainText('다운로드판은 연습용');
  await page.screenshot({path:'test-results/endless-offline-scoreboard.png'});
});
