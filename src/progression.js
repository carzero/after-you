export function stageConfig(stage = 0) {
  stage = Math.max(0, Math.trunc(stage));
  return {
    rows: Math.min(8 + stage * 2, 20), seconds: Math.min(35 + stage * 2, 50),
    hint: Math.max(600, 2600 - stage * 200),
    title: ['첫 번째 양보', '눈치의 기술', '접수 마감 임박'][stage] ?? '계속되는 구름길',
  };
}
export function restartStage(stage, outcome) {
  return outcome === 'success' ? stage + 1 : outcome === 'fall' ? Math.max(0, stage - 1) : stage;
}
export function floorsBefore(stage) {
  const n = Math.min(Math.max(0, stage), 6);
  return n * 8 + n * (n - 1) + Math.max(0, stage - 6) * 20;
}
export function heightReached(game) {
  return floorsBefore(game.stage) + Math.max(0, game.player.row + (game.player.state === 'fall' || game.result === 'fall' ? 0 : 1));
}
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}
