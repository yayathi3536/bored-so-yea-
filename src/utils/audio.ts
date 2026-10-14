import { resolveAssetUrl } from './assetPath';

// Interactive Web Audio API engine for ambient romantic soundtrack and interactive chimes

class CosmicAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private isMuted = false;
  private volume = 0.5;
  private synthInterval: any = null;
  private padGainNode: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private currentAudioUrl = '/audio/heat_waves.mp3';
  private trackName = 'Heat Waves';
  private composer = 'Glass Animals';
  private audioElement: HTMLAudioElement | null = null;
  private listeners: Array<(state: { isPlaying: boolean; isMuted: boolean; volume: number }) => void> = [];

  constructor() {
    // Lazy init on user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(cb: (state: { isPlaying: boolean; isMuted: boolean; volume: number }) => void) {
    this.listeners.push(cb);
    cb({ isPlaying: this.isPlaying, isMuted: this.isMuted, volume: this.volume });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ isPlaying: this.isPlaying, isMuted: this.isMuted, volume: this.volume }));
  }

  public togglePlay(customUrl?: string) {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play(customUrl);
    }
  }

  public play(customUrl?: string) {
    this.initContext();
    const rawUrl = customUrl && customUrl.trim().length > 0 ? customUrl : this.currentAudioUrl;
    const targetUrl = resolveAssetUrl(rawUrl);

    if (targetUrl) {
      if (!this.audioElement) {
        this.audioElement = new Audio(targetUrl);
        this.audioElement.loop = true;
      } else if (this.audioElement.src !== targetUrl && !this.audioElement.src.endsWith(targetUrl)) {
        this.audioElement.src = targetUrl;
      }
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
      this.audioElement.play().catch((err) => {
        console.warn('Audio play prevented or error:', err);
        // Fallback to ambient synth if browser policy blocks mp3
        this.startAmbientSynth();
      });
      this.isPlaying = true;
      this.notify();
      return;
    }

    // Play procedural romantic ambient soundtrack
    this.isPlaying = true;
    this.notify();
    this.startAmbientSynth();
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopAmbientSynth();
    this.notify();
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
    this.notify();
  }

  private startAmbientSynth() {
    if (!this.ctx || !this.masterGain) return;

    // Atmospheric warm pad (low drone with soft filter)
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const padFilter = this.ctx.createBiquadFilter();
      this.padGainNode = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(110, this.ctx.currentTime); // A2
      osc2.frequency.setValueAtTime(164.81, this.ctx.currentTime); // E3

      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.padGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.padGainNode.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 3);

      osc1.connect(padFilter);
      osc2.connect(padFilter);
      padFilter.connect(this.padGainNode);
      this.padGainNode.connect(this.masterGain);

      osc1.start();
      osc2.start();
    } catch {
      // AudioContext protection
    }

    // Melodic notes in Eb Major / Ab Major pentatonic scale
    const notes = [
      155.56, // Eb3
      185.00, // Gb3 / F#3
      207.65, // Ab3
      233.08, // Bb3
      261.63, // C4
      311.13, // Eb4
      392.00, // G4
      415.30, // Ab4
      466.16, // Bb4
      523.25, // C5
      622.25, // Eb5
    ];

    let step = 0;
    const playNextNote = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const freq = notes[step % notes.length];
      step = (step + Math.floor(Math.random() * 3) + 1) % notes.length;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.5);

      const nextDelay = 1400 + Math.random() * 1200;
      this.synthInterval = setTimeout(playNextNote, nextDelay);
    };

    playNextNote();
  }

  private stopAmbientSynth() {
    if (this.synthInterval) {
      clearTimeout(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.padGainNode && this.ctx) {
      try {
        this.padGainNode.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      } catch {}
    }
  }

  // Sound effects
  public playChime(pitchMultiplier = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880 * pitchMultiplier, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760 * pitchMultiplier, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);
    } catch {}
  }

  public playPaperRustle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      // White noise burst with bandpass filter
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
    } catch {}
  }

  public playHeartPulse() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {}
  }

  public playBlip(pitch = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520 * pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880 * pitch, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }
}

export const audioEngine = new CosmicAudioEngine();
