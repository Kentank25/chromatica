import { create } from 'zustand';
import type {
  AchievementProgress,
  AchievementRarity,
  LifetimeStats,
} from '../types/achievement.types';
import { AchievementStorageSchema } from '../types/achievement.types';
import { ACHIEVEMENT_DEFINITIONS, resetSessionAchievementData } from '../engine/achievementDefinitions';
import { AchievementEventBus } from '../engine/achievementEventBus';
import { audioManager } from '../audio/AudioManager';

interface AchievementToastInfo {
  id: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  icon: string;
}

interface AchievementState {
  achievements: Record<string, AchievementProgress>;
  lifetimeStats: LifetimeStats;
  sessionRecap: string[]; // IDs of achievements unlocked in the current session
  toasts: AchievementToastInfo[];

  // Core functions
  init: () => () => void; // Subscribes to event bus, returns unsubscribe
  unlockAchievement: (id: string) => void;
  removeToast: (toastId: string) => void;
  clearSessionRecap: () => void;
  resetAll: () => void;
}

const STORAGE_KEY = 'chromatica_v2_achievements_state';

const getInitialState = (): {
  achievements: Record<string, AchievementProgress>;
  lifetimeStats: LifetimeStats;
} => {
  const defaultState = {
    achievements: {} as Record<string, AchievementProgress>,
    lifetimeStats: {
      totalPotionsCompleted: 0,
      totalZombiesServed: 0,
      totalWizardsServed: 0,
      totalNoblesServed: 0,
      totalVillagersServed: 0,
      totalMysticsServed: 0,
    },
  };

  // Populate default achievements map
  ACHIEVEMENT_DEFINITIONS.forEach((def) => {
    defaultState.achievements[def.id] = { unlockedAt: null, progress: 0 };
  });

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw);
    const validated = AchievementStorageSchema.safeParse(parsed);

    if (validated.success) {
      // Merge with defaultState in case new achievements were added
      const mergedAchievements = { ...defaultState.achievements };
      Object.keys(validated.data.achievements).forEach((key) => {
        if (mergedAchievements[key]) {
          mergedAchievements[key] = validated.data.achievements[key];
        }
      });
      return {
        achievements: mergedAchievements,
        lifetimeStats: validated.data.lifetimeStats,
      };
    } else {
      console.warn('[AchievementStore] Invalid local storage structure, repairing...', validated.error);
      return defaultState;
    }
  } catch (e) {
    console.error('[AchievementStore] Failed to load achievements from storage:', e);
    return defaultState;
  }
};

const saveState = (achievements: Record<string, AchievementProgress>, lifetimeStats: LifetimeStats) => {
  try {
    const dataToSave = { achievements, lifetimeStats };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error('[AchievementStore] Failed to save achievements to storage:', e);
  }
};

export const useAchievementStore = create<AchievementState>((set, get) => ({
  ...getInitialState(),
  sessionRecap: [],
  toasts: [],

  init: () => {
    // Helper to evaluate and process check results for an achievement definition
    const evaluate = (
      def: typeof ACHIEVEMENT_DEFINITIONS[number],
      checkResult: boolean | { progress: number; unlocked: boolean }
    ) => {
      const state = get();
      const current = state.achievements[def.id];
      if (current && current.unlockedAt !== null) return;

      if (typeof checkResult === 'boolean') {
        if (checkResult) {
          get().unlockAchievement(def.id);
        }
      } else {
        const currentProgress = current?.progress || 0;
        if (checkResult.unlocked) {
          // Pre-save progress value with unlockedAt: null so unlockAchievement doesn't early-return
          const updatedAchievements = { ...get().achievements };
          updatedAchievements[def.id] = {
            unlockedAt: null,
            progress: checkResult.progress,
          };
          set({ achievements: updatedAchievements });
          
          get().unlockAchievement(def.id);
        } else if (checkResult.progress !== currentProgress) {
          // Progress update only
          const updatedAchievements = { ...get().achievements };
          updatedAchievements[def.id] = {
            unlockedAt: null,
            progress: checkResult.progress,
          };
          set({ achievements: updatedAchievements });
          saveState(updatedAchievements, get().lifetimeStats);
        }
      }
    };

    // 1. Subscribe to POTION_SUBMITTED
    const unsubPotion = AchievementEventBus.subscribe('POTION_SUBMITTED', (payload) => {
      const state = get();
      const currentLifetime = { ...state.lifetimeStats };

      // Update lifetime stats
      if (payload.passed) {
        currentLifetime.totalPotionsCompleted += 1;
        if (payload.clientType === 'villager') currentLifetime.totalVillagersServed += 1;
        if (payload.clientType === 'wizard') currentLifetime.totalWizardsServed += 1;
        if (payload.clientType === 'zombie') currentLifetime.totalZombiesServed += 1;
        if (payload.clientType === 'noble') currentLifetime.totalNoblesServed += 1;
        if (payload.clientType === 'mystic') currentLifetime.totalMysticsServed += 1;
      }

      set({ lifetimeStats: currentLifetime });

      // Run evaluations
      ACHIEVEMENT_DEFINITIONS.forEach((def) => {
        if (def.trigger !== 'POTION_SUBMITTED') return;

        const currentProg = get().achievements[def.id];
        if (currentProg && currentProg.unlockedAt !== null) return; // Already unlocked

        const checkResult = def.check(payload, currentLifetime, currentProg?.progress || 0);
        evaluate(def, checkResult);
      });
    });

    // 2. Subscribe to WAVE_CLEARED
    const unsubWave = AchievementEventBus.subscribe('WAVE_CLEARED', (payload) => {
      const currentLifetime = get().lifetimeStats;

      ACHIEVEMENT_DEFINITIONS.forEach((def) => {
        if (def.trigger !== 'WAVE_CLEARED') return;

        const currentProg = get().achievements[def.id];
        if (currentProg && currentProg.unlockedAt !== null) return; // Already unlocked

        const checkResult = def.check(payload, currentLifetime, currentProg?.progress || 0);
        evaluate(def, checkResult);
      });
    });

    // 3. Subscribe to SESSION_END
    const unsubSession = AchievementEventBus.subscribe('SESSION_END', (payload) => {
      const currentLifetime = get().lifetimeStats;

      ACHIEVEMENT_DEFINITIONS.forEach((def) => {
        if (def.trigger !== 'SESSION_END') return;

        const currentProg = get().achievements[def.id];
        if (currentProg && currentProg.unlockedAt !== null) return; // Already unlocked

        const checkResult = def.check(payload, currentLifetime, currentProg?.progress || 0);
        evaluate(def, checkResult);
      });
    });

    // Return combined unsubscribe
    return () => {
      unsubPotion();
      unsubWave();
      unsubSession();
    };
  },

  unlockAchievement: (id) => {
    const state = get();
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === id);
    if (!def) return;

    // Check if already in recap to avoid duplicate triggers
    if (state.sessionRecap.includes(id)) return;

    const updatedAchievements = { ...state.achievements };
    const current = updatedAchievements[id] || { unlockedAt: null, progress: 0 };

    if (current.unlockedAt !== null) return; // already unlocked

    updatedAchievements[id] = {
      ...current,
      unlockedAt: Date.now(),
    };

    // Play unlock sound effect
    audioManager.playSFX('achievementUnlock');

    // Add to toasts and session recap
    const newToast: AchievementToastInfo = {
      id: `${id}_${Date.now()}`,
      name: def.name,
      description: def.description,
      rarity: def.rarity,
      icon: def.icon,
    };

    set({
      achievements: updatedAchievements,
      sessionRecap: [...state.sessionRecap, id],
      toasts: [newToast, ...state.toasts],
    });

    saveState(updatedAchievements, state.lifetimeStats);
  },

  removeToast: (toastId) => {
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== toastId),
    }));
  },

  clearSessionRecap: () => {
    resetSessionAchievementData();
    set((s) => {
      const updated = { ...s.achievements };
      const sessionIds = ['generous_tipper', 'sharpshooter', 'all_effects'];
      sessionIds.forEach(id => {
        if (updated[id] && updated[id].unlockedAt === null) {
          updated[id] = { unlockedAt: null, progress: 0 };
        }
      });
      saveState(updated, s.lifetimeStats);
      return { sessionRecap: [], toasts: [], achievements: updated };
    });
  },

  resetAll: () => {
    const fresh = {
      achievements: {} as Record<string, AchievementProgress>,
      lifetimeStats: {
        totalPotionsCompleted: 0,
        totalZombiesServed: 0,
        totalWizardsServed: 0,
        totalNoblesServed: 0,
        totalVillagersServed: 0,
        totalMysticsServed: 0,
      },
    };

    ACHIEVEMENT_DEFINITIONS.forEach((def) => {
      fresh.achievements[def.id] = { unlockedAt: null, progress: 0 };
    });

    set({
      ...fresh,
      sessionRecap: [],
      toasts: [],
    });

    saveState(fresh.achievements, fresh.lifetimeStats);
  },
}));
