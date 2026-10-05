import { create } from 'zustand';
import {
  fetchTopScores,
  fetchPlayerBest,
  fetchPlayerRank,
  submitScore as apiSubmitScore,
  updateScoreDisplayNames
} from '../services/leaderboardService';
import type { Difficulty, LeaderboardEntry } from '../types/leaderboard.types';
import { useGameStore } from './gameStore';
import { useAuthStore } from './authStore';

interface LeaderboardState {
  globalScores: LeaderboardEntry[];
  playerBest: LeaderboardEntry | null;
  playerRank: number | null;
  activeDifficulty: Difficulty;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;

  fetchLeaderboard: (difficulty: Difficulty) => Promise<void>;
  submitNewScore: (params: {
    score: number;
    grade: string;
    wave: number;
    potionsBrewed: number;
    highestCombo: number;
  }) => Promise<void>;
  setActiveDifficulty: (difficulty: Difficulty) => void;
  setOnlineStatus: (status: boolean) => void;
  propagateNameChange: (uid: string, displayName: string) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  globalScores: [],
  playerBest: null,
  playerRank: null,
  activeDifficulty: 'journeyman',
  isLoading: false,
  error: null,
  isOnline: true,

  fetchLeaderboard: async (difficulty: Difficulty) => {
    set({ isLoading: true, error: null, activeDifficulty: difficulty });

    const uid = useAuthStore.getState().user?.uid;

    try {
      // Fetch global top 50 and player best in parallel
      const [scores, best] = await Promise.all([
        fetchTopScores(difficulty),
        uid ? fetchPlayerBest(difficulty, uid) : Promise.resolve(null)
      ]);

      // Fetch rank only if we have a best score (avoids unnecessary count query)
      const rank = best && uid
        ? await fetchPlayerRank(difficulty, uid, best.score)
        : null;

      set({
        globalScores: scores,
        playerBest: best,
        playerRank: rank,
        isLoading: false,
        isOnline: true
      });
    } catch (err: unknown) {
      console.error('Failed to load leaderboard:', err);
      const message = err instanceof Error ? err.message : 'Could not reach the high score servers. Showing local offline scores.';
      set({
        isLoading: false,
        isOnline: false,
        error: message
      });
    }
  },

  submitNewScore: async (params) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('No user authenticated. Cannot submit score.');
    }

    const difficulty = useGameStore.getState().difficulty;

    try {
      await apiSubmitScore({
        uid: user.uid,
        displayName: user.displayName,
        isGuest: user.isGuest,
        difficulty,
        ...params
      });

      // Reload leaderboard for this difficulty after submission
      await get().fetchLeaderboard(difficulty);
    } catch (err: unknown) {
      console.error('Failed to submit score:', err);
      throw err;
    }
  },

  /**
   * Called after a tag-name update to keep all existing score docs in sync.
   */
  propagateNameChange: async (uid: string, displayName: string) => {
    try {
      await updateScoreDisplayNames(uid, displayName);
      // Re-fetch so the UI shows the updated names immediately
      await get().fetchLeaderboard(get().activeDifficulty);
    } catch (err) {
      console.error('Failed to propagate name change to scores:', err);
    }
  },

  setActiveDifficulty: (difficulty: Difficulty) => {
    set({ activeDifficulty: difficulty });
    get().fetchLeaderboard(difficulty);
  },

  setOnlineStatus: (status: boolean) => set({ isOnline: status })
}));
