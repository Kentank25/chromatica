import { create } from 'zustand';
import type {
  AchievementProgress,
  AchievementRarity,
  LifetimeStats,
  SessionStats,
} from '../types/achievement.types';
import { AchievementStorageSchema } from '../types/achievement.types';
import { ACHIEVEMENT_DEFINITIONS } from '../engine/achievementDefinitions';
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
  sessionStats: SessionStats;

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

export const useAchievementStore = create<AchievementState>((set) => ({
  ...getInitialState(),
  sessionRecap: [],
  toasts: [],
  sessionStats: {
    sessionSharpshooter: 0,
    sessionTips: 0,
    sessionEffects: [],
  },

  init: () => {
    // 1. Subscribe to POTION_SUBMITTED
    const unsubPotion = AchievementEventBus.subscribe('POTION_SUBMITTED', (payload) => {
      set((state) => {
        const currentLifetime = { ...state.lifetimeStats };
        const currentSessionStats = { ...state.sessionStats };

        // Update lifetime stats
        if (payload.passed) {
          currentLifetime.totalPotionsCompleted += 1;
          if (payload.clientType === 'villager') currentLifetime.totalVillagersServed += 1;
          if (payload.clientType === 'wizard') currentLifetime.totalWizardsServed += 1;
          if (payload.clientType === 'zombie') currentLifetime.totalZombiesServed += 1;
          if (payload.clientType === 'noble') currentLifetime.totalNoblesServed += 1;
          if (payload.clientType === 'mystic') currentLifetime.totalMysticsServed += 1;
        }

        // Update session stats
        if (payload.passed) {
          if (payload.accuracy >= 95) {
            currentSessionStats.sessionSharpshooter += 1;
          }
          if (payload.tipReceived) {
            currentSessionStats.sessionTips += 1;
          }
          if (payload.detectedEffect && !currentSessionStats.sessionEffects.includes(payload.detectedEffect)) {
            currentSessionStats.sessionEffects = [...currentSessionStats.sessionEffects, payload.detectedEffect];
          }
        }

        const updatedAchievements = { ...state.achievements };
        const sessionRecap = [...state.sessionRecap];
        const toasts = [...state.toasts];

        ACHIEVEMENT_DEFINITIONS.forEach((def) => {
          if (def.trigger !== 'POTION_SUBMITTED') return;

          const currentProg = updatedAchievements[def.id] || { unlockedAt: null, progress: 0 };
          if (currentProg.unlockedAt !== null) return; // Already unlocked

          const checkResult = def.check(payload, currentLifetime, currentProg.progress, currentSessionStats);

          if (typeof checkResult === 'boolean') {
            if (checkResult) {
              if (!sessionRecap.includes(def.id)) {
                updatedAchievements[def.id] = { ...currentProg, unlockedAt: Date.now() };
                sessionRecap.push(def.id);
                toasts.unshift({
                  id: `${def.id}_${Date.now()}`,
                  name: def.name,
                  description: def.description,
                  rarity: def.rarity,
                  icon: def.icon,
                });
                audioManager.playSFX('achievementUnlock');
              }
            }
          } else {
            if (checkResult.unlocked) {
              if (!sessionRecap.includes(def.id)) {
                updatedAchievements[def.id] = { unlockedAt: Date.now(), progress: checkResult.progress };
                sessionRecap.push(def.id);
                toasts.unshift({
                  id: `${def.id}_${Date.now()}`,
                  name: def.name,
                  description: def.description,
                  rarity: def.rarity,
                  icon: def.icon,
                });
                audioManager.playSFX('achievementUnlock');
              }
            } else if (checkResult.progress !== currentProg.progress) {
              updatedAchievements[def.id] = { unlockedAt: null, progress: checkResult.progress };
            }
          }
        });

        saveState(updatedAchievements, currentLifetime);

        return {
          lifetimeStats: currentLifetime,
          sessionStats: currentSessionStats,
          achievements: updatedAchievements,
          sessionRecap,
          toasts,
        };
      });
    });

    // 2. Subscribe to WAVE_CLEARED
    const unsubWave = AchievementEventBus.subscribe('WAVE_CLEARED', (payload) => {
      set((state) => {
        const currentLifetime = state.lifetimeStats;
        const currentSessionStats = state.sessionStats;
        const updatedAchievements = { ...state.achievements };
        const sessionRecap = [...state.sessionRecap];
        const toasts = [...state.toasts];

        ACHIEVEMENT_DEFINITIONS.forEach((def) => {
          if (def.trigger !== 'WAVE_CLEARED') return;

          const currentProg = updatedAchievements[def.id] || { unlockedAt: null, progress: 0 };
          if (currentProg.unlockedAt !== null) return; // Already unlocked

          const checkResult = def.check(payload, currentLifetime, currentProg.progress, currentSessionStats);

          if (typeof checkResult === 'boolean') {
            if (checkResult) {
              if (!sessionRecap.includes(def.id)) {
                updatedAchievements[def.id] = { ...currentProg, unlockedAt: Date.now() };
                sessionRecap.push(def.id);
                toasts.unshift({
                  id: `${def.id}_${Date.now()}`,
                  name: def.name,
                  description: def.description,
                  rarity: def.rarity,
                  icon: def.icon,
                });
                audioManager.playSFX('achievementUnlock');
              }
            }
          } else {
            if (checkResult.unlocked) {
              if (!sessionRecap.includes(def.id)) {
                updatedAchievements[def.id] = { unlockedAt: Date.now(), progress: checkResult.progress };
                sessionRecap.push(def.id);
                toasts.unshift({
                  id: `${def.id}_${Date.now()}`,
                  name: def.name,
                  description: def.description,
                  rarity: def.rarity,
                  icon: def.icon,
                });
                audioManager.playSFX('achievementUnlock');
              }
            } else if (checkResult.progress !== currentProg.progress) {
              updatedAchievements[def.id] = { unlockedAt: null, progress: checkResult.progress };
            }
          }
        });

        saveState(updatedAchievements, currentLifetime);

        return {
          achievements: updatedAchievements,
          sessionRecap,
          toasts,
        };
      });
    });

    // 3. Subscribe to SESSION_END
    const unsubSession = AchievementEventBus.subscribe('SESSION_END', (payload) => {
      set((state) => {
        const currentLifetime = state.lifetimeStats;
        const currentSessionStats = state.sessionStats;
        const updatedAchievements = { ...state.achievements };
        const sessionRecap = [...state.sessionRecap];
        const toasts = [...state.toasts];

        ACHIEVEMENT_DEFINITIONS.forEach((def) => {
          if (def.trigger !== 'SESSION_END') return;

          const currentProg = updatedAchievements[def.id] || { unlockedAt: null, progress: 0 };
          if (currentProg.unlockedAt !== null) return; // Already unlocked

          const checkResult = def.check(payload, currentLifetime, currentProg.progress, currentSessionStats);

          if (typeof checkResult === 'boolean') {
            if (checkResult) {
              if (!sessionRecap.includes(def.id)) {
                updatedAchievements[def.id] = { ...currentProg, unlockedAt: Date.now() };
                sessionRecap.push(def.id);
                toasts.unshift({
                  id: `${def.id}_${Date.now()}`,
                  name: def.name,
                  description: def.description,
                  rarity: def.rarity,
                  icon: def.icon,
                });
                audioManager.playSFX('achievementUnlock');
              }
            }
          } else {
            if (checkResult.unlocked) {
              if (!sessionRecap.includes(def.id)) {
                updatedAchievements[def.id] = { unlockedAt: Date.now(), progress: checkResult.progress };
                sessionRecap.push(def.id);
                toasts.unshift({
                  id: `${def.id}_${Date.now()}`,
                  name: def.name,
                  description: def.description,
                  rarity: def.rarity,
                  icon: def.icon,
                });
                audioManager.playSFX('achievementUnlock');
              }
            } else if (checkResult.progress !== currentProg.progress) {
              updatedAchievements[def.id] = { unlockedAt: null, progress: checkResult.progress };
            }
          }
        });

        saveState(updatedAchievements, currentLifetime);

        return {
          achievements: updatedAchievements,
          sessionRecap,
          toasts,
        };
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
    set((state) => {
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === id);
      if (!def) return {};

      if (state.sessionRecap.includes(id)) return {};

      const updatedAchievements = { ...state.achievements };
      const current = updatedAchievements[id] || { unlockedAt: null, progress: 0 };

      if (current.unlockedAt !== null) return {};

      updatedAchievements[id] = {
        ...current,
        unlockedAt: Date.now(),
      };

      audioManager.playSFX('achievementUnlock');

      const newToast: AchievementToastInfo = {
        id: `${id}_${Date.now()}`,
        name: def.name,
        description: def.description,
        rarity: def.rarity,
        icon: def.icon,
      };

      saveState(updatedAchievements, state.lifetimeStats);

      return {
        achievements: updatedAchievements,
        sessionRecap: [...state.sessionRecap, id],
        toasts: [newToast, ...state.toasts],
      };
    });
  },

  removeToast: (toastId) => {
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== toastId),
    }));
  },

  clearSessionRecap: () => {
    set((s) => {
      const updated = { ...s.achievements };
      const sessionIds = ['generous_tipper', 'sharpshooter', 'all_effects'];
      sessionIds.forEach(id => {
        if (updated[id] && updated[id].unlockedAt === null) {
          updated[id] = { unlockedAt: null, progress: 0 };
        }
      });
      saveState(updated, s.lifetimeStats);
      return {
        sessionRecap: [],
        toasts: [],
        achievements: updated,
        sessionStats: {
          sessionSharpshooter: 0,
          sessionTips: 0,
          sessionEffects: [],
        },
      };
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
      sessionStats: {
        sessionSharpshooter: 0,
        sessionTips: 0,
        sessionEffects: [],
      },
    });

    saveState(fresh.achievements, fresh.lifetimeStats);
  },
}));
