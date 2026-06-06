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
import { detectEffect } from './potionEffects';
import { computeReactionTier, computeTipReward, generateReactionDialogue } from './reactionEngine';
import { PERK_POOL } from './perksManager';

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
 * 4. Picky Noble penalty = deductions if ingredients are wasteful
 * 5. Effect bonus = +15% of base points if requested effect is matched
 *
 * A potion *passes* if `accuracy / 100 >= client.modifiers.accuracyThreshold`.
 * Failed potions earn 0 points.
 *
 * @param target         - The colour the client requested.
 * @param submitted      - The colour the player mixed.
 * @param client         - The current client (provides modifiers).
 * @param timeRemaining  - Seconds remaining on the client's patience timer.
 * @param comboStreak    - Current consecutive-success streak (before this attempt).
 * @param efficiencyData - Optional details about ingredients used for picky noble checks.
 * @param playerMixColor - The raw mixed color (used to detect effects).
 * @returns A detailed {@link EvaluationResult}.
 */
export function evaluatePotion(
  target: RGB,
  submitted: RGB,
  client: Client,
  timeRemaining: number,
  comboStreak: number,
  efficiencyData?: { ingredientsUsed: number; totalAmount: number },
  playerMixColor?: RGB,
  activePerkIds: string[] = [],
): EvaluationResult {
  const accuracy = computeAccuracy(target, submitted);
  const deltaE = computeDeltaE(target, submitted);
  // Compare rounded accuracy to prevent frustrating rounding display mismatches (e.g. 79.96% displaying as 80.0% but failing)
  const displayAccuracy = Math.round(accuracy * 10) / 10;
  const targetThreshold = Math.round(client.modifiers.accuracyThreshold * 100 * 10) / 10;
  const passed = displayAccuracy >= targetThreshold;

  // Compute common elements (effects, reactions)
  const detectedEffect = playerMixColor ? detectEffect(playerMixColor) : null;
  const reactionTier = computeReactionTier(accuracy, passed);
  const reactionDialogue = generateReactionDialogue(client.type, reactionTier);

  if (!passed) {
    return {
      accuracy,
      deltaE,
      passed: false,
      pointsEarned: 0,
      comboBonus: 0,
      speedBonus: 0,
      detectedEffect,
      requestedEffect: client.requestedEffect,
      effectBonus: 0,
      reactionTier,
      tipReward: null,
      reactionDialogue,
    };
  }

  // --- Calculate perk multipliers ---
  let scoreMult = 1.0;
  let comboMult = 1.0;
  let patienceMult = 1.0;
  for (const perkId of activePerkIds) {
    const perk = PERK_POOL.find((p) => p.id === perkId);
    if (perk) {
      if (perk.scoreMultiplier) scoreMult *= perk.scoreMultiplier;
      if (perk.comboMultiplier) comboMult *= perk.comboMultiplier;
      if (perk.patienceMultiplier) patienceMult *= perk.patienceMultiplier;
    }
  }

  // --- Base points ---
  const basePoints = Math.floor(
    100 * (accuracy / 100) * client.modifiers.scoreMultiplier,
  );

  // --- Picky Noble Efficiency Penalty ---
  let efficiencyDeduction = 0;
  const optimalIngredients = client.modifiers.maxIngredients ?? 3;

  if (client.modifiers.efficiencyPenalty && efficiencyData) {
    const { ingredientsUsed, totalAmount } = efficiencyData;
    const extraIngredients = Math.max(0, ingredientsUsed - (optimalIngredients + 1));
    let penaltyPercent = 0;

    if (extraIngredients > 0) {
      penaltyPercent += extraIngredients * 0.08;
    }
    if (totalAmount > 15) {
      penaltyPercent += 0.05;
    }

    // Cap deduction at 40% of base points
    penaltyPercent = Math.min(0.40, penaltyPercent);
    efficiencyDeduction = Math.floor(basePoints * penaltyPercent);
  }

  // --- Combo bonus: +10 % per combo level (capped at 3.0x / 20 streak) ---
  const rawComboMultiplier = getComboMultiplier(comboStreak);
  const comboBonusPart = rawComboMultiplier - 1.0;
  const comboMultiplier = 1.0 + comboBonusPart * comboMult;
  const comboBonus = Math.floor(basePoints * Math.min(comboStreak, 20) * 0.1 * comboMult);

  // --- Speed bonus: 5-20 % based on time remaining vs patience ---
  const actualPatience = client.modifiers.patience * patienceMult;
  const timeRatio = clamp(timeRemaining / actualPatience, 0, 1);
  // 5 % at the wire (timeRatio ≈ 0), up to 20 % when nearly full time remains
  const speedPercent = 0.05 + 0.15 * timeRatio;
  const pointsBeforeSpeed = Math.floor(basePoints * comboMultiplier);
  const speedBonus = Math.floor(pointsBeforeSpeed * speedPercent);

  // --- Effect Match Bonus ---
  let effectBonus = 0;
  if (client.requestedEffect && client.requestedEffect === detectedEffect) {
    const multiplier = client.modifiers.effectBonusMultiplier ?? 0.15;
    effectBonus = Math.floor(basePoints * multiplier);
  }

  // Apply efficiency deduction and add effect bonus to total points earned
  const totalPoints = Math.max(0, pointsBeforeSpeed + speedBonus + effectBonus - efficiencyDeduction);
  const finalPoints = Math.floor(totalPoints * scoreMult);

  // --- Tip Reward ---
  const tipReward = computeTipReward(reactionTier);

  return {
    accuracy,
    deltaE,
    passed: true,
    pointsEarned: finalPoints,
    comboBonus,
    speedBonus,
    efficiencyDeduction,
    ingredientsUsed: efficiencyData?.ingredientsUsed,
    optimalIngredients,
    detectedEffect,
    requestedEffect: client.requestedEffect,
    effectBonus,
    reactionTier,
    tipReward,
    reactionDialogue,
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

/**
 * Calculates the active gameplay score multiplier driven by the player's current streak.
 * Enforces a strict ceiling cap to prevent runaway scoring in infinite or high-volume waves.
 */
export function getComboMultiplier(streak: number): number {
  const rawMultiplier = 1 + streak * 0.1;
  const rounded = Math.round(rawMultiplier * 10) / 10;
  return Math.min(rounded, 3.0);
}
