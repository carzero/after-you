import fs from 'node:fs/promises';
const root=new URL('../../',import.meta.url).pathname;
const paths={start:'integration-20261126/layers/ch01/start',potato_after:'art-20261121/characters/potato/after_you',pigeon_after:'art-20261121/characters/pigeon/after_you'},art={};
for(const[k,p]of Object.entries(paths))art[k]='data:image/webp;base64,'+(await fs.readFile(root+'assets/runtime/'+p+'.webp')).toString('base64');
await fs.writeFile(root+'downloads/AFTER_YOU_Title_A_Refined_v01.html',(await fs.readFile(new URL('index.html',import.meta.url),'utf8')).replace('__ART__',()=>JSON.stringify(art)));
