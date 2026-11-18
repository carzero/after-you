import {defineConfig} from '@playwright/test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default defineConfig({testDir:'./tests/online',outputDir:'test-results-online',workers:1,timeout:60000,use:{baseURL:'http://127.0.0.1:8791',launchOptions:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}},webServer:{command:'node server/index.mjs',url:'http://127.0.0.1:8791/api/health',env:{PORT:'8791',DATA_DIR:mkdtempSync(join(tmpdir(),'after-you-browser-'))},reuseExistingServer:false}});
