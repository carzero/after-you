// Quiet synthesized placeholders. Replace via the event contract in docs/AUDIO_CUES.md.
export class AudioBus {
  constructor(settings) { this.settings = settings; this.nodes = new Set(); }
  unlock() {
    this.context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
  }
  tone(hz, duration = .12, volume = .035, delay = 0) {
    if (!this.context || this.context.state !== 'running') return;
    const osc = this.context.createOscillator(), gain = this.context.createGain(), t = this.context.currentTime + delay;
    osc.type = 'sine'; osc.frequency.setValueAtTime(hz, t);
    gain.gain.setValueAtTime(volume, t); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    osc.connect(gain).connect(this.context.destination); this.nodes.add(osc);
    osc.onended = () => { this.nodes.delete(osc); osc.disconnect(); gain.disconnect(); };
    osc.start(); osc.stop(t + duration);
  }
  event(type, delay = 0) {
    if (!this.settings.sound) return;
    const notes = { jump: 360, land_safe: 560, tile_crack: 120, fall: 85, rescue: 270, finish: 740 };
    if (notes[type]) this.tone(notes[type], .12, .035, delay);
  }
  music(time) {
    const beat = Math.floor(time / 800);
    if (beat !== this.beat) {
      this.beat = beat;
      if (this.settings.music) this.tone([262, 330, 392, 330, 294, 349, 440, 349][beat % 8], .25, .012);
    }
  }
  stop() { for (const node of this.nodes) { try { node.stop(); } catch {} } this.nodes.clear(); this.beat = null; }
}
