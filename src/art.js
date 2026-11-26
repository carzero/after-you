import integration from './integration-catalog.json';
import registered from './pose-catalog.json';
import { placePose } from './pose-placement.js';
import { idleMotion, idleRegistration } from './idle-motion.js';
import { characterLayout, characterRegistration } from './art-layout.js';
import { catalog } from './art-catalog.js';
const integrationUrls=import.meta.glob('../assets/runtime/integration-20261126/**/*.webp',{eager:true,query:'?url',import:'default'});
const layers=theme=>{const base={...catalog.chapters[theme]};if(['ch04','ch05'].includes(theme))for(const role of ['back_cloud_1','back_cloud_2','back_cloud_3','front_left','front_right'])delete base[role];return {...base,...integration.chapters[theme]};};
const artUrls=import.meta.glob('../assets/runtime/art-20261121/**/*.webp',{eager:true,query:'?url',import:'default'});
const idleUrls=import.meta.glob('../assets/runtime/idle-20261124/**/*.webp',{eager:true,query:'?url',import:'default'});
const registeredUrls=import.meta.glob('../assets/runtime/poses-20261124/**/*.webp',{eager:true,query:'?url',import:'default'});
const iconSources=import.meta.glob('../assets/runtime/art-20261121/icons/*.svg',{eager:true,query:'?raw',import:'default'});
export const names={potato:'직장인 감자',pigeon:'넥타이 비둘기',duck:'왕관 오리',rabbit:'근육 토끼'};
export function artUrl(file){if(file.startsWith('integration/')){const url=integrationUrls[`../assets/runtime/integration-20261126/${file.slice(12)}.webp`];if(!url)throw Error(`Unknown integrated art: ${file}`);return url;}const url=artUrls[`../assets/runtime/art-20261121/${file}.webp`];if(!url)throw Error(`Unknown art: ${file}`);return url;}
export function icon(id){return iconSources[`../assets/runtime/art-20261121/icons/${id}.svg`].replace(/\srole="img"|\saria-label="[^"]*"|<title>.*?<\/title>/g,'').replace('<svg ','<svg class="ui-icon" aria-hidden="true" focusable="false" ').replaceAll('#514237','currentColor');}
export function characterArt(id,pose='idle',motion){
 if(pose==='descent'){
  const e=integration.descent[id],scale=idleRegistration[id].scale;
  return `<svg class="character-art" data-art-character="${id}" data-pose="descent" data-registered-pose="true" viewBox="0 0 128 154" aria-hidden="true"><g><image href="${artUrl('integration/descent/'+id)}" x="${64-e.anchor[0]*scale}" y="${154-e.anchor[1]*scale}" width="${e.size[0]*scale}" height="${e.size[1]*scale}"/></g></svg>`;
 }

 const asset=registered.assets.find(e=>e.character===id&&e.state===pose);
 if(asset && !(id==='potato'&&pose==='idle'&&motion)){
  const idle=registered.assets.find(e=>e.character===id&&e.state==='idle');
  let file=pose,frame,layoutAsset=asset;
  if(pose==='idle'&&motion){
   frame=idleMotion(motion.clock,motion.index,motion.reducedMotion);
   const phase=motion.clock+motion.index*701;
   const sequence=[0,1,2,3,4,5,6,5,4,3,2,1];
   file=frame.pose==='blink'?'blink_closed':motion.reducedMotion?'idle':'breath_0'+sequence[Math.floor(phase/233)%sequence.length];
   layoutAsset={...asset,groundContact:registered.motion[id].anchor_px};
  }
  const p=placePose(layoutAsset,idle,{x:64,y:154},idleRegistration[id].scale);
  return `<svg class="character-art" data-art-character="${id}" data-pose="${frame?.pose??pose}" data-registered-pose="true" ${frame?'data-idle-motion="true"':''} data-frame="${file}" viewBox="0 0 128 154" aria-hidden="true"><g transform="translate(0 154) scale(1 1) translate(0 -154)"><image href="${registeredUrls[`../assets/runtime/poses-20261124/${id}/${file}.webp`]}" x="${p.left}" y="${p.top}" width="${p.width}" height="${p.height}"/></g></svg>`;
 }
 if(pose==='idle' && motion){
  const frame=idleMotion(motion.clock,motion.index,motion.reducedMotion),{foot,scale}=idleRegistration[id];
  const url=idleUrls[`../assets/runtime/idle-20261124/${id}/${frame.pose}.webp`];
  return `<svg class="character-art" data-art-character="${id}" data-pose="${frame.pose}" data-idle-motion="true" viewBox="0 0 128 154" aria-hidden="true"><g transform="translate(0 154) scale(1 ${frame.scaleY}) translate(0 -154)"><image href="${url}" x="${64-foot[0]*scale}" y="${154-foot[1]*scale}" width="${1254*scale}" height="${1254*scale}"/></g></svg>`;
 }
 const registration=characterRegistration[id];if(!registration)throw Error(`Unknown character: ${id}`);
 pose=characterLayout[id][pose]?pose:'idle';const layout=characterLayout[id][pose],scale=registration.scale;
 const file=catalog.characters[id][pose],[width,height]=catalog.sizes[file];
 return `<svg class="character-art" data-art-character="${id}" data-pose="${pose}" viewBox="0 0 128 154" aria-hidden="true"><g><image href="${artUrl(file)}" x="${64-layout.foot[0]*scale}" y="${154-layout.foot[1]*scale}" width="${width*scale}" height="${height*scale}"/></g></svg>`;
}
export function portrait(id){return artImage(`ui/${id}`,'character-portrait');}
export function artImage(file,className=''){return `<img class="${className}" src="${artUrl(file)}" alt="" aria-hidden="true" draggable="false">`;}
const cache=new Map();
function load(url){if(!cache.has(url))cache.set(url,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{Promise.resolve(img.decode?.()).then(resolve,()=>{cache.delete(url);reject(Error('Art image failed to load'));});};img.onerror=()=>{cache.delete(url);reject(Error('Art image failed to load'));};img.src=url;}));return cache.get(url);}
export function filesForTheme(theme='ch01'){
 const characters=Object.values(catalog.characters).flatMap(poses=>Object.values(poses));
 const ui=['title','invitation','stamp','potato','pigeon','duck','rabbit'].map(id=>`ui/${id}`);
 return [...new Set([...characters,...catalog.common,...ui,...Object.values(layers(theme))])];
}
export async function preloadArt(theme='ch01'){await Promise.all([...filesForTheme(theme).map(artUrl),...Object.values(idleUrls),...Object.values(registeredUrls),...['ui/title','ui/logo','rescue/cloud',...Object.keys(names).map(id=>'descent/'+id)].map(file=>artUrl('integration/'+file))].map(load));}
export function chapterFile(theme,role){return layers(theme)[role];}
export function sceneArtwork(theme){
 const chapter=layers(theme);const reserved=['sky','landmark','start','finish','tile','crack','collapse'];
 return artImage(chapter.sky,'scene-sky')+`<div class="office">${artImage(chapter.landmark)}<span class="landmark-label"></span></div>`+
 Object.entries(chapter).filter(([role])=>!reserved.includes(role)).map(([role,file])=>artImage(file,`scene-layer ${role.startsWith('back_cloud')?'back-cloud '+role:role.startsWith('front_')?'front-cloud '+role:'scene-prop prop-'+role}`)).join('')+
 artImage(chapter.start,'scene-start')+artImage(chapter.finish,'scene-finish');
}
export function recoveryArt(id,box=false,reducedMotion=false){
 if(box)return `<div class="recovery-art in-box">${artImage(catalog.characters[id].return_parcel,'parcel-art')}${artImage('rescue/worker_v01','recovery-worker')}</div>`;
 return `<div class="recovery-art">${artImage('rescue/cushion_v01','recovery-back')}${!reducedMotion?artImage('vfx/rescue_v01','recovery-effect'):''}<div class="recovery-person">${characterArt(id,'rescued')}</div>${artImage('rescue/cushion_front_v01','recovery-front')}${artImage('rescue/worker_v01','recovery-worker')}</div>`;
}
