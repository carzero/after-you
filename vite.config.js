import { defineConfig } from 'vite';
import fs from 'node:fs';
const version=JSON.parse(fs.readFileSync(new URL('./package.json',import.meta.url),'utf8')).version;
export default defineConfig({plugins:[{name:'application-version',transformIndexHtml:html=>html.replace(/(<meta name="application-version" content=")[^"]+/,(_,prefix)=>prefix+version)}],server:{proxy:{'/api':{target:'http://127.0.0.1:8787',changeOrigin:false}}}});
