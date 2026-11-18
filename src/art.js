import { characterLayout, characterRegistration } from './art-layout.js';
const artUrls = import.meta.glob('../assets/runtime/art-v03/**/*.webp', { eager: true, query: '?url', import: 'default' });
export function artUrl(file) { return artUrls[`../assets/runtime/art-v03/${file}.webp`]; }
export const names = { potato: '직장인 감자', pigeon: '넥타이 비둘기', duck: '왕관 오리', rabbit: '근육 토끼' };
export function characterArt(id, pose = 'idle') {
  const registration = characterRegistration[id];
  if (!registration) throw new Error(`Unknown character: ${id}`);
  pose = characterLayout[id][pose] ? pose : 'idle';
  const layout = characterLayout[id][pose], scale = registration.scale;
  const [width,height] = layout.size ?? registration.size;
  return `<svg class="character-art" data-art-character="${id}" data-pose="${pose}" viewBox="0 0 128 154" aria-hidden="true"><image href="${artUrl(`characters/${id}/${pose}_v01`)}" x="${64 - layout.foot[0]*scale}" y="${154 - layout.foot[1]*scale}" width="${width*scale}" height="${height*scale}"/></svg>`;
}

export function artImage(file, className = '') {
  return `<img class="${className}" src="${artUrl(file)}" alt="" aria-hidden="true" draggable="false">`;
}
export async function preloadArt() {
  await Promise.all(Object.values(artUrls).map(url => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(); img.onerror = () => reject(new Error('Art image failed to load'));
    img.src = url;
  })));
}
export function recoveryArt(id, box = false, reducedMotion = false) {
  return `<div class="recovery-art ${box ? 'in-box' : ''}">${artImage(box ? 'rescue/box_v01' : 'rescue/cushion_v01', 'recovery-back')}${!box && !reducedMotion ? artImage('vfx/rescue_v01', 'recovery-effect') : ''}<div class="recovery-person">${characterArt(id, 'rescued')}</div>${artImage(box ? 'rescue/box_front_v01' : 'rescue/cushion_front_v01', box ? 'recovery-front box-front' : 'recovery-front')}${artImage('rescue/worker_v01', 'recovery-worker')}</div>`;
}
