import {test,expect} from '@playwright/test';
test('independent browsers submit server-validated records and see the same shared board',async({browser})=>{
  const one=await browser.newContext({viewport:{width:390,height:844}}),two=await browser.newContext({viewport:{width:390,height:844}});
  try {
    const a=await one.newPage(),b=await two.newPage();
    const failures=[];for(const page of[a,b])page.on('pageerror',e=>failures.push(e.message));
    async function win(page,name,interrupt=false){
      if(interrupt){let first=true;await page.route('**/checkpoint',async route=>{if(first){first=false;await route.fetch();await route.abort('failed');}else await route.continue();});}
      await page.goto(process.env.AFTER_YOU_TEST_URL||'http://127.0.0.1:8791');await expect(page.locator('#online-mode')).toBeEnabled();await expect(page.locator('#online-mode')).toBeChecked();
      await page.locator('#nickname').fill(name);await page.locator('#start').click();await expect(page.locator('#lobby')).toBeHidden();
      const route=await page.locator('#hint-map span').allTextContents();expect(route.length).toBe(8);
      await expect(page.locator('#left')).toBeEnabled({timeout:5000});
      for(const arrow of route){const button=page.locator(arrow.includes('↖')?'#left':'#right');await button.click();}
      if(interrupt){await expect(page.locator('#network-retry')).toBeVisible();await expect(page.locator('#next')).toBeDisabled();await page.locator('#network-retry').click();}
      await expect(page.locator('#online-result')).toContainText('최고 8층 기록 확인');
      await expect(page.locator('#next')).toBeEnabled();
    }
    await win(a,'구름감자',true);await win(b,'구름비둘기');
    await a.locator('#result-leaderboard').click();await expect(a.locator('#rankings li')).toHaveCount(2);
    await expect(a.locator('#rankings')).toContainText('구름감자');await expect(a.locator('#rankings')).toContainText('구름비둘기');
    await b.locator('#result-leaderboard').click();await expect(b.locator('#rankings li')).toHaveCount(2);
    await a.screenshot({path:'test-results/online-shared-scoreboard.png'});
    await a.locator('#leaderboard-close').click();await a.locator('#next').click();await expect(a.locator('#hint-map span')).toHaveCount(10);
    const nextRoute=await a.locator('#hint-map span').allTextContents();await expect(a.locator('#left')).toBeEnabled({timeout:5000});
    await a.locator(nextRoute[0].includes('↖')?'#right':'#left').click();
    await expect(a.locator('#online-result')).toContainText('최고 8층 기록 확인');
    await expect(a.locator('#result-text')).toContainText('STAGE 2 → STAGE 1');
    await a.locator('#retry').click();await expect(a.locator('#stage-label')).toContainText('01');
    expect(failures).toEqual([]);
  }finally{await one.close();await two.close();}
});
