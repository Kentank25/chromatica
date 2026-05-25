/**
 * @module waveManager
 * Wave configuration and progression logic for Chromatica v2.
 *
 * Defines how many clients appear per wave, the difficulty curve,
 * and the score target required to clear each wave.
 */

import { clamp } from '../utils/mathUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration for a single wave. */
export interface WaveConfig {
  /** Number of clients to serve in this wave. */
  clientCount: number;
  /** Difficulty level passed to target colour generation (1-3). */
  difficultyLevel: number;
  /** Minimum cumulative score to clear the wave. */
  targetScore: number;
}

// ---------------------------------------------------------------------------
// Wave configuration
// ---------------------------------------------------------------------------

/**
 * Returns the configuration for a given wave number.
 *
 * Scaling rules:
 * | Wave | Clients | Difficulty | Target Score |
 * |------|---------|------------|--------------|
 * | 1    | 5       | 1.0        | 200          |
 * | 2    | 7       | 1.5        | 400          |
 * | 3    | 8       | 2.0        | 650          |
 * | 4    | 9       | 2.3        | 900          |
 * | 5    | 10      | 2.5        | 1200         |
 * | 6+   | 10+1/wave | 3.0 cap | scales       |
 *
 * @param waveNumber - 1-based wave index.
 */
export function getWaveConfig(waveNumber: number): WaveConfig {
  const w = Math.max(1, Math.round(waveNumber));

  switch (w) {
    case 1:
      return { clientCount: 5, difficultyLevel: 1.0, targetScore: 200 };
    case 2:
      return { clientCount: 7, difficultyLevel: 1.5, targetScore: 400 };
    case 3:
      return { clientCount: 8, difficultyLevel: 2.0, targetScore: 650 };
    case 4:
      return { clientCount: 9, difficultyLevel: 2.3, targetScore: 900 };
    case 5:
      return { clientCount: 10, difficultyLevel: 2.5, targetScore: 1200 };
    default: {
      // Waves 6+: gradual scaling
      const clientCount = clamp(10 + Math.floor((w - 5) / 2), 10, 15);
      const difficultyLevel = clamp(2.5 + (w - 5) * 0.1, 2.5, 3.0);
      const targetScore = 1200 + (w - 5) * 300;
      return { clientCount, difficultyLevel, targetScore };
    }
  }
}

// ---------------------------------------------------------------------------
// Wave clear check
// ---------------------------------------------------------------------------

/**
 * Determines whether a wave has been cleared.
 *
 * A wave is considered clear when the player has served all clients
 * AND accumulated enough score to meet the wave's target.
 *
 * @param clientsServed - Number of clients successfully served this wave.
 * @param score         - Cumulative score earned during this wave.
 * @param waveConfig    - The active wave's configuration.
 */
export function isWaveClear(
  clientsServed: number,
  score: number,
  waveConfig: WaveConfig,
): boolean {
  return (
    clientsServed >= waveConfig.clientCount && score >= waveConfig.targetScore
  );
}
