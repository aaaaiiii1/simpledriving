/**
 * Web Audio procedural sound synthesizer for desert driving game.
 * Zero external audio files, 100% procedurally synthesized.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Generate 2 seconds of white noise for skids and debris
      const sampleRate = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < sampleRate * 2; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.setupEngineSynth();
      this.setupSkidSynth();
    } catch {
      // Audio not supported or blocked
    }
  }

  private setupEngineSynth() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual oscillator engine rumble
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';
    this.engineOsc1.frequency.setValueAtTime(45, now);
    this.engineOsc2.frequency.setValueAtTime(22.5, now);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(180, now);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0, now);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  private setupSkidSynth() {
    if (!this.ctx || !this.noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    this.skidFilter = this.ctx.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.skidFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    noiseSource.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.ctx.destination);

    noiseSource.start();
  }

  public resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.engineGain) {
      if (muted) {
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
        if (this.skidGain) this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public updateEngineSound(speed: number, throttle: number, isDrifting: boolean, skidIntensity: number) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const speedRatio = Math.min(1, Math.abs(speed) / 30);
    const revPitch = 40 + speedRatio * 95 + Math.abs(throttle) * 35;

    if (this.engineOsc1 && this.engineOsc2 && this.engineFilter && this.engineGain) {
      this.engineOsc1.frequency.setTargetAtTime(revPitch, now, 0.05);
      this.engineOsc2.frequency.setTargetAtTime(revPitch * 0.5, now, 0.05);
      this.engineFilter.frequency.setTargetAtTime(140 + speedRatio * 400 + Math.abs(throttle) * 150, now, 0.05);
      this.engineGain.gain.setTargetAtTime(0.08 + speedRatio * 0.07 + (Math.abs(throttle) > 0 ? 0.04 : 0), now, 0.05);
    }

    if (this.skidGain && this.skidFilter) {
      const targetGain = isDrifting ? Math.min(0.18, skidIntensity * 0.18) : 0;
      this.skidGain.gain.setTargetAtTime(targetGain, now, 0.05);
      this.skidFilter.frequency.setTargetAtTime(650 + skidIntensity * 500, now, 0.05);
    }
  }

  public playCrashSound(weight: 'LIGHT' | 'MEDIUM' | 'HEAVY') {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. Thud oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    const startFreq = weight === 'HEAVY' ? 140 : weight === 'MEDIUM' ? 180 : 220;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + (weight === 'HEAVY' ? 0.25 : 0.15));

    const peakGain = weight === 'HEAVY' ? 0.35 : weight === 'MEDIUM' ? 0.22 : 0.12;
    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (weight === 'HEAVY' ? 0.3 : 0.18));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    // 2. Crunch noise burst
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(weight === 'HEAVY' ? 1200 : 800, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(weight === 'HEAVY' ? 0.25 : 0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (weight === 'HEAVY' ? 0.25 : 0.15));

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.3);
    }
  }

  public playCactusSmash() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playWoodSnap() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playHorn(start: boolean) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    if (start && !this.hornGain) {
      this.hornOsc1 = this.ctx.createOscillator();
      this.hornOsc2 = this.ctx.createOscillator();
      this.hornOsc1.type = 'sawtooth';
      this.hornOsc2.type = 'sawtooth';
      this.hornOsc1.frequency.setValueAtTime(415, now); // G#4
      this.hornOsc2.frequency.setValueAtTime(520, now); // C5

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);

      this.hornGain = this.ctx.createGain();
      this.hornGain.gain.setValueAtTime(0.18, now);

      this.hornOsc1.connect(filter);
      this.hornOsc2.connect(filter);
      filter.connect(this.hornGain);
      this.hornGain.connect(this.ctx.destination);

      this.hornOsc1.start();
      this.hornOsc2.start();
    } else if (!start && this.hornGain) {
      this.hornGain.gain.setValueAtTime(0, now);
      this.hornOsc1?.stop(now);
      this.hornOsc2?.stop(now);
      this.hornGain = null;
      this.hornOsc1 = null;
      this.hornOsc2 = null;
    }
  }

  public playCheer() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Ascending arpeggio jingle
    const notes = [261.6, 329.6, 392.0, 523.2];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }
}

export const sound = new SoundManager();
