/**
 * useAudio - React hook for audio system lifecycle management
 * 
 * Initializes the AudioManager on first user interaction (autoplay compliance)
 * and provides convenient methods for playing SFX.
 */
import { useCallback, useEffect, useRef } from 'react';
import { audioManager } from '../audio/AudioManager';
import type { SFXEvent, BGMState } from '../types/audio.types';
import { useSettingsStore } from '../store/settingsStore';

export function useAudio() {
  const initialized = useRef(false);
  const { masterVolume, bgmVolume, sfxVolume, muted } = useSettingsStore();

  // Sync store settings with audio manager
  useEffect(() => {
    audioManager.updateSettings({ masterVolume, bgmVolume, sfxVolume, muted });
  }, [masterVolume, bgmVolume, sfxVolume, muted]);

  /** Initialize audio on first user gesture */
  const initAudio = useCallback(() => {
    if (initialized.current) return;
    audioManager.init();
    initialized.current = true;
  }, []);

  /** Play a sound effect */
  const playSFX = useCallback((event: SFXEvent) => {
    if (!initialized.current) {
      audioManager.init();
      initialized.current = true;
    }
    audioManager.playSFX(event);
  }, []);

  /** Set BGM state */
  const setBGM = useCallback((state: BGMState) => {
    audioManager.setBGMState(state);
  }, []);

  /** Toggle mute */
  const toggleMute = useCallback(() => {
    audioManager.toggleMute();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't destroy — audio should persist across screens
    };
  }, []);

  return { initAudio, playSFX, setBGM, toggleMute };
}
