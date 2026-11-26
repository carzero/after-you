export function rescueFrame(t,reduced=false){
 const clamp=x=>Math.max(0,Math.min(1,x));
 const cover=t<1050?clamp((t-900)/100):1-clamp((t-1150)/250);
 return {pose:t<1050?'fall':'rescued',actorVisible:!(t>=1000&&t<1150),cloudOpacity:cover,cloudY:reduced?0:30*(1-cover),done:t>=1400};
}
