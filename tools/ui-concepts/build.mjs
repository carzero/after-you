import fs from 'node:fs/promises';import path from 'node:path';
const root=path.resolve(new URL('../..',import.meta.url).pathname);
const files={sky:'integration-20261126/layers/ch01/sky.webp',landmark:'integration-20261126/layers/ch01/landmark.webp',cloud:'integration-20261126/layers/ch01/back_cloud_1.webp',tile:'integration-20261126/layers/ch01/tile.webp',logo:'integration-20261126/ui/logo.webp',poster:'integration-20261126/ui/title.webp',finished:'poses-20261124/potato/finished.webp'};
for(const id of ['potato','pigeon','duck','rabbit']){files[id]=`poses-20261124/${id}/idle.webp`;files['portrait_'+id]=`art-20261121/ui/${id}.webp`}
const art={};for(const[k,file]of Object.entries(files))art[k]='data:image/webp;base64,'+(await fs.readFile(root+'/assets/runtime/'+file)).toString('base64');
let html=await fs.readFile(new URL('index.html',import.meta.url),'utf8');html=html.replace('__ART__',()=>JSON.stringify(art));
await fs.writeFile(root+'/downloads/AFTER_YOU_UI_Concepts_v01.html',html);console.log('Self-contained UI concepts built.');
