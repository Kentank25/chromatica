/**
 * gameStore - Zustand store for game session state
 * 
 * Manages all session data: score, satisfaction, combos, tokens,
 * current client, wave progression, and game phase.
 */
import { create } from 'zustand';
import type { RGB } from '../types/color.types';
import type { Client, GamePhase, WaveResult } from '../types/game.types';

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

  // Actions
  startGame: () => void;
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
};

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL_STATE,

  startGame: () => set({ ...INITIAL_STATE, phase: 'playing' }),

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
    })),

  incrementPotionsCompleted: () =>
    set((s) => ({ potionsCompleted: s.potionsCompleted + 1 })),

  incrementPotionsFailed: () =>
    set((s) => ({ potionsFailed: s.potionsFailed + 1 })),

  incrementClientsServed: () =>
    set((s) => ({ clientsServedThisWave: s.clientsServedThisWave + 1 })),

  addWaveScore: (points) =>
    set((s) => ({ waveScore: s.waveScore + points })),
}));
