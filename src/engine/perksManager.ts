/**
 * @module perksManager
 * Stateless definition of alchemical perks/upgrades for Endless Mode.
 */

export interface PerkDefinition {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  scoreMultiplier?: number;
  patienceMultiplier?: number;
  penaltyMultiplier?: number;
  comboMultiplier?: number;
  instantSatisfactionHeal?: number;
  instantTokens?: {
    skip?: number;
    hint?: number;
    autoCorrect?: number;
  };
}

export type Perk = PerkDefinition;

export const PERK_POOL: PerkDefinition[] = [
  {
    id: 'heal_satisfaction_common',
    name: 'Alchemical Restorative',
    description: 'Instantly restore 25 shop satisfaction.',
    rarity: 'common',
    instantSatisfactionHeal: 25,
  },
  {
    id: 'score_boost_common',
    name: 'Gilded Vials',
    description: '+15% score multiplier on all successful potions.',
    rarity: 'common',
    scoreMultiplier: 1.15,
  },
  {
    id: 'patience_boost_rare',
    name: 'Dilated Time',
    description: '+20% client patience countdown timer.',
    rarity: 'rare',
    patienceMultiplier: 1.20,
  },
  {
    id: 'penalty_reduction_rare',
    name: 'Forgiving Patrons',
    description: 'Reduces shop satisfaction penalties by 30%.',
    rarity: 'rare',
    penaltyMultiplier: 0.70,
  },
  {
    id: 'combo_booster_epic',
    name: 'Catalytic Combo',
    description: 'Increases combo streak score bonuses by 50%.',
    rarity: 'epic',
    comboMultiplier: 1.5,
  },
  {
    id: 'token_gift_skip_common',
    name: 'Aerosol Skip',
    description: 'Grants +2 Skip Tokens instantly.',
    rarity: 'common',
    instantTokens: { skip: 2 },
  },
  {
    id: 'token_gift_hint_common',
    name: 'Clairvoyant Dust',
    description: 'Grants +2 Hint Tokens instantly.',
    rarity: 'common',
    instantTokens: { hint: 2 },
  },
  {
    id: 'elixir_of_life_legendary',
    name: 'Elixir of Life',
    description: 'Instantly restore 50 satisfaction and gain +10% patience.',
    rarity: 'legendary',
    instantSatisfactionHeal: 50,
    patienceMultiplier: 1.10,
  },
  {
    id: 'philosophers_stone_legendary',
    name: "Philosopher's Stone",
    description: '+30% score multiplier and +1 Auto-Correct Token.',
    rarity: 'legendary',
    scoreMultiplier: 1.30,
    instantTokens: { autoCorrect: 1 },
  }
];
