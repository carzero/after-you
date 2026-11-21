export const SAVE_KEY = 'after-you.save.v1';
export const defaults = () => ({ version: 1, unlockedStage: 0, chapterComplete: false, bestHeight: 0, theme: 'auto', best: {}, settings: { music: true, sound: true, vibration: false, reducedMotion: false } });
export function loadSave(storage) {
  try {
    const raw = JSON.parse(storage.getItem(SAVE_KEY));
    if (!raw || raw.version !== 1) return defaults();
    const save = defaults();
    save.unlockedStage = Number.isInteger(raw.unlockedStage) ? Math.max(0, Math.min(2, raw.unlockedStage)) : 0;
    save.chapterComplete = raw.chapterComplete === true;
    save.theme = ['auto','ch01','ch02','ch03','ch04','ch05'].includes(raw.theme) ? raw.theme : 'auto';
    save.bestHeight = Number.isSafeInteger(raw.bestHeight) && raw.bestHeight >= 0 ? raw.bestHeight : 0;
    for (let i = 0; i < 3; i++) if (Number.isFinite(raw.best?.[i]) && raw.best[i] > 0) save.best[i] = raw.best[i];
    for (const key of Object.keys(save.settings)) if (typeof raw.settings?.[key] === 'boolean') save.settings[key] = raw.settings[key];
    return save;
  } catch { return defaults(); }
}
export function storeSave(storage, save) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; }
}
export function recordWin(save, stage, ms) {
  save.unlockedStage = Math.max(save.unlockedStage, Math.min(2, stage + 1));
  if (stage === 2) save.chapterComplete = true;
  save.best[stage] = Math.min(save.best[stage] ?? Infinity, ms);
}
