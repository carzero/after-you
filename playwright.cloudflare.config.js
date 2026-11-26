import {defineConfig} from '@playwright/test';
import {mkdtempSync,mkdirSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
process.env.AFTER_YOU_TEST_URL='http://127.0.0.1:8792';
const sandbox=mkdtempSync(join(tmpdir(),'after-you-cf-'));mkdirSync(join(sandbox,'config','.wrangler'),{recursive:true});
export default defineConfig({testDir:'./tests/online',outputDir:'test-results-cloudflare',workers:1,timeout:90000,
 use:{baseURL:'http://127.0.0.1:8792',launchOptions:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}},
 webServer:{command:`npx wrangler dev --local --ip 127.0.0.1 --port 8792 --persist-to ${join(sandbox,'state')}`,url:'http://127.0.0.1:8792/api/health',timeout:90000,reuseExistingServer:false,
 env:{AFTER_YOU_TEST_URL:'http://127.0.0.1:8792',XDG_CONFIG_HOME:join(sandbox,'config'),WRANGLER_LOG_PATH:join(sandbox,'wrangler.log'),WRANGLER_SEND_METRICS:'false'}},
});
