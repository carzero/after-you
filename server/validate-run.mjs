import { Game } from '../src/game.js';
import { heightReached, restartStage, seededRandom } from '../src/progression.js';
const fail=(status,message)=>Object.assign(new Error(message),{status});
// Shared by the Node server and Workers. Client-supplied scores never participate.
export function validateCheckpoint(run,input,now){
 if(!Array.isArray(input.moves)||input.moves.length>30||!Number.isFinite(input.end)||input.end<0||input.end>65000)throw fail(400,'잘못된 이동 기록입니다.');
 if(run.virtual+input.end>now-run.created+250)throw fail(422,'실제 시간보다 빠른 기록은 등록할 수 없습니다.');
 const game=new Game({stage:run.stage,random:seededRandom(run.seed),items:run.items});let at=0;
 for(const move of input.moves){
  if(!move||!Number.isFinite(move.at)||move.at<at||move.at>input.end||(move.type==='item'?!Number.isInteger(move.index)||move.index<0||move.index>2:move.type!==undefined||![0,1].includes(move.side)))throw fail(422,'이동 순서가 올바르지 않습니다.');
  game.advance(move.at-at);at=move.at;if(!(move.type==='item'?game.useItem(move.index):game.move(move.side)))throw fail(422,'중복되거나 너무 빠른 이동입니다.');
 }
 game.advance(input.end-at);if(input.skipped===true)game.skipRescue();
 if(!game.result)throw fail(422,'아직 끝나지 않은 스테이지입니다.');
 return {items:game.itemState(),outcome:game.result,from:run.stage,stage:restartStage(run.stage,game.result),peak:Math.max(run.peak,heightReached(game)),virtual:run.virtual+input.end,last:now};
}
