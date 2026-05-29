/**
 * AudioManager - Centralized audio system for Chromatica v2
 * 
 * Manages SFX playback through Web Audio API procedural synthesis.
 * Supports Master/SFX bus gain staging.
 */
import type { SFXEvent, AudioSettings } from '../types/audio.types';
import { SynthSFX } from './SynthSFX';

class AudioManager {
  private static instance: AudioManager;
  
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private settings: AudioSettings = {
    masterVolume: 1.0,
    bgmVolume: 0.5,
    sfxVolume: 0.8,
    muted: false,
  };
  
  private lastPourTime = 0;

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

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Create Mixer Gains
    this.masterGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Apply current settings to nodes
    this.applyVolumes();
  }

  /**
   * Get the shared AudioContext
   */
  getContext(): AudioContext | null {
    return this.ctx;
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
      case 'achievementUnlock':
        SynthSFX.playAchievementUnlock(this.ctx, this.sfxGain, 1.0);
        break;
      case 'timeout':
        SynthSFX.playTimeout(this.ctx, this.sfxGain, 1.0);
        break;
      default:
        break;
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
    if (!this.masterGain || !this.sfxGain) return;

    const now = this.ctx ? this.ctx.currentTime : 0;
    const masterVol = this.settings.muted ? 0 : this.settings.masterVolume;
    
    this.masterGain.gain.setValueAtTime(masterVol, now);
    this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, now);
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
    }
  }
}

export const audioManager = AudioManager.getInstance();
export default AudioManager;
