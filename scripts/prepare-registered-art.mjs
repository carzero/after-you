import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import sharp from 'sharp';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const input=path.resolve(process.argv[2]||'/workspace/pose-registration-v01/AFTER_YOU_Pose_Registration_v01');
const motion=path.resolve(process.argv[3]||'/workspace/three-characters-finish-v01/extracted/AFTER_YOU_Three_Characters_Finish_v01');
const registration=JSON.parse(await fs.readFile(input+'/registration.json','utf8'));
const manifest=JSON.parse(await fs.readFile(motion+'/manifest.json','utf8'));
const hashes=JSON.parse(await fs.readFile(motion+'/FILES.json','utf8'));const provenance=[];
async function convert(file,expected,dest){const bytes=await fs.readFile(file);const hash=crypto.createHash('sha256').update(bytes).digest('hex');if(hash!==expected)throw Error('Hash mismatch '+file);const target=root+'/assets/runtime/poses-20261124/'+dest+'.webp';await fs.mkdir(path.dirname(target),{recursive:true});await sharp(bytes).resize(512,512).webp({quality:90,alphaQuality:100}).toFile(target);provenance.push({file:dest,sha256:hash});}
for(const e of registration.assets)await convert(input+'/'+e.path,e.sha256,e.character+'/'+e.state);
for(const [id,spec] of Object.entries(manifest.characters))for(const name of ['blink_closed',...Array.from({length:7},(_,i)=>'breath_0'+i)]){const rel=id+'/motion/'+name+'.png';await convert(motion+'/'+rel,hashes.find(e=>e.path===rel).sha256,id+'/'+name);}
await fs.writeFile(root+'/src/pose-catalog.json',JSON.stringify({assets:registration.assets,motion:manifest.characters},null,2)+'\n');
await fs.writeFile(root+'/docs/idle-review/registered-art-provenance.json',JSON.stringify({status:'integrated_draft_user_approved',assets:provenance},null,2)+'\n');
