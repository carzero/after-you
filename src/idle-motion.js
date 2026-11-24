// Pure presentation driven only by the game's simulation clock, never hidden route data.
export const idleRegistration = {
  potato: { foot: [675,1100], scale: 128/1254 },
  pigeon: { foot: [625,1140], scale: 128/1254 },
  duck: { foot: [630,1110], scale: .111 },
  rabbit: { foot: [640,1170], scale: .112 },
};
export function idleMotion(clock, index, reducedMotion = false) {
  if (reducedMotion) return { pose: 'idle', scaleY: 1 };
  const phase = clock + index * 701, cycle = 3200 + index * 430;
  return { pose: phase % cycle >= cycle - 100 ? 'blink' : 'idle',
    scaleY: 1 + .004 * (1 - Math.cos(phase / 2800 * Math.PI * 2)) };
}
