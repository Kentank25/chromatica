/**
 * @module waveManager
 * Wave configuration and progression logic for Chromatica v2.
 */

import type { WaveDefinition, IngredientId } from '../types/game.types';

// ---------------------------------------------------------------------------
// Wave metrics generator
// ---------------------------------------------------------------------------

/**
 * Evaluates and returns the strict scaling configuration for any active wave.
 * Corrects legacy fractional rounding issues and safely extrapolates into infinite play.
 */
export const getWaveMetrics = (
  waveNumber: number,
  difficultyMode: 'apprentice' | 'journeyman' | 'master' = 'journeyman'
): WaveDefinition => {
  // Base core assets unlocked through progression milestones
  const allIngredients: IngredientId[] = [
    'red', 'blue', 'yellow', 'green', 'white', 'black', 
    'orange', 'purple', 'teal', 'magenta', 'ochre', 'silver'
  ];

  // Primary Configuration Matrix for Waves 1-10
  const primaryWaves = [
    { basePatience: 45000, multiplier: 1.0, target: 200, clients: 5 },
    { basePatience: 40000, multiplier: 1.2, target: 400, clients: 7 },
    { basePatience: 35000, multiplier: 1.4, target: 650, clients: 8 },
    { basePatience: 30000, multiplier: 1.6, target: 900, clients: 9 },
    { basePatience: 25000, multiplier: 1.8, target: 1200, clients: 10 },
    { basePatience: 22000, multiplier: 2.0, target: 1500, clients: 11 },
    { basePatience: 20000, multiplier: 2.2, target: 1800, clients: 12 },
    { basePatience: 18000, multiplier: 2.4, target: 2100, clients: 13 },
    { basePatience: 16000, multiplier: 2.6, target: 2400, clients: 14 },
    { basePatience: 15000, multiplier: 3.0, target: 3000, clients: 15 }
  ];

  let config: WaveDefinition;

  if (waveNumber <= 10) {
    const primary = primaryWaves[waveNumber - 1];
    // Enforce progressive ingredient restriction gates based on the current wave number
    const activeIngredients = allIngredients.slice(0, 8 + Math.min(4, Math.floor((waveNumber - 1) / 1.5)));
    
    config = {
      waveNumber,
      clientsRequired: primary.clients,
      availableIngredients: activeIngredients,
      basePatienceMs: primary.basePatience,
      difficultyMultiplier: primary.multiplier,
      targetScore: primary.target,
      description: `Wave ${waveNumber}: Standard alchemical match protocol.`
    };
  } else {
    // Endless Mode Extrapolation Layer
    const scaleFactor = waveNumber - 10;
    const endlessClients = 15 + Math.min(scaleFactor, 10); // Ceiling cap at 25 clients max
    const endlessPatience = Math.max(8000, 15000 - (scaleFactor * 500)); // Floor cap at 8000ms minimum
    const endlessMultiplier = 3.0 + (scaleFactor * 0.2); // Continuous fractional tracking
    const endlessTargetScore = 3000 + (scaleFactor * 400);

    config = {
      waveNumber,
      clientsRequired: endlessClients,
      availableIngredients: allIngredients, // Full inventory palette unlocked
      basePatienceMs: endlessPatience,
      difficultyMultiplier: endlessMultiplier,
      targetScore: endlessTargetScore,
      description: `Endless Mode Wave ${waveNumber}: Advanced alchemical runtime environment.`
    };
  }

  if (difficultyMode === 'apprentice') {
    config.targetScore = Math.round(config.targetScore / 2);
  }

  return config;
};

// ---------------------------------------------------------------------------
// Wave clear check
// ---------------------------------------------------------------------------

/**
 * Determines whether a wave has been cleared.
 *
 * A wave is considered clear when the player has served all clients
 * AND accumulated enough score to meet the wave's target.
 */
export function isWaveClear(
  clientsServed: number,
  score: number,
  waveConfig: WaveDefinition,
): boolean {
  return (
    clientsServed >= waveConfig.clientsRequired && score >= waveConfig.targetScore
  );
}
