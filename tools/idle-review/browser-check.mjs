import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const html=await fs.readFile(new URL('../../downloads/AFTER_YOU_Idle_Review_v02.html',import.meta.url),'utf8');
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const c=await b.newContext({offline:true,viewport:{width:1100,height:1000}}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install();await p.setContent(html);
 await p.waitForFunction(()=>[...document.images].length===4&&[...document.images].every(i=>i.complete&&i.naturalWidth===1254));
 await p.locator('#pose').selectOption('blink');await p.waitForFunction(()=>document.querySelector('.pose-label').textContent.includes('blink'));
 const x=p.locator('.x').first();await x.fill('680');await x.dispatchEvent('change');assert.equal(await x.inputValue(),'680');
 const download=p.waitForEvent('download');await p.locator('#export').click();const file=await download;const anchorData=JSON.parse(await fs.readFile(await file.path(),'utf8'));assert.equal(anchorData.anchors.potato.blink[0],680);
 await p.locator('#play').click();await p.clock.runFor(1000);await p.locator('#play').click();const paused=await p.locator('#status').textContent();await p.clock.runFor(5000);assert.equal(await p.locator('#status').textContent(),paused);
 await p.locator('#reduce').check();await p.locator('#play').click();await p.clock.runFor(3150);assert((await p.locator('.pose-label').allTextContents()).every(t=>t.includes('idle')));
 await p.locator('#reduce').uncheck();await p.locator('#activity').selectOption('fall');await p.clock.runFor(1000);assert((await p.locator('.pose-label').allTextContents()).every(t=>t.includes('idle')));
 await p.locator('#activity').selectOption('idle');await p.locator('#play').click();await p.locator('#pose').selectOption('idle');await p.locator('#bg').selectOption('mint');
 await p.screenshot({path:'/workspace/idle-review-v02.png',fullPage:true});
 await p.setViewportSize({width:390,height:844});await p.locator('#size').click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('Offline review: all images, manual pose, anchor edit/export, pause, reduced motion, state priority and mobile layout passed.');
}finally{await b.close()}
