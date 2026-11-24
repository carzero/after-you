// Review-only controller. Caller supplies a simulation clock stopped while paused/hidden.
export function idleFrame(clock, index, { reduced = false, active = true, mode = 'blink' } = {}) {
  if (reduced || !active) return { pose: 'idle', scaleY: 1 };
  const cycle = 3200 + index * 430;
  const phase = (clock + index * 701) % cycle;
  return {
    pose: mode === 'blink' && phase >= cycle - 100 ? 'blink' : 'idle',
    scaleY: mode === 'breathe' ? 1 + 0.008 * (1 - Math.cos((clock + index * 701) / 2800 * Math.PI * 2)) / 2 : 1,
  };
}
