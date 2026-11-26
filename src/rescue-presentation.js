import { FALL_MS } from './game.js';
export const RESCUE_HOLD_MS=1600;
// Only the presentation rate changes. The authoritative fall still ends at 1400 game ms.
export function rescueGameDelta(game,delta){
 if(game.phase!=='rescuing'||game.player.state!=='fall')return delta;
 const elapsed=FALL_MS-(game.player.until-game.clock);
 const beforeFall=Math.max(0,600-elapsed);
 return Math.min(delta,beforeFall)+Math.max(0,delta-beforeFall)*.5;
}
export class RescuePresentation{
 constructor(){this.reset();}
 reset(){this.remaining=0;}
 get holding(){return this.remaining>0;}
 observe(events){if(events.some(e=>e.type==='finish'&&e.outcome==='fall')&&!events.some(e=>e.type==='rescue'&&e.skipped)){this.remaining=RESCUE_HOLD_MS;return true;}return false;}
 advance(delta,paused){if(!paused&&Number.isFinite(delta)&&delta>0)this.remaining=Math.max(0,this.remaining-delta);}
 skip(){if(!this.holding)return false;this.remaining=0;return true;}
}
