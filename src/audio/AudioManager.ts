/**
 * AudioManager - Centralized audio system for Chromatica v2
 * 
 * Manages BGM and SFX playback through Howler.js with:
 * - Master/BGM/SFX bus volume control
 * - Voice limiting to prevent audio overload
 * - Browser autoplay compliance (requires user gesture)
 */
import { Howl } from 'howler';
import type { SFXEvent, BGMState, AudioSettings } from '../types/audio.types';

/** Voice limit per SFX event type */
const VOICE_LIMITS: Record<SFXEvent, number> = {
  pour: 1,
  success: 2,
  failure: 2,
  clientArriveWizard: 1,
  clientArriveZombie: 1,
  clientArriveVillager: 1,
  uiClick: 1,
  uiHover: 1,
  comboMilestone: 1,
  waveClear: 1,
};

/** Active voice count per event */
const activeVoices: Partial<Record<SFXEvent, number>> = {};

class AudioManager {
  private static instance: AudioManager;
  private sfxSounds: Map<SFXEvent, Howl> = new Map();
  private bgmTracks: Map<BGMState, Howl> = new Map();
  private currentBGMState: BGMState = 'silent';
  private settings: AudioSettings = {
    masterVolume: 1.0,
    bgmVolume: 0.5,
    sfxVolume: 0.8,
    muted: false,
  };
  private initialized = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize audio system. Should be called on first user gesture.
   * Uses procedurally generated tones since we don't have audio files yet.
   */
  init(): void {
    if (this.initialized) return;

    // Generate minimal placeholder SFX using oscillator tones via data URIs
    // These will be replaced with real audio assets later
    this.generatePlaceholderSFX();
    this.initialized = true;
  }

  /** Generate simple placeholder SFX using Howler with empty/silent sources */
  private generatePlaceholderSFX(): void {
    // For now, create silent howls as stubs — real audio files come in Phase 4
    const silentDataUri = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

    const sfxEvents: SFXEvent[] = [
      'pour', 'success', 'failure',
      'clientArriveWizard', 'clientArriveZombie', 'clientArriveVillager',
      'uiClick', 'uiHover', 'comboMilestone', 'waveClear'
    ];

    for (const event of sfxEvents) {
      this.sfxSounds.set(event, new Howl({
        src: [silentDataUri],
        volume: this.getEffectiveSFXVolume(),
        preload: true,
      }));
    }
  }

  /** Play a sound effect with voice limiting */
  playSFX(event: SFXEvent): void {
    if (this.settings.muted) return;

    const sound = this.sfxSounds.get(event);
    if (!sound) return;

    const currentVoices = activeVoices[event] ?? 0;
    const limit = VOICE_LIMITS[event] ?? 1;

    if (currentVoices >= limit) return; // Drop excess triggers

    activeVoices[event] = currentVoices + 1;
    sound.volume(this.getEffectiveSFXVolume());

    const id = sound.play();
    sound.once('end', () => {
      activeVoices[event] = Math.max(0, (activeVoices[event] ?? 1) - 1);
    }, id);
  }

  /** Set BGM state (crossfade between layers) */
  setBGMState(state: BGMState): void {
    if (state === this.currentBGMState) return;
    this.currentBGMState = state;
    // BGM crossfading will be implemented with real audio tracks
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

  /** Apply current volume levels to all active sounds */
  private applyVolumes(): void {
    const sfxVol = this.getEffectiveSFXVolume();
    for (const sound of this.sfxSounds.values()) {
      sound.volume(sfxVol);
    }

    const bgmVol = this.getEffectiveBGMVolume();
    for (const track of this.bgmTracks.values()) {
      track.volume(bgmVol);
    }
  }

  private getEffectiveSFXVolume(): number {
    if (this.settings.muted) return 0;
    return this.settings.masterVolume * this.settings.sfxVolume;
  }

  private getEffectiveBGMVolume(): number {
    if (this.settings.muted) return 0;
    return this.settings.masterVolume * this.settings.bgmVolume;
  }

  /** Toggle mute state */
  toggleMute(): void {
    this.settings.muted = !this.settings.muted;
    this.applyVolumes();
  }

  /** Stop all audio */
  stopAll(): void {
    for (const sound of this.sfxSounds.values()) {
      sound.stop();
    }
    for (const track of this.bgmTracks.values()) {
      track.stop();
    }
  }

  /** Clean up resources */
  destroy(): void {
    this.stopAll();
    for (const sound of this.sfxSounds.values()) {
      sound.unload();
    }
    for (const track of this.bgmTracks.values()) {
      track.unload();
    }
    this.sfxSounds.clear();
    this.bgmTracks.clear();
    this.initialized = false;
  }
}

export const audioManager = AudioManager.getInstance();
export default AudioManager;
