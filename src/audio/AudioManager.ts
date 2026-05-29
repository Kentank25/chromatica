/**
 * AudioManager - Centralized audio system for Chromatica v2
 * 
 * Manages BGM and SFX playback through Web Audio API procedural synthesis.
 * Supports Master/BGM/SFX bus gain staging and real-time crossfading.
 */
import type { SFXEvent, BGMState, AudioSettings } from '../types/audio.types';
import { SynthSFX } from './SynthSFX';

class AudioManager {
  private static instance: AudioManager;
  
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  // BGM Layer gains for crossfading
  private bgmBaseGain: GainNode | null = null;
  private bgmDrivingGain: GainNode | null = null;
  private bgmTensionGain: GainNode | null = null;

  private currentBGMState: BGMState = 'silent';
  private settings: AudioSettings = {
    masterVolume: 1.0,
    bgmVolume: 0.5,
    sfxVolume: 0.8,
    muted: false,
  };
  
  private lastPourTime = 0;
  private bgmInitialized = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize audio system. Should be called on first user gesture.
   */
  init(): void {
    if (this.ctx) return; // already initialized

    // Create AudioContext
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create Mixer Gains
    this.masterGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.bgmGain = this.ctx.createGain();

    this.sfxGain.connect(this.masterGain);
    this.bgmGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Apply current settings to nodes
    this.applyVolumes();

    // Initialize BGM layers
    this.initBGMLayers();
  }

  /**
   * Builds and launches BGM oscillators and modulating noise generators.
   */
  private initBGMLayers(): void {
    if (!this.ctx || !this.bgmGain || this.bgmInitialized) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Create crossfade gains
    this.bgmBaseGain = ctx.createGain();
    this.bgmDrivingGain = ctx.createGain();
    this.bgmTensionGain = ctx.createGain();

    // Set gains initially to 0 (default silent state)
    this.bgmBaseGain.gain.setValueAtTime(0, now);
    this.bgmDrivingGain.gain.setValueAtTime(0, now);
    this.bgmTensionGain.gain.setValueAtTime(0, now);

    this.bgmBaseGain.connect(this.bgmGain);
    this.bgmDrivingGain.connect(this.bgmGain);
    this.bgmTensionGain.connect(this.bgmGain);

    // ────────────────────────────────────────────────────────
    // 1. BASE LAYER: C2 (65.41 Hz) + G2 (98.00 Hz) + 0.1 Hz LFO modulation + noise floor
    // ────────────────────────────────────────────────────────
    const oscC2 = ctx.createOscillator();
    oscC2.type = 'sine';
    oscC2.frequency.setValueAtTime(65.41, now);

    const oscG2 = ctx.createOscillator();
    oscG2.type = 'sine';
    oscG2.frequency.setValueAtTime(98.00, now);

    // 0.1 Hz LFO modulates the gain of the base waves slowly
    const baseLfo = ctx.createOscillator();
    baseLfo.type = 'sine';
    baseLfo.frequency.setValueAtTime(0.1, now);

    const baseLfoGain = ctx.createGain();
    baseLfoGain.gain.setValueAtTime(0.15, now); // scale

    const baseOscGain = ctx.createGain();
    baseOscGain.gain.setValueAtTime(0.35, now); // center offset (swings 0.20 to 0.50)

    baseLfo.connect(baseLfoGain);
    baseLfoGain.connect(baseOscGain.gain);

    oscC2.connect(baseOscGain);
    oscG2.connect(baseOscGain);
    baseOscGain.connect(this.bgmBaseGain);

    // Lowpass muffled noise floor
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.createNoiseBuffer(ctx);
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(400, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015, now); // -36dB hum

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.bgmBaseGain);

    baseLfo.start(now);
    oscC2.start(now);
    oscG2.start(now);
    noiseSource.start(now);

    // ────────────────────────────────────────────────────────
    // 2. DRIVING LAYER: 120 bpm (2.0 Hz) rhythmic sub-bass pulse
    // ────────────────────────────────────────────────────────
    const pulseOsc = ctx.createOscillator();
    pulseOsc.type = 'triangle';
    pulseOsc.frequency.setValueAtTime(55, now); // low A1/C2 range pulse

    // Sine LFO gating the gain at 2.0 Hz (120 bpm heartbeat)
    const pulseLfo = ctx.createOscillator();
    pulseLfo.type = 'sine';
    pulseLfo.frequency.setValueAtTime(2.0, now);

    const pulseLfoGain = ctx.createGain();
    pulseLfoGain.gain.setValueAtTime(0.2, now); // scale

    const pulseGateGain = ctx.createGain();
    pulseGateGain.gain.setValueAtTime(0.2, now); // swings 0.0 to 0.4 gain

    pulseLfo.connect(pulseLfoGain);
    pulseLfoGain.connect(pulseGateGain.gain);

    pulseOsc.connect(pulseGateGain);
    pulseGateGain.connect(this.bgmDrivingGain);

    pulseLfo.start(now);
    pulseOsc.start(now);

    // ────────────────────────────────────────────────────────
    // 3. TENSION LAYER: Minor 2nd dissonance (Db2 @ 69.30 Hz)
    // ────────────────────────────────────────────────────────
    const tensionOsc = ctx.createOscillator();
    tensionOsc.type = 'sine';
    tensionOsc.frequency.setValueAtTime(69.30, now); // Beating tension frequency against C2 (65.41 Hz)

    const tensionOscGain = ctx.createGain();
    tensionOscGain.gain.setValueAtTime(0.22, now);

    tensionOsc.connect(tensionOscGain);
    tensionOscGain.connect(this.bgmTensionGain);

    tensionOsc.start(now);

    this.bgmInitialized = true;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Play a sound effect with voice limit gating and click-debouncing.
   */
  async playSFX(event: SFXEvent): Promise<void> {
    if (this.settings.muted) return;

    if (!this.ctx) {
      this.init();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Debounce pour SFX to prevent volume stacking on rapid inputs
    if (event === 'pour') {
      if (Date.now() - this.lastPourTime < 80) return;
      this.lastPourTime = Date.now();
    }

    if (!this.ctx || !this.sfxGain) return;

    // Route event triggers to SynthSFX methods
    switch (event) {
      case 'pour':
        SynthSFX.playPour(this.ctx, this.sfxGain, 1.0);
        break;
      case 'success':
        SynthSFX.playSuccess(this.ctx, this.sfxGain, 1.0);
        break;
      case 'failure':
        SynthSFX.playFailure(this.ctx, this.sfxGain, 1.0);
        break;
      case 'uiClick':
        SynthSFX.playUiClick(this.ctx, this.sfxGain, 1.0);
        break;
      case 'uiHover':
        SynthSFX.playUiHover(this.ctx, this.sfxGain, 1.0);
        break;
      case 'comboMilestone':
        SynthSFX.playComboMilestone(this.ctx, this.sfxGain, 1.0);
        break;
      case 'waveClear':
        SynthSFX.playWaveClear(this.ctx, this.sfxGain, 1.0);
        break;
      case 'clientArriveWizard':
        SynthSFX.playClientArrive(this.ctx, this.sfxGain, 'wizard', 1.0);
        break;
      case 'clientArriveZombie':
        SynthSFX.playClientArrive(this.ctx, this.sfxGain, 'zombie', 1.0);
        break;
      case 'clientArriveVillager':
        SynthSFX.playClientArrive(this.ctx, this.sfxGain, 'villager', 1.0);
        break;
      default:
        break;
    }
  }

  /**
   * Set BGM state (crossfades driving & tension sub-layers over 2 seconds)
   */
  async setBGMState(state: BGMState): Promise<void> {
    if (state === this.currentBGMState) return;
    this.currentBGMState = state;

    if (!this.ctx) {
      this.init();
    }

    if (this.ctx && this.ctx.state === 'suspended' && state !== 'silent') {
      await this.ctx.resume();
    }

    if (!this.bgmBaseGain || !this.bgmDrivingGain || !this.bgmTensionGain) return;

    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const fadeTime = 2.0;

    let targetBase = 0;
    let targetDriving = 0;
    let targetTension = 0;

    if (state === 'ambient') {
      targetBase = 1.0;
      targetDriving = 0.0;
      targetTension = 0.0;
    } else if (state === 'driving') {
      targetBase = 1.0;
      targetDriving = 1.0;
      targetTension = 0.0;
    } else if (state === 'tension') {
      targetBase = 1.0;
      targetDriving = 1.0;
      targetTension = 1.0;
    } else if (state === 'silent') {
      targetBase = 0.0;
      targetDriving = 0.0;
      targetTension = 0.0;
    }

    // Schedule linear crossfades
    this.bgmBaseGain.gain.setValueAtTime(this.bgmBaseGain.gain.value, now);
    this.bgmBaseGain.gain.linearRampToValueAtTime(targetBase, now + fadeTime);

    this.bgmDrivingGain.gain.setValueAtTime(this.bgmDrivingGain.gain.value, now);
    this.bgmDrivingGain.gain.linearRampToValueAtTime(targetDriving, now + fadeTime);

    this.bgmTensionGain.gain.setValueAtTime(this.bgmTensionGain.gain.value, now);
    this.bgmTensionGain.gain.linearRampToValueAtTime(targetTension, now + fadeTime);

    if (state === 'silent') {
      // After crossfade completes (2s + buffer), suspend context to release CPU cycles
      setTimeout(async () => {
        if (this.currentBGMState === 'silent') {
          await this.ctx?.suspend();
        }
      }, 2100);
    }
  }

  /** Update audio settings */
  updateSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.applyVolumes();
  }

  /** Get current settings */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /** Apply volume modifications directly to node buses */
  private applyVolumes(): void {
    if (!this.masterGain || !this.sfxGain || !this.bgmGain) return;

    const now = this.ctx ? this.ctx.currentTime : 0;
    const masterVol = this.settings.muted ? 0 : this.settings.masterVolume;
    
    this.masterGain.gain.setValueAtTime(masterVol, now);
    this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, now);
    this.bgmGain.gain.setValueAtTime(this.settings.bgmVolume, now);
  }

  /** Toggle mute state */
  toggleMute(): void {
    this.settings.muted = !this.settings.muted;
    this.applyVolumes();
  }

  /** Stop BGM playback by suspending context */
  stopAll(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  /** Clean up resources */
  destroy(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
      this.sfxGain = null;
      this.bgmGain = null;
      this.bgmBaseGain = null;
      this.bgmDrivingGain = null;
      this.bgmTensionGain = null;
      this.bgmInitialized = false;
    }
  }
}

export const audioManager = AudioManager.getInstance();
export default AudioManager;
