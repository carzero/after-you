// Draft registration in ORIGINAL 1254×1254 pixels; ground contact maps to (627,1505).
// Measured visually from feet, not alpha_bbox (which includes glow and stray pixels).
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
