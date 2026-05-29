/**
 * @module clientGenerator
 * Generates themed NPC clients for the potion shop with type-weighted
 * spawning, flavourful names, and wave-scaled difficulty.
 */

import type { Client, ClientModifiers, ClientType } from '../types/game.types';
import { generateTargetColor } from './colorScience';
import { randomInt, clamp } from '../utils/mathUtils';

// ---------------------------------------------------------------------------
// Name pools (≥ 10 per type)
// ---------------------------------------------------------------------------

const VILLAGER_NAMES: string[] = [
  'Farmer Giles',
  'Miller Maggie',
  'Baker Tomas',
  'Martha the Weaver',
  'Old Barnaby',
  'Widow Penny',
  'Young Cedric',
  'Helga Bramble',
  'Shepherd Quinn',
  'Pip the Stable Boy',
  'Annie Oakheart',
  'Nettie Greenfield',
];

const WIZARD_NAMES: string[] = [
  'Archmage Velor',
  'Sage Pyrethia',
  'Magus Thorn',
  'Enchantress Lyria',
  'Warlock Drace',
  'Mystic Opaline',
  'Sorcerer Kael',
  'Diviner Ash',
  'Conjurer Bramwell',
  'Alchemist Solis',
  'Spellweaver Nyx',
  'Runekeeper Elden',
];

const ZOMBIE_NAMES: string[] = [
  'Groaning Gary',
  'Shambling Sue',
  'Half-jaw Hector',
  'Moldy Marge',
  'Stitched Simon',
  'Rattlebones Rex',
  'Putrid Pete',
  'Lurching Lila',
  'Corpse Carl',
  'Decayed Doris',
  'Bonecreak Boris',
  'Rotsworth the Fallen',
];

const NOBLE_NAMES: string[] = [
  'Duke Aldric',
  'Baroness Vivienne',
  'Count Marcellus',
  'Lady Seraphine',
  'Lord Ashworth',
  'Duchess Evaine',
  'Viscount Ormond',
  'Dame Celestine',
  'Marquess Darian',
  'Princess Elowen',
];

const NAME_POOLS: Record<ClientType, string[]> = {
  villager: VILLAGER_NAMES,
  wizard: WIZARD_NAMES,
  zombie: ZOMBIE_NAMES,
  noble: NOBLE_NAMES,
};

// ---------------------------------------------------------------------------
// Client modifiers by type
// ---------------------------------------------------------------------------

const MODIFIERS: Record<ClientType, ClientModifiers> = {
  villager: {
    scoreMultiplier: 1.0,
    patience: 45,           // Very patient
    accuracyThreshold: 0.70,
    penaltySeverity: 5,     // Low penalty on failure
  },
  wizard: {
    scoreMultiplier: 2.0,
    patience: 20,           // Impatient
    accuracyThreshold: 0.70,
    penaltySeverity: 10,    // Medium penalty
  },
  zombie: {
    scoreMultiplier: 1.5,
    patience: 30,           // Moderate patience
    accuracyThreshold: 0.60,
    penaltySeverity: 15,    // High penalty
  },
  noble: {
    scoreMultiplier: 2.5,
    patience: 25,
    accuracyThreshold: 0.80,
    penaltySeverity: 20,    // Very high penalty
  },
};

// ---------------------------------------------------------------------------
// Client type weighting
// ---------------------------------------------------------------------------

/**
 * Returns a random client type weighted by the current wave.
 *
 * Early waves are dominated by villagers; later waves introduce wizards,
 * zombies, and eventually nobles.
 */
function pickClientType(wave: number): ClientType {
  const w = clamp(wave, 1, 20);

  // Weight tables: [villager, wizard, zombie, noble]
  let weights: number[];
  if (w <= 2) {
    weights = [80, 10, 10, 0];
  } else if (w <= 4) {
    weights = [50, 25, 20, 5];
  } else if (w <= 7) {
    weights = [30, 30, 25, 15];
  } else {
    weights = [15, 30, 30, 25];
  }

  const total = weights.reduce((s, v) => s + v, 0);
  let roll = Math.random() * total;
  const types: ClientType[] = ['villager', 'wizard', 'zombie', 'noble'];

  for (let i = 0; i < types.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return types[i];
  }

  return 'villager'; // fallback
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let clientIdCounter = 0;

/**
 * Generates a new client NPC for the given wave.
 *
 * @param wave - Current wave number (1-based). Controls type weighting and
 *               target colour difficulty.
 * @returns A fully-formed {@link Client} ready to present to the player.
 */
export function generateClient(
  wave: number,
  difficultyMode: 'apprentice' | 'journeyman' | 'master' = 'journeyman',
): Client {
  const type = pickClientType(wave);
  const names = NAME_POOLS[type];
  const name = names[randomInt(0, names.length - 1)];

  // Difficulty scales with wave: wave 1-2 → 1, wave 3-4 → 2, wave 5+ → 3
  const difficulty = clamp(Math.ceil(wave / 2), 1, 3);
  const targetColor = generateTargetColor(difficulty, wave);

  clientIdCounter += 1;

  const baseModifiers = { ...MODIFIERS[type] };

  if (difficultyMode === 'apprentice') {
    baseModifiers.patience += 15;
    baseModifiers.accuracyThreshold = 0.60;
  } else if (difficultyMode === 'master') {
    baseModifiers.patience = Math.max(5, baseModifiers.patience - 5);
    baseModifiers.accuracyThreshold = 0.80;
    baseModifiers.penaltySeverity = Math.round(baseModifiers.penaltySeverity * 1.5);
  }

  return {
    id: `client_${clientIdCounter}_${Date.now()}`,
    type,
    name,
    targetColor,
    modifiers: baseModifiers,
    expression: 'neutral',
  };
}
