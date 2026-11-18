import { characterLayout } from './art-layout.js';
const artUrls = import.meta.glob('../assets/runtime/art-v02/**/*.webp', { eager: true, query: '?url', import: 'default' });
export function artUrl(file) { return artUrls[`../assets/runtime/art-v02/${file}.webp`]; }
// Temporary vector stand-ins, not production character artwork. Anchor: bottom center.
const bodies = {
  potato: '<ellipse cx="40" cy="40" rx="24" ry="30" fill="#c99b67"/><path d="M17 48 Q40 58 63 48 L60 68 Q40 77 20 68Z" fill="#fff9ee"/><path d="M36 53L44 53 47 69 40 74 34 68Z" fill="#417ca3"/><g fill="#ad7b4c"><circle cx="25" cy="25" r="2"/><circle cx="54" cy="40" r="2"/><circle cx="47" cy="17" r="2"/></g><rect x="57" y="53" width="16" height="19" rx="4" fill="#89543e"/>',
  pigeon: '<ellipse cx="40" cy="43" rx="25" ry="29" fill="#95a9b4"/><ellipse cx="40" cy="53" rx="17" ry="18" fill="#e4e8df"/><path d="M28 48L40 56 52 48" fill="#fff"/><path d="M38 52L43 52 47 68 40 73 36 65Z" fill="#c16a5b"/><path d="M33 34L41 40 48 34" fill="#eeb265"/><path d="M17 42Q3 50 17 61M63 42Q76 50 63 61" fill="#7c939f"/>',
  duck: '<ellipse cx="40" cy="44" rx="27" ry="28" fill="#f0cb65"/><path d="M26 14L23 3 35 10 41 1 47 10 59 3 56 16Z" fill="#dfac42"/><ellipse cx="40" cy="40" rx="13" ry="6" fill="#e58e49"/><path d="M18 45Q5 51 20 63M62 45Q76 51 60 63" fill="#e8b953"/>',
  rabbit: '<path d="M25 25Q12 -9 27 1Q38 7 34 26M46 26Q44 -8 57 0Q68 8 56 28" fill="#fff8ed"/><path d="M17 38Q40 12 63 38Q79 45 66 61L57 69H23L14 61Q1 46 17 38" fill="#fff8ed"/><path d="M20 59H60L58 73H43L40 66 37 73H22Z" fill="#6d697d"/><path d="M35 42L45 42 40 47Z" fill="#d4a0a1"/>',
};
export const names = { potato: '직장인 감자', pigeon: '넥타이 비둘기', duck: '왕관 오리', rabbit: '근육 토끼' };
export function characterArt(id, pose = 'idle') {
  if (characterLayout[id]) {
    pose = characterLayout[id][pose] ? pose : 'idle';
    const layout = characterLayout[id][pose];
    return `<svg class="character-art" data-pose="${pose}" viewBox="0 0 1254 1505" aria-hidden="true"><image href="${artUrl(`${id}/${pose}_v01`)}" x="${627 - layout.foot[0]}" y="${1505 - layout.foot[1]}" width="1254" height="1254"/></svg>`;
  }
  return `<svg viewBox="0 0 80 82" aria-hidden="true"><ellipse cx="40" cy="77" rx="22" ry="4" fill="#526c6a" opacity=".16"/>${bodies[id]}<g fill="#303d40"><ellipse cx="31" cy="30" rx="3" ry="4"/><ellipse cx="49" cy="30" rx="3" ry="4"/></g><g fill="white"><circle cx="32" cy="29" r="1"/><circle cx="50" cy="29" r="1"/></g><path d="M35 45Q40 49 45 45" fill="none" stroke="#745648" stroke-width="1.8" stroke-linecap="round"/><path d="M26 73L24 77H34M47 74L48 77H57" fill="none" stroke="#775943" stroke-width="4" stroke-linecap="round"/></svg>`;
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
export function recoveryArt(id, box = false) {
  return `<div class="recovery-art ${box ? 'in-box' : ''}">${artImage(box ? 'rescue/box_v01' : 'rescue/cushion_v01', 'recovery-back')}<div class="recovery-person">${characterArt(id, 'rescued')}</div>${artImage(box ? 'rescue/box_front_v01' : 'rescue/cushion_front_v01', box ? 'recovery-front box-front' : 'recovery-front')}${artImage('rescue/worker_v01', 'recovery-worker')}</div>`;
}
