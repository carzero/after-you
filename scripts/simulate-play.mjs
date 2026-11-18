import fs from 'node:fs/promises';
import { Game, STAGES } from '../src/game.js';
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}
// Explicit automated policies, not a model of human memory or human playtesting.
export function trial(stage, seed, policy) {
  const random=seededRandom(seed), game=new Game({stage,random}), hint=game.hintRoute();
  game.advance(game.config.hint);
  let nextInput=500;
  while(!game.result) {
    if(game.phase==='playing' && game.player.state==='idle' && game.activeTime>=nextInput) {
      const row=game.player.row+1, observed=game.observed[row];
      let side;
      if(policy==='remember-all') side=hint[row];
      else if(policy==='observe-first') {
        side=observed.indexOf('safe');
        if(side<0 && observed.includes('broken')) side=1-observed.indexOf('broken');
        if(side<0) {
          const scout=game.actors.slice(1).some(a=>['idle','jump'].includes(a.state)&&a.row<row);
          if(!scout) side=random()<.5?0:1;
        }
      } else side=random()<.5?0:1;
      if(side!==undefined && side>=0) { game.move(side);nextInput=game.activeTime+1200; }
    }
    game.advance(20);
  }
  return {outcome:game.result,seconds:game.activeTime/1000,rows:game.player.row+1};
}
export function simulate(samples=300) {
  return STAGES.flatMap((config,stage)=>['remember-all','observe-first','blind'].map(policy=>{
    const runs=Array.from({length:samples},(_,i)=>trial(stage,i+1,policy));
    return {stage:stage+1,rows:config.rows,policy,samples,success:runs.filter(r=>r.outcome==='success').length,fall:runs.filter(r=>r.outcome==='fall').length,timeout:runs.filter(r=>r.outcome==='timeout').length,meanSeconds:+(runs.reduce((sum,r)=>sum+r.seconds,0)/samples).toFixed(2)};
  }));
}
if(process.argv[1]===new URL(import.meta.url).pathname) {
  const results=simulate();
  console.table(results);
  if(process.argv.includes('--write')) await fs.writeFile(new URL('../docs/PLAYTEST_SIMULATION.json',import.meta.url),JSON.stringify({note:'Automated seeded policies, not human playtest results. Seeds 1–300; input pacing 1200ms; seconds count active game time excluding hints/recovery; no hidden route access for observe-first or blind.',results},null,2)+'\n');
}
