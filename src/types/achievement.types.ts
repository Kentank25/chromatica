import { z } from 'zod';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'brewing' | 'combo' | 'clients' | 'waves' | 'color_science';
export type AchievementTrigger = 'POTION_SUBMITTED' | 'WAVE_CLEARED' | 'SESSION_END';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  trigger: AchievementTrigger;
  maxProgress?: number;
  secret?: boolean;
}

export interface AchievementProgress {
  unlockedAt: number | null; // Timestamp when unlocked, or null
  progress: number;          // Current progress towards target (e.g. potions complete)
}

export interface LifetimeStats {
  totalPotionsCompleted: number;
  totalZombiesServed: number;
  totalWizardsServed: number;
  totalNoblesServed: number;
  totalVillagersServed: number;
}

// Zod schemas for localStorage validation
export const LifetimeStatsSchema = z.object({
  totalPotionsCompleted: z.number().int().nonnegative().default(0),
  totalZombiesServed: z.number().int().nonnegative().default(0),
  totalWizardsServed: z.number().int().nonnegative().default(0),
  totalNoblesServed: z.number().int().nonnegative().default(0),
  totalVillagersServed: z.number().int().nonnegative().default(0),
});

export const AchievementProgressSchema = z.object({
  unlockedAt: z.number().nullable().default(null),
  progress: z.number().nonnegative().default(0),
});

export const AchievementStorageSchema = z.object({
  achievements: z.record(z.string(), AchievementProgressSchema).default({}),
  lifetimeStats: LifetimeStatsSchema.default({
    totalPotionsCompleted: 0,
    totalZombiesServed: 0,
    totalWizardsServed: 0,
    totalNoblesServed: 0,
    totalVillagersServed: 0,
  }),
});

export type AchievementStorageData = z.infer<typeof AchievementStorageSchema>;
