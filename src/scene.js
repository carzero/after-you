export const THEMES=[
 {id:'ch01',name:'구름 정거장'}, {id:'ch02',name:'바람 우체국'}, {id:'ch03',name:'천둥 공사장'},
 {id:'ch04',name:'별빛 대기실'}, {id:'ch05',name:'소원 접수처'},
];
// A cosmetic environment cycle only: no new stage, ending, ranking or unlock rule.
export function themeForStage(stage,preference='auto'){
 if(THEMES.some(t=>t.id===preference))return preference;
 const number=Number.isFinite(stage)?Math.max(0,Math.trunc(stage)):0;
 return THEMES[Math.floor(number/5)%THEMES.length].id;
}
export function themeName(id){return THEMES.find(t=>t.id===id)?.name??THEMES[0].name;}
