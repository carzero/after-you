import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const input=path.resolve(process.argv[2]||'/workspace/idle-review-input/AFTER_YOU_Idle_Review_v01');
const out=path.resolve(process.argv[3]||'downloads/AFTER_YOU_Idle_Review_v02.html');
const manifest=JSON.parse(await fs.readFile(path.join(input,'manifest.json'),'utf8'));
const images={},results=[];
const base={potato:[675,1100],pigeon:[625,1140],duck:[630,1110],rabbit:[640,1170]};
const anchors=Object.fromEntries(Object.entries(base).map(([c,a])=>[c,Object.fromEntries(['idle','blink','inhale'].map(s=>[s,[...a]]))]));
for(const e of manifest.assets){
 const file=path.resolve(input,e.path);if(!file.startsWith(input+path.sep))throw Error('Invalid asset path');
 const bytes=await fs.readFile(file),sha=crypto.createHash('sha256').update(bytes).digest('hex');
 if(sha!==e.sha256)throw Error(`Hash mismatch: ${e.path}`);
 const metadata=await sharp(bytes).metadata();if(metadata.width!==e.width||metadata.height!==e.height)throw Error(`Size mismatch: ${e.path}`);
 await sharp(bytes).raw().toBuffer();
 (images[e.character]??={})[e.state]='data:image/png;base64,'+bytes.toString('base64');
 results.push({path:e.path,sha256:sha,width:metadata.width,height:metadata.height,anchor:anchors[e.character][e.state]});
}
if(results.length!==12)throw Error('Expected 12 original PNGs');
let html=await fs.readFile(new URL('review.html',import.meta.url),'utf8');
const motion=(await fs.readFile(new URL('motion.mjs',import.meta.url),'utf8')).replace('export function','function');
html=html.replace('__DATA__',()=>JSON.stringify({images,anchors})).replace('__MOTION__',()=>motion);
await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,html);
await fs.writeFile(path.resolve('docs/idle-review/validation.json'),JSON.stringify({status:'review_only_not_game_integrated',originalPixelsPreserved:true,anchors:'manual_visual_draft_not_final',assets:results},null,2)+'\n');
console.log(`${results.length} PNG hashes, dimensions and decoding verified. Standalone review: ${out}`);
