/**
 * @module scoring
 * Scoring engine for Chromatica v2.
 *
 * Evaluates submitted potions against client targets, awards points
 * with combo and speed bonuses, and manages combo reward thresholds.
 */

import type { RGB } from '../types/color.types';
import type { Client, EvaluationResult } from '../types/game.types';
import { computeAccuracy, computeDeltaE } from './colorScience';
import { clamp } from '../utils/mathUtils';

// ---------------------------------------------------------------------------
// Potion evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluates a submitted potion colour against the client's target.
 *
 * **Scoring formula:**
 * 1. Base points = floor(100 × (accuracy / 100) × clientMultiplier)
 * 2. Combo bonus = +10 % per combo level (applied to base)
 * 3. Speed bonus = +5-20 % based on remaining time vs. client patience
 *
 * A potion *passes* if `accuracy / 100 >= client.modifiers.accuracyThreshold`.
 * Failed potions earn 0 points.
 *
 * @param target        - The colour the client requested.
 * @param submitted     - The colour the player mixed.
 * @param client        - The current client (provides modifiers).
 * @param timeRemaining - Seconds remaining on the client's patience timer.
 * @param comboStreak   - Current consecutive-success streak (before this attempt).
 * @returns A detailed {@link EvaluationResult}.
 */
export function evaluatePotion(
  target: RGB,
  submitted: RGB,
  client: Client,
  timeRemaining: number,
  comboStreak: number,
): EvaluationResult {
  const accuracy = computeAccuracy(target, submitted);
  const deltaE = computeDeltaE(target, submitted);
  const passed = accuracy / 100 >= client.modifiers.accuracyThreshold;

  if (!passed) {
    return {
      accuracy,
      deltaE,
      passed: false,
      pointsEarned: 0,
      comboBonus: 0,
      speedBonus: 0,
    };
  }

  // --- Base points ---
  const basePoints = Math.floor(
    100 * (accuracy / 100) * client.modifiers.scoreMultiplier,
  );

  // --- Combo bonus: +10 % per combo level ---
  const comboMultiplier = 1 + comboStreak * 0.1;
  const comboBonus = Math.floor(basePoints * comboStreak * 0.1);

  // --- Speed bonus: 5-20 % based on time remaining vs patience ---
  const timeRatio = clamp(timeRemaining / client.modifiers.patience, 0, 1);
  // 5 % at the wire (timeRatio ≈ 0), up to 20 % when nearly full time remains
  const speedPercent = 0.05 + 0.15 * timeRatio;
  const pointsBeforeSpeed = Math.floor(basePoints * comboMultiplier);
  const speedBonus = Math.floor(pointsBeforeSpeed * speedPercent);

  const totalPoints = pointsBeforeSpeed + speedBonus;

  return {
    accuracy,
    deltaE,
    passed: true,
    pointsEarned: totalPoints,
    comboBonus,
    speedBonus,
  };
}

// ---------------------------------------------------------------------------
// Combo rewards
// ---------------------------------------------------------------------------

/**
 * Checks whether the current combo streak earns a power-up token.
 *
 * Thresholds (awarded once when the streak *reaches* the value):
 * - 3× → `skip`
 * - 5× → `hint`
 * - 7× → `autoCorrect`
 *
 * @param streak - Current combo streak (after the latest success).
 * @returns The reward token type, or `null` if no reward at this level.
 */
export function getComboReward(
  streak: number,
): 'skip' | 'hint' | 'autoCorrect' | null {
  switch (streak) {
    case 3:
      return 'skip';
    case 5:
      return 'hint';
    case 7:
      return 'autoCorrect';
    default:
      return null;
  }
}
