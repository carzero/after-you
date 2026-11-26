import atlas from '../assets/runtime/items/atlas.webp?url';
export const ITEMS={memory:{name:'기억 쪽지',description:'남은 안전 경로를 1초 동안 다시 봅니다.'},glasses:{name:'눈치 안경',description:'다음 안전 발판을 1초 동안 확인합니다.'}};
export function itemIcon(kind){return `<span class="item-icon ${kind}" style="background-image:url('${atlas}')" aria-hidden="true"></span>`;}
