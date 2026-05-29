/**
 * @module clientGenerator
 * Generates themed NPC clients for the potion shop with type-weighted
 * spawning, flavourful names, and wave-scaled difficulty.
 */

import type { Client, ClientModifiers, ClientType } from '../types/game.types';
import type { RGB } from '../types/color.types';
import { generateTargetColor, describeColor } from './colorScience';
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
  'Spellbinder Opaline',
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

const MYSTIC_NAMES: string[] = [
  'Oracle Maren',
  'Seer Ashwind',
  'Prophet Kira',
  'Blind Elder Vane',
  'Mystic Zephyr',
  'Sibyl Cassandra',
  'Scribe Elara',
  'Oracle Pythia',
  'Visage Oakhaven',
  'Dreamer Silas',
  'Auguste the Blinded',
];

const NAME_POOLS: Record<ClientType, string[]> = {
  villager: VILLAGER_NAMES,
  wizard: WIZARD_NAMES,
  zombie: ZOMBIE_NAMES,
  noble: NOBLE_NAMES,
  mystic: MYSTIC_NAMES,
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
    efficiencyPenalty: true,
    maxIngredients: 3,      // Noble clients demand at most 3 ingredients
  },
  mystic: {
    scoreMultiplier: 1.8,
    patience: 35,           // Slower speed since they describe in words
    accuracyThreshold: 0.65,
    penaltySeverity: 12,
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

  // Weight tables: [villager, wizard, zombie, noble, mystic]
  let weights: number[];
  if (w <= 2) {
    weights = [80, 10, 10, 0, 0];
  } else if (w <= 4) {
    weights = [45, 25, 18, 5, 7];
  } else if (w <= 7) {
    weights = [25, 25, 22, 15, 13];
  } else {
    weights = [10, 28, 25, 22, 15];
  }

  const total = weights.reduce((s, v) => s + v, 0);
  let roll = Math.random() * total;
  const types: ClientType[] = ['villager', 'wizard', 'zombie', 'noble', 'mystic'];

  for (let i = 0; i < types.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return types[i];
  }

  return 'villager'; // fallback
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

import { generateRequestedEffect } from './potionEffects';

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
  let targetColor = generateTargetColor(difficulty, wave);

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

  // Multi-Color Order generation
  // Wizard, zombie, noble are eligible for multi-color orders at wave >= 3
  let subOrders: RGB[] | undefined;
  let currentSubOrder: number | undefined;
  const isEligibleForMulti = type === 'wizard' || type === 'zombie' || type === 'noble';

  if (wave >= 3 && isEligibleForMulti) {
    const multiChance = wave >= 5 ? 0.30 : 0.15;
    if (Math.random() < multiChance) {
      const orderLength = wave >= 6 ? randomInt(2, 3) : 2;
      subOrders = [];
      for (let i = 0; i < orderLength; i++) {
        subOrders.push(generateTargetColor(difficulty, wave));
      }
      currentSubOrder = 0;
      targetColor = subOrders[0];

      // Multiplier of 1.5x patience for 2-potion orders, 2.0x for 3-potion orders
      const patienceMultiplier = orderLength === 2 ? 1.5 : 2.0;
      baseModifiers.patience = Math.round(baseModifiers.patience * patienceMultiplier);
    }
  }

  // Mystic text description generation
  let colorDescription: string | undefined;
  if (type === 'mystic') {
    colorDescription = describeColor(targetColor);
  }

  // Pre-generate dialogues in the engine to keep components pure and avoid impure Math.random calls during React render
  const dialogues: Record<ClientType, string[]> = {
    villager: ["I need this for my garden fence!", "Can you match this for me?"],
    wizard: ["I require PRECISELY this hue.", "My spell demands exactness."],
    zombie: ["Graaagh... me want this color...", "Pretty... color..."],
    noble: ["Perfect, commoner. Not one shade off.", "I hope you know what you're doing."],
    mystic: ["The shadows whisper to me...", "Explain the color of the winds...", "I can see the hidden truth..."],
  };
  const pool = dialogues[type];
  const dialogue = pool[randomInt(0, pool.length - 1)];

  const requestedEffect = generateRequestedEffect(type, wave);

  return {
    id: `client_${clientIdCounter}_${Date.now()}`,
    type,
    name,
    targetColor,
    modifiers: baseModifiers,
    expression: 'neutral',
    subOrders,
    currentSubOrder,
    colorDescription,
    dialogue,
    requestedEffect,
  };
}
