import type { AchievementTrigger } from '../types/achievement.types';

import type { PotionEffect, ReactionTier } from '../types/game.types';

export interface AchievementPayloads {
  POTION_SUBMITTED: {
    passed: boolean;
    accuracy: number;
    comboStreak: number;
    clientType: 'villager' | 'wizard' | 'zombie' | 'noble' | 'mystic';
    patience: number;
    timeRemaining: number;
    ingredientsUsed: string[];
    sessionClientTypesServed: Set<string>;
    detectedEffect?: PotionEffect;
    effectMatched?: boolean;
    reactionTier?: ReactionTier;
    tipReceived?: boolean;
  };
  WAVE_CLEARED: {
    waveNumber: number;
    clientsServed: number;
    averageAccuracy: number;
    pointsEarned: number;
  };
  SESSION_END: {
    finalScore: number;
    totalCompleted: number;
    totalFailed: number;
    highestCombo: number;
    wavesCleared: number;
  };
}

type EventListener<T extends AchievementTrigger> = (payload: AchievementPayloads[T]) => void;

class AchievementEventBusClass {
  private listeners: { [K in AchievementTrigger]?: Array<EventListener<K>> } = {};

  /**
   * Subscribe to a specific achievement trigger event.
   * Returns an unsubscribe function.
   */
  subscribe<T extends AchievementTrigger>(event: T, callback: EventListener<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.listeners[event] = this.listeners[event]!.filter((cb) => cb !== callback) as any;
    };
  }

  /**
   * Publish an event to all registered subscribers.
   */
  publish<T extends AchievementTrigger>(event: T, payload: AchievementPayloads[T]): void {
    const list = this.listeners[event];
    if (list) {
      // Create a shallow copy to prevent issues if a listener unsubscribes during execution
      [...list].forEach((callback) => {
        try {
          callback(payload);
        } catch (e) {
          console.error(`Error in achievement listener for event ${event}:`, e);
        }
      });
    }
  }
}

export const AchievementEventBus = new AchievementEventBusClass();
