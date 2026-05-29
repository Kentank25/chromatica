/**
 * @module engine.potionEffects
 * Potion effect detection and metadata mapping based on HSL color science.
 */

import type { RGB } from '../types/color.types';
import type { ClientType, PotionEffect } from '../types/game.types';
import { rgbToHsl } from '../utils/colorUtils';

/**
 * Detects the dominant magical effect based on HSL color characteristics.
 * Prioritizes extremes of Lightness, then Saturation, then Hue.
 */
export function detectEffect(color: RGB): PotionEffect {
  // Return null if color matches the default empty bottle color
  if (color.r === 40 && color.g === 40 && color.b === 50) {
    return null;
  }

  const { h, s, l } = rgbToHsl(color);

  // 1. Lightness extremes
  if (l >= 75) return 'luminous';
  if (l <= 25) return 'shadowy';

  // 2. Saturation extremes
  if (s >= 75) return 'vivid';
  if (s <= 20) return 'muted';

  // 3. Hue ranges
  if (h <= 60 || h >= 330) return 'warm';
  if (h >= 180 && h <= 270) return 'cool';

  return null;
}

export interface EffectMetadata {
  name: string;
  desc: string;
  icon: string;
  cssClass: string;
  rangeHint: string;
}

export const EFFECT_INFO: Record<Exclude<PotionEffect, null>, EffectMetadata> = {
  luminous: {
    name: 'Luminous',
    desc: 'A bright, radiant potion filled with light.',
    icon: 'Sun',
    cssClass: 'potion-effect--luminous',
    rangeHint: 'Lightness ≥ 75%'
  },
  shadowy: {
    name: 'Shadowy',
    desc: 'A dark, swirling potion of shadow and mystery.',
    icon: 'Moon',
    cssClass: 'potion-effect--shadowy',
    rangeHint: 'Lightness ≤ 25%'
  },
  vivid: {
    name: 'Vivid',
    desc: 'An intense, highly vibrant color burst.',
    icon: 'Rainbow',
    cssClass: 'potion-effect--vivid',
    rangeHint: 'Saturation ≥ 75%'
  },
  muted: {
    name: 'Muted',
    desc: 'A soft, desaturated and hazy potion.',
    icon: 'CloudFog',
    cssClass: 'potion-effect--muted',
    rangeHint: 'Saturation ≤ 20%'
  },
  warm: {
    name: 'Warm',
    desc: 'Brimming with thermal embers and heat.',
    icon: 'Flame',
    cssClass: 'potion-effect--warm',
    rangeHint: 'Hue 0-60° or 330-360°'
  },
  cool: {
    name: 'Cool',
    desc: 'Chilled and frost-crystallized liquid.',
    icon: 'Snowflake',
    cssClass: 'potion-effect--cool',
    rangeHint: 'Hue 180-270°'
  }
};

const EFFECTS: Exclude<PotionEffect, null>[] = ['luminous', 'shadowy', 'vivid', 'muted', 'warm', 'cool'];

/**
 * Determines if a client requests an effect based on wave number and archetype.
 * Mystics never request effects. Nobles always do (if wave >= 4).
 * Villagers/Wizards/Zombies have a chance that scales with wave.
 */
export function generateRequestedEffect(clientType: ClientType, wave: number): PotionEffect | null {
  if (wave < 4) return null;
  if (clientType === 'mystic') return null;

  const requestChance = clientType === 'noble' ? 1.0 : (wave >= 7 ? 0.40 : 0.25);

  if (Math.random() < requestChance) {
    const randomIndex = Math.floor(Math.random() * EFFECTS.length);
    return EFFECTS[randomIndex];
  }

  return null;
}
