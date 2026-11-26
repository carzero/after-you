import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url).pathname;
const html=await fs.readFile(root+'downloads/AFTER_YOU_Title_Concepts_v02.html','utf8');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const context=await browser.newContext({offline:true,viewport:{width:1400,height:1040}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
 await page.screenshot({path:root+'downloads/AFTER_YOU_Title_Concepts_v02.png',fullPage:true});
 for(const id of ['duel','office','edge']) {
  const phone=page.locator('.phone.'+id);await phone.locator('.start').click();assert(await phone.locator('.selection').isVisible());
  await phone.locator('[data-character="duck"]').click();assert.equal(await phone.locator('[data-character="duck"]').getAttribute('aria-pressed'),'true');
  await phone.locator('.close').click();assert(!(await phone.locator('.selection').isVisible()));
  await phone.locator('.rules').click();assert.match(await phone.locator('.selection-caption').textContent(),/이전 스테이지/);await phone.locator('.close').click();
 }
 await page.setViewportSize({width:320,height:568});await page.goto('about:blank');await page.setContent(html);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const id of ['duel','office','edge']) {
  const phone=page.locator('.phone.'+id);
  assert(await phone.evaluate(p=>{const r=p.getBoundingClientRect();return [...p.querySelectorAll('.start,.settings,.sub-actions button')].every(b=>{const t=b.getBoundingClientRect();return t.width>=44&&t.height>=44&&t.left>=r.left&&t.right<=r.right&&t.top>=r.top&&t.bottom<=r.bottom})}),id+' touch geometry');
  await phone.screenshot({path:root+`downloads/AFTER_YOU_Title_Concepts_v02_${id}_320.png`});
 }
 assert.deepEqual(errors,[]);console.log('Offline images, 3 character selectors, navigation and 320px touch geometry passed.');
} finally {await browser.close()}
