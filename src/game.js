import { stageConfig } from './progression.js';
export const STAGES = Object.freeze([0, 1, 2].map(stageConfig));
export const PEOPLE = ['potato', 'pigeon', 'duck', 'rabbit'];
export const JUMP_MS = 420;
export const FALL_MS = 1400;

// This decision boundary receives public observations only, never the route.
export function chooseNpc({ row, observed, courage }, random) {
  if (row >= observed.length) return null;
  const known = observed[row];
  const safe = known.indexOf('safe');
  if (safe !== -1) return safe;
  const broken = known.indexOf('broken');
  if (broken !== -1) return 1 - broken;
  return random() < courage ? (random() < 0.5 ? 0 : 1) : null;
}

export class Game {
  #route;
  constructor({ stage = 0, character = 'potato', random = Math.random, items = {} } = {}) {
    this.stage = Number.isSafeInteger(stage) ? Math.max(0, stage) : 0;
    this.config = stageConfig(this.stage);
    this.random = random;
    this.inventory = [...(items.inventory ?? [])];
    this.rewardCeiling = items.rewardCeiling ?? -1;
    this.itemEffect = null;
    this.#route = Object.freeze(Array.from({ length: this.config.rows }, () => random() < 0.5 ? 0 : 1));
    this.observed = this.#route.map(() => ['unknown', 'unknown']);
    this.phase = 'hint'; this.clock = 0; this.activeTime = 0;
    this.remaining = this.config.seconds * 1000; this.paused = false;
    this.events = []; this.result = null;
    this.actors = [character, ...PEOPLE.filter(p => p !== character)].map((id, i) => ({
      id, player: i === 0, row: -1, side: i % 2, state: 'idle', until: 0,
      nextThink: [0, 1600, 900, 500][i], courage: [0, .18, .42, .7][i],
      delay: [0, 1500, 1100, 850][i],
    }));
  }
  get player() { return this.actors[0]; }
  emit(type, actor, extra = {}) { this.events.push({ type, actor: actor.id, player: actor.player, time: this.clock, ...extra }); }
  drainEvents() { return this.events.splice(0); }
  setPaused(value) { this.paused = Boolean(value); }
  hintRoute() {
    if(this.phase === 'hint') return [...this.#route];
    if(this.phase!=='playing' || !this.itemEffect || this.clock >= this.itemEffect.until) return null;
    return this.#route.map((side,row)=>row>this.player.row && (this.itemEffect.kind==='memory'||row===this.player.row+1)?side:null);
  }
  itemState() { return {inventory:[...this.inventory],rewardCeiling:this.rewardCeiling}; }
  useItem(index) {
    if(this.paused || this.phase!=='playing' || this.player.state!=='idle' || this.itemEffect || !Number.isInteger(index) || index<0 || index>=this.inventory.length) return false;
    const [kind]=this.inventory.splice(index,1);
    this.itemEffect={kind,until:this.clock+1000};
    this.emit('item_used',this.player,{kind});return true;
  }
  awardItem(actor) {
    if(actor.row!==5 || this.stage<=this.rewardCeiling) return;
    this.rewardCeiling=this.stage;
    if(!actor.player || this.actors.some(a=>!a.player && ((a.row>=5&&!['fall','rescued'].includes(a.state)) || (a.row===4&&a.state==='jump'&&a.until<=this.clock&&a.side===this.#route[5])))) return;
    if(this.inventory.length>=3){this.emit('item_full',actor);return;}
    const kind=this.random()<.25?'memory':'glasses';this.inventory.push(kind);this.emit('item_awarded',actor,{kind});
  }
  move(side, actor = this.player) {
    if (this.paused || this.phase !== 'playing' || actor.state !== 'idle' || this.itemEffect || ![0, 1].includes(side)) return false;
    actor.side = side; actor.state = 'jump'; actor.until = this.clock + JUMP_MS;
    this.emit('jump', actor, { row: actor.row + 1, side }); return true;
  }
  skipRescue() {
    if (this.paused || this.phase !== 'rescuing' || this.player.state !== 'fall') return false;
    this.player.state = 'rescued';
    this.emit('rescue', this.player, { skipped: true });
    this.finish('fall');
    return true;
  }
  finish(outcome) {
    if (this.result) return;
    this.result = outcome; this.phase = 'result';
    this.emit('finish', this.player, { outcome, elapsed: this.activeTime });
  }
  // Bounded substeps process landings and NPC decisions even during a slow display frame.
  advance(ms) {
    if (this.paused || this.phase === 'result' || !Number.isFinite(ms) || ms <= 0) return;
    while (ms > 0 && this.phase !== 'result') {
      const dt = Math.min(10, ms); ms -= dt; this.clock += dt;
      if (this.phase === 'hint') {
        if (this.clock >= this.config.hint) { this.phase = 'playing'; this.playStart = this.clock; }
        continue;
      }
      if (this.phase === 'playing') {
        this.activeTime += dt; this.remaining = Math.max(0, this.remaining - dt);
        // Deadline wins ties with landing, and cancels in-flight gameplay.
        if (this.remaining <= 0) { this.finish('timeout'); break; }
      }
      if(this.itemEffect){
        // Keep in-flight actors still too; shift their deadlines with the stopped world.
        for(const actor of this.actors){if(['jump','fall'].includes(actor.state))actor.until+=dt;actor.nextThink+=dt;}
        if(this.clock>=this.itemEffect.until)this.itemEffect=null;
        continue;
      }
      for (const actor of this.actors) {
        if (actor.state === 'jump' && this.clock >= actor.until) {
          actor.row += 1;
          if (this.#route[actor.row] === actor.side) {
            this.observed[actor.row][actor.side] = 'safe';
            actor.state = 'idle'; actor.nextThink = this.clock - this.playStart + actor.delay;
            this.emit('land_safe', actor, { row: actor.row, side: actor.side });
            this.awardItem(actor);
            if (actor.row === this.config.rows - 1) {
              actor.state = 'finished';
              if (actor.player) this.finish('success');
            }
          } else {
            this.observed[actor.row][actor.side] = 'broken';
            actor.state = 'fall'; actor.until = this.clock + FALL_MS;
            this.emit('tile_crack', actor, { row: actor.row, side: actor.side });
            if (actor.player) this.phase = 'rescuing';
          }
        }
        if (actor.state === 'fall') {
          const elapsed = FALL_MS - (actor.until - this.clock);
          if (elapsed >= 600 && !actor.fallEmitted) { actor.fallEmitted = true; this.emit('fall', actor); }
          if (this.clock >= actor.until) {
            actor.state = 'rescued'; this.emit('rescue', actor);
            if (actor.player) this.finish('fall');
          }
        }
        if (!actor.player && actor.state === 'idle' && this.phase === 'playing' && this.clock - this.playStart >= actor.nextThink) {
          const side = chooseNpc({ row: actor.row + 1, observed: this.observed, courage: actor.courage }, this.random);
          actor.nextThink = this.clock - this.playStart + actor.delay;
          if (side !== null) this.move(side, actor);
        }
        if (this.phase === 'result') break;
      }
    }
  }
}
