type SfxName = 'jump' | 'doubleJump' | 'coin' | 'powerup' | 'hit' | 'death' | 'win' | 'land';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private master: GainNode | null = null;

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted && this.master) this.master.gain.value = 0;
    else if (this.master) this.master.gain.value = 0.18;
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private blip(freq: number, duration: number, type: OscillatorType = 'square', sweepTo?: number, gainPeak = 0.6) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (sweepTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  private noiseBurst(duration: number, gainPeak = 0.4) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = gainPeak;
    src.connect(gain).connect(this.master);
    src.start();
  }

  play(name: SfxName) {
    switch (name) {
      case 'jump': this.blip(420, 0.12, 'square', 720); break;
      case 'doubleJump': this.blip(620, 0.14, 'triangle', 980); break;
      case 'coin': this.blip(880, 0.05, 'square'); setTimeout(() => this.blip(1320, 0.08, 'square'), 40); break;
      case 'powerup':
        [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.blip(f, 0.08, 'triangle'), i * 60));
        break;
      case 'hit': this.blip(180, 0.18, 'sawtooth', 60); this.noiseBurst(0.1, 0.25); break;
      case 'death':
        [440, 330, 220, 110].forEach((f, i) => setTimeout(() => this.blip(f, 0.18, 'square'), i * 110));
        break;
      case 'win':
        [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.blip(f, 0.16, 'triangle'), i * 100));
        break;
      case 'land': this.blip(140, 0.05, 'square', 80, 0.3); break;
    }
  }
}

export const audio = new AudioEngine();
