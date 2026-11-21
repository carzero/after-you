// Manual draft registration in original source pixels. Floating poses use a virtual ground point.
// One fixed scale per character, never a per-pose alpha-bounding-box fit.
export const characterLayout = {
  potato: {
    idle: { foot: [675,1194] }, jump: { foot: [640,1120] },
    land: { foot: [690,1100] }, hover: { foot: [635,1200] },
    fall: { foot: [650,1205] }, rescued: { foot: [665,1195] }, finished: { foot: [670,1190] },
  },
  pigeon: {
    idle: { foot: [625,1194] }, jump: { foot: [640,1105] },
    land: { foot: [630,1120] }, hover: { foot: [635,1190] },
    fall: { foot: [650,1205] }, rescued: { foot: [640,1200] }, finished: { foot: [635,1195] },
  },
  duck: {
    idle: { foot: [630,1265] }, jump: { foot: [630,1265] },
    land: { foot: [660,1120], size: [1312,1199] }, hover: { foot: [630,1265] },
    fall: { foot: [630,1265] }, rescued: { foot: [630,1265] }, finished: { foot: [630,1265] },
  },
  rabbit: {
    idle: { foot: [620,1255] }, jump: { foot: [620,1255] },
    land: { foot: [620,1255] }, hover: { foot: [620,1255] },
    fall: { foot: [620,1255] }, rescued: { foot: [620,1255] }, finished: { foot: [620,1255] },
  },
};
export function poseFor(actor, clock, landedAt) {
  if (actor.state === 'jump') return 'jump';
  if (actor.state === 'finished' || actor.state === 'rescued') return actor.state;
  if (actor.state === 'fall') {
    const elapsed = 1400 - (actor.until - clock);
    return elapsed < 150 ? 'land' : elapsed < 600 ? 'hover' : elapsed < 1050 ? 'fall' : 'rescued';
  }
  return landedAt !== undefined && clock - landedAt < 160 ? 'land' : 'idle';
}

export const characterRegistration = {
  potato: { scale: 128/1254, size: [1254,1254] },
  pigeon: { scale: 128/1254, size: [1254,1254] },
  duck: { scale: .099, size: [1178,1335] },
  rabbit: { scale: .104, size: [1199,1312] },
};
export function worldEffects(clock, jumpedAt, landedAt, reducedMotion = false) {
  if (reducedMotion) return [];
  const result = [];
  for (const [kind,at,duration] of [['takeoff',jumpedAt,160],['landing',landedAt,120]]) {
    if (at !== undefined && clock >= at && clock-at < duration) result.push({kind,opacity:1-(clock-at)/duration});
  }
  return result;
}

// Additional acting uses the same per-character scale. Independent-image proportions remain draft.
const acting={
 potato:{after_you:[800,960],inspect:[800,980],relief:[660,1140]},
 pigeon:{after_you:[780,960],inspect:[600,1290],relief:[660,1140]},
 duck:{after_you:[800,980],inspect:[620,1265],relief:[620,1265]},
 rabbit:{after_you:[620,1255],inspect:[530,1460],relief:[780,980]},
};
for(const[id,poses]of Object.entries(acting))for(const[pose,foot]of Object.entries(poses))characterLayout[id][pose]={foot};
export function actingPose(actor,clock,landedAt,observed){
 const base=poseFor(actor,clock,landedAt);
 if(base!=='idle')return base;
 if(landedAt!==undefined&&clock-landedAt<500)return 'relief';
 const next=observed[actor.row+1];
 if(next&&next.every(value=>value==='unknown'))return actor.player&&actor.row>=0?'inspect':!actor.player?'after_you':'idle';
 return 'idle';
}
