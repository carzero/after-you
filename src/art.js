import { characterLayout, characterRegistration } from './art-layout.js';
import { catalog } from './art-catalog.js';
const artUrls=import.meta.glob('../assets/runtime/art-20261121/**/*.webp',{eager:true,query:'?url',import:'default'});
const iconSources=import.meta.glob('../assets/runtime/art-20261121/icons/*.svg',{eager:true,query:'?raw',import:'default'});
export const names={potato:'직장인 감자',pigeon:'넥타이 비둘기',duck:'왕관 오리',rabbit:'근육 토끼'};
export function artUrl(file){const url=artUrls[`../assets/runtime/art-20261121/${file}.webp`];if(!url)throw Error(`Unknown art: ${file}`);return url;}
export function icon(id){return iconSources[`../assets/runtime/art-20261121/icons/${id}.svg`].replace(/\srole="img"|\saria-label="[^"]*"|<title>.*?<\/title>/g,'').replace('<svg ','<svg class="ui-icon" aria-hidden="true" focusable="false" ').replaceAll('#514237','currentColor');}
export function characterArt(id,pose='idle'){
 const registration=characterRegistration[id];if(!registration)throw Error(`Unknown character: ${id}`);
 pose=characterLayout[id][pose]?pose:'idle';const layout=characterLayout[id][pose],scale=registration.scale;
 const file=catalog.characters[id][pose],[width,height]=catalog.sizes[file];
 return `<svg class="character-art" data-art-character="${id}" data-pose="${pose}" viewBox="0 0 128 154" aria-hidden="true"><image href="${artUrl(file)}" x="${64-layout.foot[0]*scale}" y="${154-layout.foot[1]*scale}" width="${width*scale}" height="${height*scale}"/></svg>`;
}
export function portrait(id){return artImage(`ui/${id}`,'character-portrait');}
export function artImage(file,className=''){return `<img class="${className}" src="${artUrl(file)}" alt="" aria-hidden="true" draggable="false">`;}
const cache=new Map();
function load(url){if(!cache.has(url))cache.set(url,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=()=>{cache.delete(url);reject(Error('Art image failed to load'));};img.src=url;}));return cache.get(url);}
export function filesForTheme(theme='ch01'){
 const characters=Object.values(catalog.characters).flatMap(poses=>Object.values(poses));
 const ui=['title','invitation','stamp','potato','pigeon','duck','rabbit'].map(id=>`ui/${id}`);
 return [...new Set([...characters,...catalog.common,...ui,...Object.values(catalog.chapters[theme])])];
}
export async function preloadArt(theme='ch01'){await Promise.all(filesForTheme(theme).map(file=>load(artUrl(file))));}
export function chapterFile(theme,role){return catalog.chapters[theme][role];}
export function sceneArtwork(theme){
 const layers=catalog.chapters[theme];const reserved=['sky','landmark','start','finish','tile','crack','collapse'];
 return artImage(layers.sky,'scene-sky')+`<div class="office">${artImage(layers.landmark)}<span class="landmark-label"></span></div>`+
 Object.entries(layers).filter(([role])=>!reserved.includes(role)).map(([role,file])=>artImage(file,`scene-layer ${role.startsWith('back_cloud')?'back-cloud '+role:role.startsWith('front_')?'front-cloud '+role:'scene-prop prop-'+role}`)).join('')+
 artImage(layers.start,'scene-start')+artImage(layers.finish,'scene-finish');
}
export function recoveryArt(id,box=false,reducedMotion=false){
 if(box)return `<div class="recovery-art in-box">${artImage(catalog.characters[id].return_parcel,'parcel-art')}${artImage('rescue/worker_v01','recovery-worker')}</div>`;
 return `<div class="recovery-art">${artImage('rescue/cushion_v01','recovery-back')}${!reducedMotion?artImage('vfx/rescue_v01','recovery-effect'):''}<div class="recovery-person">${characterArt(id,'rescued')}</div>${artImage('rescue/cushion_front_v01','recovery-front')}${artImage('rescue/worker_v01','recovery-worker')}</div>`;
}
