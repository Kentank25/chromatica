/**
 * @module storageUtils
 * LocalStorage persistence helpers for Chromatica v2.
 */

import type { AudioSettings } from '../types/audio.types';

const HIGH_SCORES_KEY = 'chromatica_v2_high_scores';
const SETTINGS_KEY = 'chromatica_v2_settings';
const MAX_HIGH_SCORES = 10;

/**
 * Saves a new high score to localStorage.
 * Keeps only the top {@link MAX_HIGH_SCORES} entries, sorted descending.
 */
export function saveHighScore(score: number): void {
  const scores = getHighScores();
  scores.push(score);
  scores.sort((a, b) => b - a);
  const trimmed = scores.slice(0, MAX_HIGH_SCORES);
  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable — silently degrade.
  }
}

/**
 * Returns the saved high scores as a descending-sorted array (max 10).
 */
export function getHighScores(): number[] {
  try {
    const raw = localStorage.getItem(HIGH_SCORES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as number[])
      .filter((n) => typeof n === 'number' && Number.isFinite(n))
      .sort((a, b) => b - a)
      .slice(0, MAX_HIGH_SCORES);
  } catch {
    return [];
  }
}

/**
 * Persists audio settings to localStorage.
 */
export function saveSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Silently degrade.
  }
}

/**
 * Loads previously saved audio settings, or `null` if none exist.
 */
export function loadSettings(): AudioSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AudioSettings;
    // Basic validation
    if (
      typeof parsed.masterVolume !== 'number' ||
      typeof parsed.bgmVolume !== 'number' ||
      typeof parsed.sfxVolume !== 'number' ||
      typeof parsed.muted !== 'boolean'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
