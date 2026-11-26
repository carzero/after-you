// Opaque-origin regression check: no HTTP server, storage or asset network required.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const html = await fs.readFile(new URL('../downloads/AFTER_YOU_Playtest_v0.9.1.html', import.meta.url), 'utf8');
assert(!/<script\s+type="module"/.test(html), 'Standalone must use a classic self-contained script');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const context = await browser.newContext({ offline: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.evaluate(() => { Math.random = () => 0; });
  await page.setContent(html);
  await page.locator('#start').click();
  await page.locator('#lobby').waitFor({ state: 'hidden' });
  await page.clock.runFor(2700);
  await page.locator('#left').click();
  await page.clock.runFor(440);
  assert.deepEqual(errors, []);
  await context.close();
  const disabled = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await disabled.newPage();
  await fallback.setContent(html);
  assert.match(await fallback.locator('#app').innerText(), /JavaScript가 필요/);
  await disabled.close();
  console.log('Standalone: offline opaque-origin startup and movement; JavaScript-disabled guidance passed.');
} finally { await browser.close(); }
