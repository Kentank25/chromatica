/**
 * settingsStore - Zustand store for audio and game settings
 * 
 * Persists volume levels and mute state to localStorage.
 */
import { create } from 'zustand';
import type { AudioSettings } from '../types/audio.types';

interface SettingsState extends AudioSettings {
  setVolume: (channel: 'master' | 'bgm' | 'sfx', value: number) => void;
  toggleMute: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'chromatica-settings';

function persistSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable
  }
}

function loadSettings(): AudioSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AudioSettings;
  } catch {
    return null;
  }
}

const defaults: AudioSettings = {
  masterVolume: 1.0,
  bgmVolume: 0.5,
  sfxVolume: 0.8,
  muted: false,
};

const saved = loadSettings();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...(saved ?? defaults),

  setVolume: (channel, value) => {
    const clamped = Math.max(0, Math.min(1, value));
    const map = { master: 'masterVolume', bgm: 'bgmVolume', sfx: 'sfxVolume' } as const;
    const key = map[channel];
    set({ [key]: clamped } as Partial<SettingsState>);
    const state = get();
    persistSettings({
      masterVolume: state.masterVolume,
      bgmVolume: state.bgmVolume,
      sfxVolume: state.sfxVolume,
      muted: state.muted,
    });
  },

  toggleMute: () => {
    set((s) => ({ muted: !s.muted }));
    const state = get();
    persistSettings({
      masterVolume: state.masterVolume,
      bgmVolume: state.bgmVolume,
      sfxVolume: state.sfxVolume,
      muted: state.muted,
    });
  },

  loadFromStorage: () => {
    const s = loadSettings();
    if (s) set(s);
  },
}));
