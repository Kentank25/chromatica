/**
 * @module game.types
 * Game-session, client, and evaluation type definitions for Chromatica v2.
 */

import type { RGB } from './color.types';

/** The archetype of a visiting client. */
export type ClientType = 'villager' | 'wizard' | 'zombie' | 'noble' | 'mystic';

/** Facial expression shown by the client sprite. */
export type ClientExpression = 'neutral' | 'happy' | 'ecstatic' | 'annoyed' | 'enraged' | 'surprised';

/** High-level phase of the game loop. */
export type GamePhase =
  | 'idle'
  | 'playing'
  | 'evaluating'
  | 'result'
  | 'paused'
  | 'gameOver'
  | 'waveClear';

/** Potion effect types determined by HSL properties. */
export type PotionEffect = 'luminous' | 'shadowy' | 'vivid' | 'muted' | 'warm' | 'cool' | null;

/** Client reaction tiers based on accuracy and evaluation outcome. */
export type ReactionTier = 'terrible' | 'poor' | 'okay' | 'good' | 'excellent' | 'perfect';

/** Per-client-type gameplay modifiers. */
export interface ClientModifiers {
  /** Multiplier applied to base score when this client is served. */
  scoreMultiplier: number;
  /** Time (in seconds) before the client loses patience. */
  patience: number;
  /** Minimum accuracy (0-1) required to pass. */
  accuracyThreshold: number;
  /** Satisfaction deducted on failure. */
  penaltySeverity: number;
  // ── Picky Nobles ──
  efficiencyPenalty?: boolean;     // Whether this client checks ingredient efficiency
  maxIngredients?: number;         // Optimal ingredient count display limit
  // ── Potion Effects ──
  effectBonusMultiplier?: number;  // Multiplier for matching requested effect
}

/** A single customer visiting the potion shop. */
export interface Client {
  id: string;
  type: ClientType;
  name: string;
  targetColor: RGB;
  modifiers: ClientModifiers;
  expression: ClientExpression;
  // ── Multi-Color Orders ──
  subOrders?: RGB[];               // Sequential targets (length 2-3)
  currentSubOrder?: number;        // 0-based active sub-order index
  // ── Mystic ──
  colorDescription?: string;       // Text hint instead of visual swatch
  dialogue?: string;               // Speech bubble text upon arrival
  // ── Potion Effects ──
  requestedEffect?: PotionEffect;  // The specific magical effect they want
}

/** Persistent state for the current play-through. */
export interface GameSession {
  score: number;
  /** Overall shop satisfaction, 0-100. Game over at 0. */
  satisfaction: number;
  currentWave: number;
  comboStreak: number;
  highestCombo: number;
  potionsCompleted: number;
  potionsFailed: number;
  /** Consumable power-up tokens. */
  tokens: { skip: number; hint: number; autoCorrect: number };
  currentClient: Client | null;
  playerMix: RGB;
  waveHistory: WaveResult[];
  /** Seconds remaining for the current client. */
  timeRemaining: number;
  phase: GamePhase;
}

/** Summary of a completed wave. */
export interface WaveResult {
  waveNumber: number;
  clientsServed: number;
  averageAccuracy: number;
  pointsEarned: number;
}

/** Result of evaluating a submitted potion against the target. */
export interface EvaluationResult {
  /** 0-100 accuracy percentage. */
  accuracy: number;
  /** Raw CIE76 Delta-E distance. */
  deltaE: number;
  /** Whether the potion met the client's accuracy threshold. */
  passed: boolean;
  /** Total points earned (0 if failed). */
  pointsEarned: number;
  /** Bonus points from combo streak. */
  comboBonus: number;
  /** Bonus points from speed. */
  speedBonus: number;
  // ── Picky Nobles ──
  efficiencyDeduction?: number;    // Score penalty on wasteful ingredients
  ingredientsUsed?: number;        // Number of active ingredients
  optimalIngredients?: number;     // Ideal count
  // ── Potion Effects & Client Reactions ──
  detectedEffect?: PotionEffect;   // The effect the player's mix produced
  requestedEffect?: PotionEffect;  // The effect the client wanted
  effectBonus?: number;            // Bonus points earned from matching effect
  reactionTier?: ReactionTier;     // The reaction tier computed
  tipReward?: { type: 'score'; amount: number } | { type: 'token'; token: 'skip' | 'hint' | 'autoCorrect' } | null;
  reactionDialogue?: string;       // Dialogue spoken by client after evaluation
}
