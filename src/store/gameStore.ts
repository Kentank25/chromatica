/**
 * gameStore - Zustand store for game session state
 * 
 * Manages all session data: score, satisfaction, combos, tokens,
 * current client, wave progression, and game phase.
 */
import { create } from 'zustand';
import type { RGB, Ingredient } from '../types/color.types';
import type { Client, GamePhase, WaveResult } from '../types/game.types';
import { mixColorsKM } from '../engine/colorScience';

interface GameState {
  // Session state
  score: number;
  satisfaction: number;
  currentWave: number;
  comboStreak: number;
  highestCombo: number;
  potionsCompleted: number;
  potionsFailed: number;
  tokens: { skip: number; hint: number; autoCorrect: number };
  currentClient: Client | null;
  playerMix: RGB;
  waveHistory: WaveResult[];
  timeRemaining: number;
  phase: GamePhase;
  clientsServedThisWave: number;
  waveScore: number;
  difficulty: 'apprentice' | 'journeyman' | 'master';
  mixerAmounts: Record<string, number>;
  // ── Multi-Color Orders ──
  multiOrderTargets: RGB[];
  currentSubOrderIndex: number;

  // Actions
  startGame: () => void;
  setDifficulty: (difficulty: 'apprentice' | 'journeyman' | 'master') => void;
  setPlayerMix: (color: RGB) => void;
  setCurrentClient: (client: Client | null) => void;
  updateScore: (points: number) => void;
  updateSatisfaction: (delta: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  addToken: (type: 'skip' | 'hint' | 'autoCorrect') => void;
  useToken: (type: 'skip' | 'hint' | 'autoCorrect') => boolean;
  setPhase: (phase: GamePhase) => void;
  setTimeRemaining: (time: number) => void;
  addWaveResult: (result: WaveResult) => void;
  nextWave: () => void;
  incrementPotionsCompleted: () => void;
  incrementPotionsFailed: () => void;
  incrementClientsServed: () => void;
  addWaveScore: (points: number) => void;
  setMixerAmount: (id: string, amount: number) => void;
  setMixerAmounts: (amounts: Record<string, number>) => void;
  resetMixerAmounts: () => void;
  autoCorrectMixer: (targetColor: RGB, unlockedIngredients: Ingredient[]) => void;
  setMultiOrder: (targets: RGB[]) => void;
  advanceSubOrder: () => RGB | null;
  clearMultiOrder: () => void;
}

const INITIAL_STATE = {
  score: 0,
  satisfaction: 100,
  currentWave: 1,
  comboStreak: 0,
  highestCombo: 0,
  potionsCompleted: 0,
  potionsFailed: 0,
  tokens: { skip: 0, hint: 0, autoCorrect: 0 },
  currentClient: null as Client | null,
  playerMix: { r: 128, g: 128, b: 128 } as RGB,
  waveHistory: [] as WaveResult[],
  timeRemaining: 0,
  phase: 'idle' as GamePhase,
  clientsServedThisWave: 0,
  waveScore: 0,
  difficulty: 'journeyman' as 'apprentice' | 'journeyman' | 'master',
  mixerAmounts: {
    red: 0,
    blue: 0,
    yellow: 0,
    green: 0,
    white: 0,
    black: 0,
    orange: 0,
    purple: 0,
    teal: 0,
    magenta: 0,
    ochre: 0,
    silver: 0,
  } as Record<string, number>,
  multiOrderTargets: [] as RGB[],
  currentSubOrderIndex: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL_STATE,

  startGame: () => set((s) => ({ ...INITIAL_STATE, difficulty: s.difficulty, phase: 'playing' })),

  setDifficulty: (difficulty) => set({ difficulty }),

  setPlayerMix: (color) => set({ playerMix: color }),

  setCurrentClient: (client) => set({ currentClient: client }),

  updateScore: (points) => set((s) => ({ score: s.score + points })),

  updateSatisfaction: (delta) =>
    set((s) => ({
      satisfaction: Math.max(0, Math.min(100, s.satisfaction + delta)),
    })),

  incrementCombo: () =>
    set((s) => ({
      comboStreak: s.comboStreak + 1,
      highestCombo: Math.max(s.highestCombo, s.comboStreak + 1),
    })),

  resetCombo: () => set({ comboStreak: 0 }),

  addToken: (type) =>
    set((s) => ({
      tokens: { ...s.tokens, [type]: s.tokens[type] + 1 },
    })),

  useToken: (type) => {
    const state = get();
    if (state.tokens[type] <= 0) return false;
    set({
      tokens: { ...state.tokens, [type]: state.tokens[type] - 1 },
    });
    return true;
  },

  setPhase: (phase) => set({ phase }),

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  addWaveResult: (result) =>
    set((s) => ({
      waveHistory: [...s.waveHistory, result],
    })),

  nextWave: () =>
    set((s) => ({
      currentWave: s.currentWave + 1,
      clientsServedThisWave: 0,
      waveScore: 0,
      phase: 'playing',
      mixerAmounts: {
        red: 0,
        blue: 0,
        yellow: 0,
        green: 0,
        white: 0,
        black: 0,
        orange: 0,
        purple: 0,
        teal: 0,
        magenta: 0,
        ochre: 0,
        silver: 0,
      },
      playerMix: { r: 40, g: 40, b: 50 },
      multiOrderTargets: [],
      currentSubOrderIndex: 0,
    })),

  incrementPotionsCompleted: () =>
    set((s) => ({ potionsCompleted: s.potionsCompleted + 1 })),

  incrementPotionsFailed: () =>
    set((s) => ({ potionsFailed: s.potionsFailed + 1 })),

  incrementClientsServed: () =>
    set((s) => ({ clientsServedThisWave: s.clientsServedThisWave + 1 })),

  addWaveScore: (points) =>
    set((s) => ({ waveScore: s.waveScore + points })),

  setMixerAmount: (id, amount) =>
    set((s) => ({
      mixerAmounts: { ...s.mixerAmounts, [id]: amount },
    })),

  setMixerAmounts: (amounts) => set({ mixerAmounts: amounts }),

  resetMixerAmounts: () =>
    set((s) => {
      const cleared: Record<string, number> = {};
      Object.keys(s.mixerAmounts).forEach((k) => {
        cleared[k] = 0;
      });
      return { mixerAmounts: cleared, playerMix: { r: 40, g: 40, b: 50 } };
    }),

  autoCorrectMixer: (targetColor, unlockedIngredients) => {
    const state = get();
    const currentAmounts = { ...state.mixerAmounts };
    const channels: Array<'r' | 'g' | 'b'> = ['r', 'g', 'b'];
    const targetChannel = channels[Math.floor(Math.random() * 3)];

    let bestAmounts = { ...currentAmounts };

    const getChannelValue = (amounts: Record<string, number>) => {
      const entries: Array<{ ingredient: Ingredient; amount: number }> = [];
      unlockedIngredients.forEach((ing) => {
        const amt = amounts[ing.id] || 0;
        if (amt > 0) {
          entries.push({ ingredient: ing, amount: amt });
        }
      });
      if (entries.length === 0) return 40;
      const mixed = mixColorsKM(entries);
      return mixed[targetChannel];
    };

    let bestDiff = Math.abs(getChannelValue(bestAmounts) - targetColor[targetChannel]);

    // Hill climbing search for optimal ingredient amounts to match the selected channel
    for (let i = 0; i < 200; i++) {
      const randomIng = unlockedIngredients[Math.floor(Math.random() * unlockedIngredients.length)];
      const currentAmt = bestAmounts[randomIng.id] || 0;

      const dir = Math.random() < 0.5 ? 1 : -1;
      const nextAmt = Math.max(0, Math.min(10, currentAmt + dir));

      if (nextAmt === currentAmt) continue;

      const testAmounts = { ...bestAmounts, [randomIng.id]: nextAmt };
      const testDiff = Math.abs(getChannelValue(testAmounts) - targetColor[targetChannel]);

      if (testDiff < bestDiff) {
        bestDiff = testDiff;
        bestAmounts = testAmounts;
      }
    }

    const finalEntries: Array<{ ingredient: Ingredient; amount: number }> = [];
    unlockedIngredients.forEach((ing) => {
      const amt = bestAmounts[ing.id] || 0;
      if (amt > 0) {
        finalEntries.push({ ingredient: ing, amount: amt });
      }
    });
    const finalColor = finalEntries.length > 0 ? mixColorsKM(finalEntries) : { r: 40, g: 40, b: 50 };

    set({
      mixerAmounts: bestAmounts,
      playerMix: finalColor,
    });
  },

  setMultiOrder: (targets) =>
    set({
      multiOrderTargets: targets,
      currentSubOrderIndex: 0,
    }),

  advanceSubOrder: () => {
    const { multiOrderTargets, currentSubOrderIndex, currentClient } = get();
    const nextIndex = currentSubOrderIndex + 1;
    if (nextIndex >= multiOrderTargets.length) {
      return null;
    }
    const nextTarget = multiOrderTargets[nextIndex];
    set({ currentSubOrderIndex: nextIndex });

    if (currentClient) {
      set({
        currentClient: {
          ...currentClient,
          targetColor: nextTarget,
          currentSubOrder: nextIndex,
        },
      });
    }

    return nextTarget;
  },

  clearMultiOrder: () =>
    set({
      multiOrderTargets: [],
      currentSubOrderIndex: 0,
    }),
}));
