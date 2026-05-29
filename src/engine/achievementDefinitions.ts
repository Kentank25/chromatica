import type { AchievementDefinition, LifetimeStats } from '../types/achievement.types';
import type { AchievementPayloads } from './achievementEventBus';

export interface AchievementRule<T extends keyof AchievementPayloads> extends AchievementDefinition {
  trigger: T;
  check: (
    payload: AchievementPayloads[T],
    lifetimeStats: LifetimeStats,
    currentProgress: number
  ) => boolean | { progress: number; unlocked: boolean };
}

export const ACHIEVEMENT_DEFINITIONS: Array<
  | AchievementRule<'POTION_SUBMITTED'>
  | AchievementRule<'WAVE_CLEARED'>
  | AchievementRule<'SESSION_END'>
> = [
  // --- BREWING MASTERY ---
  {
    id: 'first_brew',
    name: 'First Brew',
    description: 'Complete your first successful potion',
    category: 'brewing',
    rarity: 'common',
    icon: 'FlaskConical',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed,
  },
  {
    id: 'apprentice_brewer',
    name: 'Apprentice Brewer',
    description: 'Brew 10 successful potions (lifetime)',
    category: 'brewing',
    rarity: 'common',
    icon: 'Hammer',
    trigger: 'POTION_SUBMITTED',
    maxProgress: 10,
    check: (payload, lifetimeStats) => {
      const total = lifetimeStats.totalPotionsCompleted + (payload.passed ? 1 : 0);
      return { progress: Math.min(total, 10), unlocked: total >= 10 };
    },
  },
  {
    id: 'journeyman_brewer',
    name: 'Journeyman Brewer',
    description: 'Brew 50 successful potions (lifetime)',
    category: 'brewing',
    rarity: 'uncommon',
    icon: 'Shield',
    trigger: 'POTION_SUBMITTED',
    maxProgress: 50,
    check: (payload, lifetimeStats) => {
      const total = lifetimeStats.totalPotionsCompleted + (payload.passed ? 1 : 0);
      return { progress: Math.min(total, 50), unlocked: total >= 50 };
    },
  },
  {
    id: 'master_alchemist',
    name: 'Master Alchemist',
    description: 'Brew 200 successful potions (lifetime)',
    category: 'brewing',
    rarity: 'rare',
    icon: 'Flame',
    trigger: 'POTION_SUBMITTED',
    maxProgress: 200,
    check: (payload, lifetimeStats) => {
      const total = lifetimeStats.totalPotionsCompleted + (payload.passed ? 1 : 0);
      return { progress: Math.min(total, 200), unlocked: total >= 200 };
    },
  },
  {
    id: 'pixel_perfect',
    name: 'Pixel Perfect',
    description: 'Achieve 99%+ accuracy on a single potion',
    category: 'brewing',
    rarity: 'epic',
    icon: 'Crosshair',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed && payload.accuracy >= 99,
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Achieve 95%+ accuracy on 5 potions in a single session',
    category: 'brewing',
    rarity: 'rare',
    icon: 'Target',
    trigger: 'POTION_SUBMITTED',
    maxProgress: 5,
    check: (payload, _, currentProgress) => {
      const matches = payload.passed && payload.accuracy >= 95;
      const nextProgress = matches ? currentProgress + 1 : currentProgress;
      return { progress: Math.min(nextProgress, 5), unlocked: nextProgress >= 5 };
    },
  },

  // --- COMBO & STREAKS ---
  {
    id: 'getting_warmed_up',
    name: 'Getting Warmed Up',
    description: 'Reach a 3× combo streak',
    category: 'combo',
    rarity: 'common',
    icon: 'Zap',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed && payload.comboStreak >= 3,
  },
  {
    id: 'on_fire',
    name: 'On Fire',
    description: 'Reach a 5× combo streak',
    category: 'combo',
    rarity: 'uncommon',
    icon: 'Flame',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed && payload.comboStreak >= 5,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Reach a 7× combo streak',
    category: 'combo',
    rarity: 'rare',
    icon: 'Sword',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed && payload.comboStreak >= 7,
  },
  {
    id: 'combo_legend',
    name: 'Combo Legend',
    description: 'Reach a 10× combo streak',
    category: 'combo',
    rarity: 'epic',
    icon: 'Crown',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed && payload.comboStreak >= 10,
  },
  {
    id: 'flawless_session',
    name: 'Flawless Session',
    description: 'Complete a run with zero failed potions (min. 10 potions brewed)',
    category: 'combo',
    rarity: 'legendary',
    icon: 'Gem',
    trigger: 'SESSION_END',
    check: (payload) => payload.totalFailed === 0 && payload.totalCompleted >= 10,
  },

  // --- CLIENT SERVICE ---
  {
    id: 'noble_servant',
    name: 'Noble Servant',
    description: 'Successfully serve a Noble client',
    category: 'clients',
    rarity: 'uncommon',
    icon: 'Award',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed && payload.clientType === 'noble',
  },
  {
    id: 'mystic_vision',
    name: 'Mystic Vision',
    description: 'Successfully serve a Mystic client with 90%+ accuracy',
    category: 'clients',
    rarity: 'rare',
    icon: 'Eye',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed && payload.clientType === 'mystic' && payload.accuracy >= 90,
  },
  {
    id: 'zombie_whisperer',
    name: 'Zombie Whisperer',
    description: 'Successfully serve 10 Zombie clients (lifetime)',
    category: 'clients',
    rarity: 'uncommon',
    icon: 'Ghost',
    trigger: 'POTION_SUBMITTED',
    maxProgress: 10,
    check: (payload, lifetimeStats) => {
      const isZombie = payload.passed && payload.clientType === 'zombie';
      const total = lifetimeStats.totalZombiesServed + (isZombie ? 1 : 0);
      return { progress: Math.min(total, 10), unlocked: total >= 10 };
    },
  },
  {
    id: 'wizards_favourite',
    name: "Wizard's Favourite",
    description: 'Successfully serve 10 Wizard clients (lifetime)',
    category: 'clients',
    rarity: 'uncommon',
    icon: 'Sparkles',
    trigger: 'POTION_SUBMITTED',
    maxProgress: 10,
    check: (payload, lifetimeStats) => {
      const isWizard = payload.passed && payload.clientType === 'wizard';
      const total = lifetimeStats.totalWizardsServed + (isWizard ? 1 : 0);
      return { progress: Math.min(total, 10), unlocked: total >= 10 };
    },
  },
  {
    id: 'crowd_pleaser',
    name: 'Crowd Pleaser',
    description: 'Successfully serve all 4 client types in a single session',
    category: 'clients',
    rarity: 'rare',
    icon: 'Users',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed && payload.sessionClientTypesServed.size >= 4,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Serve a client with 80%+ time remaining',
    category: 'clients',
    rarity: 'rare',
    icon: 'Gauge',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => {
      if (!payload.passed) return false;
      const ratio = payload.timeRemaining / payload.patience;
      return ratio >= 0.8;
    },
  },

  // --- WAVE PROGRESSION ---
  {
    id: 'surviving_the_storm',
    name: 'Surviving the Storm',
    description: 'Clear Wave 3',
    category: 'waves',
    rarity: 'common',
    icon: 'ShieldAlert',
    trigger: 'WAVE_CLEARED',
    check: (payload) => payload.waveNumber >= 3,
  },
  {
    id: 'veteran_brewer',
    name: 'Veteran Brewer',
    description: 'Clear Wave 5',
    category: 'waves',
    rarity: 'uncommon',
    icon: 'Award',
    trigger: 'WAVE_CLEARED',
    check: (payload) => payload.waveNumber >= 5,
  },
  {
    id: 'endurance_master',
    name: 'Endurance Master',
    description: 'Clear Wave 8',
    category: 'waves',
    rarity: 'rare',
    icon: 'Mountain',
    trigger: 'WAVE_CLEARED',
    check: (payload) => payload.waveNumber >= 8,
  },
  {
    id: 'infinite_brewer',
    name: 'The Infinite Brewer',
    description: 'Clear Wave 10 or higher',
    category: 'waves',
    rarity: 'epic',
    icon: 'Infinity',
    trigger: 'WAVE_CLEARED',
    check: (payload) => payload.waveNumber >= 10,
  },

  // --- COLOR SCIENCE & SCORE ---
  {
    id: 'colour_theorist',
    name: 'Colour Theorist',
    description: 'Use all 8 base ingredients in a single potion',
    category: 'color_science',
    rarity: 'uncommon',
    icon: 'Palette',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.ingredientsUsed.length >= 8,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Successfully submit a potion using only 1 ingredient',
    category: 'color_science',
    rarity: 'rare',
    icon: 'Eye',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed && payload.ingredientsUsed.length === 1,
  },
  {
    id: 'high_scorer',
    name: 'High Scorer',
    description: 'Reach a score of 2,000+ (S-rank) in a single run',
    category: 'color_science',
    rarity: 'rare',
    icon: 'Trophy',
    trigger: 'SESSION_END',
    check: (payload) => payload.finalScore >= 2000,
  },
  {
    id: 'score_legend',
    name: 'Score Legend',
    description: 'Reach a score of 5,000+ in a single run',
    category: 'color_science',
    rarity: 'epic',
    icon: 'Trophy',
    trigger: 'SESSION_END',
    check: (payload) => payload.finalScore >= 5000,
  },
  {
    id: 'centenary',
    name: 'Centenary',
    description: 'Achieve exactly 100.0% accuracy on a potion',
    category: 'color_science',
    rarity: 'legendary',
    icon: 'Compass',
    trigger: 'POTION_SUBMITTED',
    check: (payload) => payload.passed && payload.accuracy === 100,
  },
];
