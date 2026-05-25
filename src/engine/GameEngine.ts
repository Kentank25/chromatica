/**
 * @module GameEngine
 * Top-level game session orchestrator for Chromatica v2.
 *
 * Wires together colour science, client generation, scoring, and wave
 * management into a single stateful class that the UI layer can drive.
 */

import type { RGB } from '../types/color.types';
import type {
  Client,
  EvaluationResult,
  GamePhase,
  GameSession,
  WaveResult,
} from '../types/game.types';
import { computeAccuracy } from './colorScience';
import { generateClient } from './clientGenerator';
import { evaluatePotion, getComboReward } from './scoring';
import { getWaveConfig, isWaveClear, WaveConfig } from './waveManager';
import { clamp } from '../utils/mathUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Possible high-level outcomes when checking game state. */
export type GameStateOutcome = 'continue' | 'gameOver' | 'waveClear';

/** Token categories available to the player. */
export type TokenType = 'skip' | 'hint' | 'autoCorrect';

// ---------------------------------------------------------------------------
// GameEngine
// ---------------------------------------------------------------------------

/**
 * Orchestrates a full Chromatica play session.
 *
 * The engine manages its own internal {@link GameSession} and exposes
 * methods for the UI/store layer to call at each game-loop step.
 *
 * @example
 * ```ts
 * const engine = new GameEngine();
 * engine.startSession();
 * const client = engine.spawnNextClient(1);
 * // ...player mixes colour...
 * const result = engine.submitPotion({ r: 120, g: 40, b: 200 });
 * ```
 */
export class GameEngine {
  private session: GameSession;
  private waveClientsServed: number = 0;
  private waveScore: number = 0;
  private currentWaveConfig: WaveConfig;

  constructor() {
    this.session = GameEngine.freshSession();
    this.currentWaveConfig = getWaveConfig(1);
  }

  // -----------------------------------------------------------------------
  // Session lifecycle
  // -----------------------------------------------------------------------

  /** Creates a blank session object. */
  private static freshSession(): GameSession {
    return {
      score: 0,
      satisfaction: 100,
      currentWave: 1,
      comboStreak: 0,
      highestCombo: 0,
      potionsCompleted: 0,
      potionsFailed: 0,
      tokens: { skip: 0, hint: 0, autoCorrect: 0 },
      currentClient: null,
      playerMix: { r: 255, g: 255, b: 255 },
      waveHistory: [],
      timeRemaining: 0,
      phase: 'idle',
    };
  }

  /**
   * Initialises (or resets) the session to a fresh state and sets the
   * phase to `'playing'`.
   */
  startSession(): void {
    this.session = GameEngine.freshSession();
    this.session.phase = 'playing';
    this.waveClientsServed = 0;
    this.waveScore = 0;
    this.currentWaveConfig = getWaveConfig(1);
  }

  // -----------------------------------------------------------------------
  // Client management
  // -----------------------------------------------------------------------

  /**
   * Generates and assigns the next client for the given wave.
   *
   * Sets `timeRemaining` to the client's patience and updates the
   * session's current client reference.
   *
   * @param wave - Current wave number.
   * @returns The newly spawned {@link Client}.
   */
  spawnNextClient(wave: number): Client {
    const client = generateClient(wave);
    this.session.currentClient = client;
    this.session.timeRemaining = client.modifiers.patience;
    this.session.playerMix = { r: 255, g: 255, b: 255 };
    this.session.phase = 'playing';
    return client;
  }

  // -----------------------------------------------------------------------
  // Potion submission
  // -----------------------------------------------------------------------

  /**
   * Evaluates the player's mixed colour against the current client's target.
   *
   * Side effects on the session:
   * - Updates score, combo, satisfaction, and potion counters.
   * - Awards combo-milestone tokens when applicable.
   * - Sets the phase to `'result'`.
   *
   * @param playerMix - The colour the player has mixed.
   * @returns The detailed {@link EvaluationResult}.
   * @throws If no client is currently assigned.
   */
  submitPotion(playerMix: RGB): EvaluationResult {
    const client = this.session.currentClient;
    if (!client) {
      throw new Error('Cannot submit potion: no active client.');
    }

    this.session.phase = 'evaluating';

    const result = evaluatePotion(
      client.targetColor,
      playerMix,
      client,
      this.session.timeRemaining,
      this.session.comboStreak,
    );

    if (result.passed) {
      // --- Success path ---
      this.session.score += result.pointsEarned;
      this.waveScore += result.pointsEarned;
      this.session.comboStreak += 1;
      this.session.highestCombo = Math.max(
        this.session.highestCombo,
        this.session.comboStreak,
      );
      this.session.potionsCompleted += 1;
      this.waveClientsServed += 1;

      // Combo reward?
      const reward = getComboReward(this.session.comboStreak);
      if (reward) {
        this.session.tokens[reward] += 1;
      }

      // Satisfaction bump (small)
      this.session.satisfaction = clamp(
        this.session.satisfaction + 2,
        0,
        100,
      );
    } else {
      // --- Failure path ---
      this.session.comboStreak = 0;
      this.session.potionsFailed += 1;
      this.session.satisfaction = clamp(
        this.session.satisfaction - client.modifiers.penaltySeverity,
        0,
        100,
      );
    }

    this.session.phase = 'result';
    return result;
  }

  // -----------------------------------------------------------------------
  // Power-up tokens
  // -----------------------------------------------------------------------

  /**
   * Attempts to use a power-up token.
   *
   * Effects:
   * - **skip**: Dismisses the current client without penalty.
   * - **hint**: Returns the accuracy of the current mix (UI should display).
   * - **autoCorrect**: Automatically submits a perfect potion.
   *
   * @param type - The token type to consume.
   * @returns A result object describing what happened.
   * @throws If the player has no tokens of the requested type.
   */
  useToken(type: TokenType): { applied: boolean; hint?: number; autoResult?: EvaluationResult } {
    if (this.session.tokens[type] <= 0) {
      return { applied: false };
    }

    this.session.tokens[type] -= 1;

    switch (type) {
      case 'skip': {
        // Skip the client with no score/penalty change
        this.waveClientsServed += 1;
        this.session.currentClient = null;
        return { applied: true };
      }

      case 'hint': {
        // Compute how close the current mix is to the target
        const client = this.session.currentClient;
        if (!client) return { applied: false };
        const accuracy = computeAccuracy(client.targetColor, this.session.playerMix);
        return { applied: true, hint: accuracy };
      }

      case 'autoCorrect': {
        // Submit a perfect match for the current client
        const client = this.session.currentClient;
        if (!client) return { applied: false };
        const autoResult = this.submitPotion(client.targetColor);
        return { applied: true, autoResult };
      }

      default:
        return { applied: false };
    }
  }

  // -----------------------------------------------------------------------
  // Game-state checks
  // -----------------------------------------------------------------------

  /**
   * Evaluates the current game state and returns the appropriate outcome.
   *
   * - `'gameOver'`  — satisfaction has dropped to 0.
   * - `'waveClear'` — all clients served and target score met.
   * - `'continue'`  — the wave is still in progress.
   */
  checkGameState(): GameStateOutcome {
    if (this.session.satisfaction <= 0) {
      this.session.phase = 'gameOver';
      return 'gameOver';
    }

    if (isWaveClear(this.waveClientsServed, this.waveScore, this.currentWaveConfig)) {
      this.session.phase = 'waveClear';
      return 'waveClear';
    }

    return 'continue';
  }

  /**
   * Advances the session to the next wave.
   *
   * Records the completed wave's result, resets per-wave counters,
   * and loads the new wave's configuration.
   */
  advanceWave(): void {
    // Record wave result
    const result: WaveResult = {
      waveNumber: this.session.currentWave,
      clientsServed: this.waveClientsServed,
      averageAccuracy: 0, // computed below
      pointsEarned: this.waveScore,
    };

    // Average accuracy is best-effort (based on completed potions this wave)
    if (this.waveClientsServed > 0) {
      result.averageAccuracy = Math.round(
        (this.waveScore / this.waveClientsServed) * 10,
      ) / 10;
    }

    this.session.waveHistory.push(result);
    this.session.currentWave += 1;
    this.waveClientsServed = 0;
    this.waveScore = 0;
    this.currentWaveConfig = getWaveConfig(this.session.currentWave);
    this.session.currentClient = null;
    this.session.phase = 'playing';
  }

  // -----------------------------------------------------------------------
  // Setters / state mutators
  // -----------------------------------------------------------------------

  /** Updates the player's current mix colour. */
  setPlayerMix(color: RGB): void {
    this.session.playerMix = color;
  }

  /** Sets the remaining time for the current client. */
  setTimeRemaining(time: number): void {
    this.session.timeRemaining = Math.max(0, time);
  }

  /** Sets the game phase. */
  setPhase(phase: GamePhase): void {
    this.session.phase = phase;
  }

  // -----------------------------------------------------------------------
  // Getters (read-only snapshots)
  // -----------------------------------------------------------------------

  /** Returns a shallow copy of the current session state. */
  getSession(): Readonly<GameSession> {
    return { ...this.session };
  }

  /** Returns the current score. */
  getScore(): number {
    return this.session.score;
  }

  /** Returns the current satisfaction level (0-100). */
  getSatisfaction(): number {
    return this.session.satisfaction;
  }

  /** Returns the current combo streak. */
  getComboStreak(): number {
    return this.session.comboStreak;
  }

  /** Returns the current wave number. */
  getCurrentWave(): number {
    return this.session.currentWave;
  }

  /** Returns the current client, or null. */
  getCurrentClient(): Client | null {
    return this.session.currentClient;
  }

  /** Returns the active wave configuration. */
  getWaveConfig(): WaveConfig {
    return { ...this.currentWaveConfig };
  }

  /** Returns the current game phase. */
  getPhase(): GamePhase {
    return this.session.phase;
  }

  /** Returns the token counts. */
  getTokens(): Readonly<GameSession['tokens']> {
    return { ...this.session.tokens };
  }
}
