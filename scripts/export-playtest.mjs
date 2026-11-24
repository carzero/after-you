import { build } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
const version=process.env.AFTER_YOU_VERSION || 'v0.7';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const out=path.resolve(process.argv[2]||'/workspace/shared/downloads');await fs.mkdir(out,{recursive:true});
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'after-you-export-'));
try {
  const standalone=path.join(temp,'standalone');
  await build({root,build:{outDir:standalone,emptyOutDir:true,assetsInlineLimit:Infinity,cssCodeSplit:false,rollupOptions:{output:{inlineDynamicImports:true,format:'iife'}}}});
  let html=await fs.readFile(path.join(standalone,'index.html'),'utf8');
  const script=html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/)[1];
  const style=html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/)[1];
  const js=await fs.readFile(path.join(standalone,script),'utf8'),css=await fs.readFile(path.join(standalone,style),'utf8');
  html=html.replace('<div id="app"></div>', '<div id="app"><main style="padding:32px;font-family:sans-serif"><h1>먼저 가세요 · AFTER YOU</h1><p id="startup-status">게임을 불러오는 중입니다. 이 안내가 계속 보이면 파일 미리보기 대신 Chrome·Edge·Safari 브라우저에서 열어 주세요.</p><noscript>게임 실행에는 JavaScript가 필요합니다.</noscript></main></div>');
  html=html.replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/,()=>'<script>document.addEventListener("DOMContentLoaded",function(){'+js.replaceAll('</script','<\\/script')+'});</script>');
  html=html.replace(/<link[^>]+href="[^"]+\.css"[^>]*>/,()=>'<style>'+css+'</style>');
  await fs.writeFile(path.join(out,`AFTER_YOU_Playtest_${version}.html`),html);
  // Normal static build for the online server; the exported practice HTML never submits records.
  await build({root});
  const name=`AFTER_YOU_Server_${version}`,pack=path.join(temp,name);
  await fs.mkdir(path.join(pack,'src'),{recursive:true});
  for(const dir of ['server','dist'])await fs.cp(path.join(root,dir),path.join(pack,dir),{recursive:true});
  for(const file of ['game.js','progression.js'])await fs.copyFile(path.join(root,'src',file),path.join(pack,'src',file));
  await fs.copyFile(path.join(root,'docs/ONLINE.md'),path.join(pack,'README.md'));
  await fs.writeFile(path.join(pack,'package.json'),JSON.stringify({name:'after-you-online',version:version.slice(1)+'.0',private:true,type:'module',engines:{node:'>=24'},scripts:{start:'node server/index.mjs'}},null,2));
  const zip=path.join(out,name+'.zip');await fs.rm(zip,{force:true});
  execFileSync('zip',['-qr',zip,name],{cwd:temp});
  console.log(`Exports written to ${out}`);
}finally{await fs.rm(temp,{recursive:true,force:true});}
