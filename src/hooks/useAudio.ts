/**
 * useAudio - React hook for audio system lifecycle management
 * 
 * Initializes the AudioManager on first user interaction (autoplay compliance)
 * and provides convenient methods for playing SFX.
 */
import { useCallback, useEffect, useRef } from 'react';
import { audioManager } from '../audio/AudioManager';
import { musicManager } from '../audio/MusicManager';
import type { SFXEvent } from '../types/audio.types';
import { useSettingsStore } from '../store/settingsStore';

export function useAudio() {
  const initialized = useRef(false);

  // Sync store settings with audio manager and music manager
  useEffect(() => {
    let lastBgmVolume = useSettingsStore.getState().bgmVolume;
    let lastMuted = useSettingsStore.getState().muted;

    const state = useSettingsStore.getState();
    audioManager.updateSettings({
      masterVolume: state.masterVolume,
      bgmVolume: state.bgmVolume,
      sfxVolume: state.sfxVolume,
      muted: state.muted,
    });
    musicManager.setVolume(state.bgmVolume);
    musicManager.setMuted(state.muted);

    const unsub = useSettingsStore.subscribe((s) => {
      audioManager.updateSettings({
        masterVolume: s.masterVolume,
        bgmVolume: s.bgmVolume,
        sfxVolume: s.sfxVolume,
        muted: s.muted,
      });

      if (s.bgmVolume !== lastBgmVolume) {
        lastBgmVolume = s.bgmVolume;
        musicManager.setVolume(s.bgmVolume);
      }

      if (s.muted !== lastMuted) {
        lastMuted = s.muted;
        musicManager.setMuted(s.muted);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  /** Initialize audio on first user gesture */
  const initAudio = useCallback(() => {
    if (initialized.current) return;
    audioManager.init();
    const ctx = audioManager.getContext();
    if (ctx) {
      musicManager.connectContext(ctx);
    }
    initialized.current = true;
  }, []);

  /** Play a sound effect */
  const playSFX = useCallback((event: SFXEvent) => {
    if (!initialized.current) {
      audioManager.init();
      const ctx = audioManager.getContext();
      if (ctx) {
        musicManager.connectContext(ctx);
      }
      initialized.current = true;
    }
    audioManager.playSFX(event);
  }, []);

  /** Toggle mute */
  const toggleMute = useCallback(() => {
    audioManager.toggleMute();
  }, []);

  return { initAudio, playSFX, toggleMute };
}
