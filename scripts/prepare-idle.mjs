import sharp from 'sharp';import fs from 'node:fs/promises';import crypto from 'node:crypto';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const input=path.resolve(process.argv[2]||'/workspace/idle-review-input/AFTER_YOU_Idle_Review_v01');const entries=JSON.parse(await fs.readFile(input+'/manifest.json','utf8')).assets;const report=[];
for(const e of entries.filter(e=>e.state!=='inhale')){const bytes=await fs.readFile(input+'/'+e.path);if(crypto.createHash('sha256').update(bytes).digest('hex')!==e.sha256)throw Error(e.path);const dest=root+'/assets/runtime/idle-20261124/'+e.character+'/'+e.state+'.webp';await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true});await sharp(bytes).resize(512,512).webp({quality:90,alphaQuality:100}).toFile(dest);report.push({...e,runtimeStatus:'integrated_draft_user_approved',runtime:path.relative(root,dest),footAnchor:'src/idle-motion.js; manual visual draft'});}
await fs.writeFile(root+'/docs/idle-review/runtime-manifest.json',JSON.stringify(report,null,2)+'\n');
