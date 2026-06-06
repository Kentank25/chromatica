/**
 * MusicManager - Background music system for Chromatica v2
 * 
 * Manages BGM loading, smooth crossfading, intensity scaling (playback rate + highpass),
 * and volume/mute settings using the player's file assets.
 */
import type { MusicTrackKey, IntensityLevel } from './music.types';
import { useSettingsStore } from '../store/settingsStore';
import { audioManager } from './AudioManager';

import menuMp3 from '@/assets/audio/menu.mp3';
import menuOgg from '@/assets/audio/menu.ogg';
import wave1Mp3 from '@/assets/audio/wave1.mp3';
import wave1Ogg from '@/assets/audio/wave1.ogg';
import wave2Mp3 from '@/assets/audio/wave2.mp3';
import wave2Ogg from '@/assets/audio/wave2.ogg';
import wave3Mp3 from '@/assets/audio/wave3.mp3';
import wave3Ogg from '@/assets/audio/wave3.ogg';
import resultsMp3 from '@/assets/audio/results.mp3';
import resultsOgg from '@/assets/audio/results.ogg';

const TRACK_URLS: Record<MusicTrackKey, { mp3: string; ogg: string }> = {
  menu: { mp3: menuMp3, ogg: menuOgg },
  wave1: { mp3: wave1Mp3, ogg: wave1Ogg },
  wave2: { mp3: wave2Mp3, ogg: wave2Ogg },
  wave3: { mp3: wave3Mp3, ogg: wave3Ogg },
  results: { mp3: resultsMp3, ogg: resultsOgg },
};

function supportsOgg(): boolean {
  try {
    return new Audio().canPlayType('audio/ogg') !== '';
  } catch {
    return false;
  }
}

export class MusicManager {
  private static instance: MusicManager;

  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private intensityFilter: BiquadFilterNode | null = null;

  private cache = new Map<MusicTrackKey, AudioBuffer>();
  private loading = new Map<MusicTrackKey, Promise<AudioBuffer | null>>();

  private activeSourceNode: AudioBufferSourceNode | null = null;
  private activeSourceGain: GainNode | null = null;
  private fadingSources = new Set<AudioBufferSourceNode>();

  private currentTrackKey: MusicTrackKey | null = null;
  private currentIntensity: IntensityLevel = 'normal';
  private bgmVolume = 0.5;
  private muted = false;
  private isTransitioning = false;

  private constructor() {}

  static getInstance(): MusicManager {
    if (!MusicManager.instance) {
      MusicManager.instance = new MusicManager();
    }
    return MusicManager.instance;
  }

  /**
   * Connect to the shared AudioContext initialized by AudioManager
   */
  connectContext(ctx: AudioContext): void {
    if (this.ctx) return; // already connected

    this.ctx = ctx;
    this.bgmGain = ctx.createGain();
    this.intensityFilter = ctx.createBiquadFilter();
    this.intensityFilter.type = 'highpass';
    this.intensityFilter.frequency.setValueAtTime(10, ctx.currentTime); // bypass default

    // Chain: source -> intensityFilter -> bgmGain -> masterGain (or fallback to destination)
    this.intensityFilter.connect(this.bgmGain);
    const masterGain = audioManager.getMasterGain();
    if (masterGain) {
      this.bgmGain.connect(masterGain);
    } else {
      this.bgmGain.connect(ctx.destination);
    }

    // Sync initial settings from Zustand store
    const { bgmVolume, muted } = useSettingsStore.getState();
    this.bgmVolume = bgmVolume;
    this.muted = muted;
    this.bgmGain.gain.setValueAtTime(this.muted ? 0 : this.bgmVolume, ctx.currentTime);
  }

  /**
   * Lazy load track buffers with cache validation
   */
  private async getBuffer(key: MusicTrackKey): Promise<AudioBuffer | null> {
    if (this.cache.has(key)) return this.cache.get(key)!;
    if (this.loading.has(key)) return this.loading.get(key)!;

    if (!this.ctx) {
      console.warn('[MusicManager] No AudioContext connected during buffer request.');
      return null;
    }

    const urls = TRACK_URLS[key];
    const url = supportsOgg() ? urls.ogg : urls.mp3;

    const promise = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => this.ctx!.decodeAudioData(buf))
      .then((decoded) => {
        this.cache.set(key, decoded);
        return decoded;
      })
      .catch((err) => {
        console.warn(`[MusicManager] Failed to load/decode track "${key}":`, err);
        return null;
      });

    this.loading.set(key, promise);
    return promise;
  }

  /**
   * Play a track with smooth crossfade
   */
  async play(key: MusicTrackKey, fadeMs = 2000): Promise<void> {
    if (!this.ctx || !this.intensityFilter) {
      console.warn('[MusicManager] Cannot play track before connectContext.');
      return;
    }

    if (this.currentTrackKey === key) return;

    const now = this.ctx.currentTime;
    const fadeSec = fadeMs / 1000;

    // Handle transition interruptions
    if (this.isTransitioning) {
      // Cancel previous fade by clearing active fading sources immediately
      this.fadingSources.forEach((src) => {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // ignore error if already stopped
        }
      });
      this.fadingSources.clear();
    }

    this.isTransitioning = true;
    this.currentTrackKey = key;

    // Reset intensity variables to normal on starting a new track
    this.currentIntensity = 'normal';
    this.intensityFilter.frequency.setValueAtTime(10, now);

    // Fetch decoded buffer asynchronously
    const buffer = await this.getBuffer(key);
    if (!buffer || this.currentTrackKey !== key) {
      this.isTransitioning = false;
      return; // gracefully ignore missing / invalid assets
    }

    const oldSource = this.activeSourceNode;
    const oldGain = this.activeSourceGain;

    // Fade out previous track
    if (oldSource && oldGain) {
      oldGain.gain.cancelScheduledValues(now);
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0, now + fadeSec);

      this.fadingSources.add(oldSource);
      const sourceToStop = oldSource;
      setTimeout(() => {
        try {
          sourceToStop.stop();
          sourceToStop.disconnect();
        } catch {
          // ignore error if already stopped
        }
        this.fadingSources.delete(sourceToStop);
      }, fadeMs + 100);
    }

    // Set up new track
    const newSource = this.ctx.createBufferSource();
    newSource.buffer = buffer;
    newSource.loop = true;
    newSource.playbackRate.setValueAtTime(1.0, now);

    const newTrackGain = this.ctx.createGain();
    newTrackGain.gain.setValueAtTime(0, now);
    newTrackGain.gain.linearRampToValueAtTime(1.0, now + fadeSec);

    newSource.connect(newTrackGain);
    newTrackGain.connect(this.intensityFilter);

    // Resume context if browser autoplay policy suspended it
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    newSource.start(now);

    this.activeSourceNode = newSource;
    this.activeSourceGain = newTrackGain;
    this.isTransitioning = false;
  }

  /**
   * Set playback speed and highpass filtering levels reactively
   */
  setIntensity(level: IntensityLevel): void {
    if (!this.ctx || !this.intensityFilter || this.currentIntensity === level) return;
    this.currentIntensity = level;

    const now = this.ctx.currentTime;
    const duration = 1.5;

    let rate = 1.0;
    let freq = 10;

    if (level === 'warning') {
      rate = 1.08;
      freq = 200;
    } else if (level === 'urgent') {
      rate = 1.18;
      freq = 500;
    }

    // Ramp highpass filter frequency
    this.intensityFilter.frequency.cancelScheduledValues(now);
    this.intensityFilter.frequency.setValueAtTime(this.intensityFilter.frequency.value, now);
    this.intensityFilter.frequency.linearRampToValueAtTime(freq, now + duration);

    // Ramp active track source playback rate
    if (this.activeSourceNode) {
      this.activeSourceNode.playbackRate.cancelScheduledValues(now);
      this.activeSourceNode.playbackRate.setValueAtTime(this.activeSourceNode.playbackRate.value, now);
      this.activeSourceNode.playbackRate.linearRampToValueAtTime(rate, now + duration);
    }
  }

  /**
   * Update active volume gain
   */
  setVolume(v: number): void {
    this.bgmVolume = v;
    if (this.bgmGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.bgmGain.gain.setValueAtTime(this.muted ? 0 : v, now);
    }
  }

  /**
   * Smoothly mute / unmute gain over 300ms
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.bgmGain && this.ctx) {
      const now = this.ctx.currentTime;
      const targetVol = muted ? 0 : this.bgmVolume;
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
      this.bgmGain.gain.linearRampToValueAtTime(targetVol, now + 0.3);
    }
  }

  /**
   * Preload BGM assets in parallel
   */
  async preloadAll(ctx: AudioContext): Promise<void> {
    this.connectContext(ctx);
    const keys: MusicTrackKey[] = ['menu', 'wave1', 'wave2', 'wave3', 'results'];
    await Promise.all(keys.map((k) => this.getBuffer(k)));
  }
}

export const musicManager = MusicManager.getInstance();
export default musicManager;
