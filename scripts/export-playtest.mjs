import { build } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
const version=process.env.AFTER_YOU_VERSION || 'v0.9.3';
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
  const practiceDir=path.join(temp,'AFTER_YOU_Playtest_'+version);
  await fs.mkdir(practiceDir,{recursive:true});
  await fs.writeFile(path.join(practiceDir,'AFTER_YOU.html'),html);
  await fs.writeFile(path.join(practiceDir,'READ_ME_KO.txt'),'1. ZIP 파일을 다운로드합니다.\n2. 압축을 모두 풉니다.\n3. AFTER_YOU.html을 Chrome, Edge 또는 Safari에서 엽니다.\n\nGitHub의 HTML 원본 링크는 게임 대신 소스 코드를 표시할 수 있습니다.\n파일 미리보기에서는 게임이 실행되지 않을 수 있으니 실제 브라우저에서 열어 주세요.\n이 파일은 오프라인 연습판입니다. 온라인 순위는 서버 배포판에서 지원합니다.\n');
  const practiceZip=path.join(out,`AFTER_YOU_Playtest_${version}.zip`);
  await fs.rm(practiceZip,{force:true});
  execFileSync('zip',['-qr',practiceZip,path.basename(practiceDir)],{cwd:temp});
  // Normal static build for the online server; the exported practice HTML never submits records.
  await build({root});
  const name=`AFTER_YOU_Server_${version}`,pack=path.join(temp,name);
  await fs.mkdir(path.join(pack,'src'),{recursive:true});
  for(const dir of ['server','dist'])await fs.cp(path.join(root,dir),path.join(pack,dir),{recursive:true});
  for(const file of ['game.js','progression.js'])await fs.copyFile(path.join(root,'src',file),path.join(pack,'src',file));
  await fs.copyFile(path.join(root,'docs/ONLINE.md'),path.join(pack,'README.md'));
  await fs.writeFile(path.join(pack,'package.json'),JSON.stringify({name:'after-you-online',version:version.slice(1).split('.').length===2?version.slice(1)+'.0':version.slice(1),private:true,type:'module',engines:{node:'>=24'},scripts:{start:'node server/index.mjs'}},null,2));
  const zip=path.join(out,name+'.zip');await fs.rm(zip,{force:true});
  execFileSync('zip',['-qr',zip,name],{cwd:temp});
  console.log(`Exports written to ${out}`);
}finally{await fs.rm(temp,{recursive:true,force:true});}
