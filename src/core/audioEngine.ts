import { EqualizerSettings } from '../types/audio';
import { EQ_FREQUENCIES } from './equalizerPresets';
import { errorHandler } from './errorHandler';

export interface EngineCallbacks {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (message: string) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export class WebAudioPlayerEngine {
  private audio: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private bandFilters: BiquadFilterNode[] = [];
  private pannerNode: StereoPannerNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private currentObjectUrl: string | null = null;
  private callbacks: EngineCallbacks = {};
  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(128));
  private timeData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(128));
  private pendingEq: EqualizerSettings | null = null;
  private pendingVolume = 0.7;
  private pendingMuted = false;

  constructor(callbacks: EngineCallbacks = {}) {
    this.callbacks = callbacks;
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';

    this.audio.addEventListener('timeupdate', () => {
      const dur = Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
      this.callbacks.onTimeUpdate?.(this.audio.currentTime || 0, dur);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      const dur = Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
      this.callbacks.onTimeUpdate?.(this.audio.currentTime || 0, dur);
    });

    this.audio.addEventListener('ended', () => {
      this.callbacks.onPlayStateChange?.(false);
      this.callbacks.onEnded?.();
    });

    this.audio.addEventListener('play', () => {
      this.callbacks.onPlayStateChange?.(true);
    });

    this.audio.addEventListener('pause', () => {
      this.callbacks.onPlayStateChange?.(false);
    });

    this.audio.addEventListener('error', () => {
      const mediaErr = this.audio.error;
      const msg = mediaErr
        ? `تعذر تشغيل الملف الصوتي (رمز الخطأ ${mediaErr.code})`
        : 'تعذر تشغيل الملف الصوتي';
      errorHandler.report(msg);
      this.callbacks.onPlayStateChange?.(false);
      this.callbacks.onError?.(msg);
    });
  }

  private ensureGraph(): void {
    if (this.ctx) return;

    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.sourceNode = this.ctx.createMediaElementSource(this.audio);

    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 100;

    this.bandFilters = EQ_FREQUENCIES.map((freq) => {
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1.4;
      filter.gain.value = 0;
      return filter;
    });

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 10000;

    this.pannerNode = this.ctx.createStereoPanner();
    this.gainNode = this.ctx.createGain();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.78;
    this.frequencyData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    this.timeData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

    // Chain: source -> bass -> [10 EQ bands] -> treble -> panner -> gain -> analyser -> destination
    let node: AudioNode = this.sourceNode;
    node.connect(this.bassFilter);
    node = this.bassFilter;

    for (const band of this.bandFilters) {
      node.connect(band);
      node = band;
    }

    node.connect(this.trebleFilter);
    this.trebleFilter.connect(this.pannerNode);
    this.pannerNode.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    if (this.pendingEq) {
      this.applyEqualizer(this.pendingEq);
    }
    this.setVolume(this.pendingVolume, this.pendingMuted);
  }

  async loadBlob(blob: Blob, autoPlay: boolean, startPosition = 0): Promise<void> {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }

    const url = URL.createObjectURL(blob);
    this.currentObjectUrl = url;
    this.audio.src = url;
    this.audio.load();

    if (startPosition > 0) {
      const applyStart = () => {
        if (Number.isFinite(this.audio.duration) && startPosition < this.audio.duration) {
          this.audio.currentTime = startPosition;
        }
        this.audio.removeEventListener('loadedmetadata', applyStart);
      };
      this.audio.addEventListener('loadedmetadata', applyStart);
    }

    if (autoPlay) {
      await this.play();
    }
  }

  async play(): Promise<void> {
    this.ensureGraph();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    await this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  seek(seconds: number): void {
    if (!Number.isFinite(seconds)) return;
    const dur = Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
    const clamped = Math.max(0, Math.min(dur || seconds, seconds));
    this.audio.currentTime = clamped;
  }

  setVolume(volume: number, muted: boolean): void {
    this.pendingVolume = Math.max(0, Math.min(1, volume));
    this.pendingMuted = muted;
    const effective = muted ? 0 : this.pendingVolume;

    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(effective, this.ctx.currentTime, 0.015);
      this.audio.volume = 1;
      this.audio.muted = false;
    } else {
      this.audio.volume = effective;
      this.audio.muted = muted;
    }
  }

  applyEqualizer(eq: EqualizerSettings): void {
    this.pendingEq = eq;
    if (!this.ctx || !this.bassFilter || !this.trebleFilter || !this.pannerNode) return;

    const now = this.ctx.currentTime;
    const active = eq.enabled;

    this.bassFilter.gain.setTargetAtTime(active ? eq.bass : 0, now, 0.02);
    this.trebleFilter.gain.setTargetAtTime(active ? eq.treble : 0, now, 0.02);
    this.pannerNode.pan.setTargetAtTime(active ? Math.max(-1, Math.min(1, eq.balance)) : 0, now, 0.02);

    this.bandFilters.forEach((filter, idx) => {
      const gain = active ? (eq.bands[idx] ?? 0) : 0;
      filter.gain.setTargetAtTime(gain, now, 0.02);
    });
  }

  getFrequencyData(): Uint8Array<ArrayBuffer> {
    if (this.analyser && !this.audio.paused) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      return this.frequencyData;
    }
    // Smooth decay toward zero when paused
    for (let i = 0; i < this.frequencyData.length; i++) {
      this.frequencyData[i] = Math.floor(this.frequencyData[i] * 0.85);
    }
    return this.frequencyData;
  }

  getTimeDomainData(): Uint8Array<ArrayBuffer> {
    if (this.analyser && !this.audio.paused) {
      this.analyser.getByteTimeDomainData(this.timeData);
      return this.timeData;
    }
    this.timeData.fill(128);
    return this.timeData;
  }

  isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended;
  }

  dispose(): void {
    this.audio.pause();
    this.audio.src = '';
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close();
    }
  }
}
