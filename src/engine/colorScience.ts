/**
 * @module colorScience
 * Core colour-science engine for Chromatica v2.
 *
 * Implements:
 * - sRGB ↔ Linear RGB ↔ CIE XYZ ↔ CIE L*a*b* conversions
 * - Delta E (CIE76) perceptual colour difference
 * - Kubelka-Munk subtractive colour mixing
 * - Pre-defined ingredient palette with realistic K/S coefficients
 * - Random target colour generation for gameplay
 */

import type { RGB, LAB, Ingredient } from '../types/color.types';
import { clamp, randomInt, randomFloat } from '../utils/mathUtils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** D65 standard illuminant reference white (CIE 1931 2° observer). */
const D65_WHITE: [number, number, number] = [95.047, 100.0, 108.883];

/**
 * sRGB to CIE XYZ (D65) transformation matrix.
 * Each row maps [R_linear, G_linear, B_linear] → one XYZ component.
 */
const SRGB_TO_XYZ: [number, number, number][] = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041],
];

/**
 * CIE XYZ (D65) to sRGB transformation matrix (inverse of SRGB_TO_XYZ).
 */
const XYZ_TO_SRGB: [number, number, number][] = [
  [ 3.2404542, -1.5371385, -0.4985314],
  [-0.9692660,  1.8760108,  0.0415560],
  [ 0.0556434, -0.2040259,  1.0572252],
];

// ---------------------------------------------------------------------------
// sRGB gamma helpers
// ---------------------------------------------------------------------------

/**
 * Removes sRGB gamma to produce a linear-light value.
 * Uses the IEC 61966-2-1 piecewise transfer function.
 * @param c - sRGB channel value normalised to 0-1.
 */
function srgbToLinear(c: number): number {
  if (c <= 0.04045) {
    return c / 12.92;
  }
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Applies sRGB gamma companding to a linear-light value.
 * @param c - Linear channel value (0-1).
 */
function linearToSrgb(c: number): number {
  if (c <= 0.0031308) {
    return 12.92 * c;
  }
  return 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
}

// ---------------------------------------------------------------------------
// Colour-space conversions
// ---------------------------------------------------------------------------

/**
 * Converts an sRGB colour (0-255 per channel) to CIE L*a*b*.
 *
 * Pipeline: sRGB → linear RGB → CIE XYZ (D65) → CIE L*a*b*.
 */
export function rgbToLab(color: RGB): LAB {
  // 1. Normalise to 0-1 and linearise
  const rLin = srgbToLinear(color.r / 255);
  const gLin = srgbToLinear(color.g / 255);
  const bLin = srgbToLinear(color.b / 255);

  // 2. Linear RGB → XYZ (values in 0-~100 range)
  const x =
    (SRGB_TO_XYZ[0][0] * rLin +
      SRGB_TO_XYZ[0][1] * gLin +
      SRGB_TO_XYZ[0][2] * bLin) * 100;
  const y =
    (SRGB_TO_XYZ[1][0] * rLin +
      SRGB_TO_XYZ[1][1] * gLin +
      SRGB_TO_XYZ[1][2] * bLin) * 100;
  const z =
    (SRGB_TO_XYZ[2][0] * rLin +
      SRGB_TO_XYZ[2][1] * gLin +
      SRGB_TO_XYZ[2][2] * bLin) * 100;

  // 3. XYZ → LAB
  const xr = x / D65_WHITE[0];
  const yr = y / D65_WHITE[1];
  const zr = z / D65_WHITE[2];

  const epsilon = 0.008856; // (6/29)^3
  const kappa = 903.3; // (29/3)^3

  const fx = xr > epsilon ? Math.cbrt(xr) : (kappa * xr + 16) / 116;
  const fy = yr > epsilon ? Math.cbrt(yr) : (kappa * yr + 16) / 116;
  const fz = zr > epsilon ? Math.cbrt(zr) : (kappa * zr + 16) / 116;

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { L, a, b };
}

/**
 * Converts CIE L*a*b* back to sRGB (0-255, clamped).
 *
 * Pipeline: CIE L*a*b* → CIE XYZ (D65) → linear RGB → sRGB.
 */
export function labToRgb(lab: LAB): RGB {
  // 1. LAB → XYZ
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const epsilon = 0.008856;
  const kappa = 903.3;

  const xr = fx * fx * fx > epsilon ? fx * fx * fx : (116 * fx - 16) / kappa;
  const yr = lab.L > kappa * epsilon ? fy * fy * fy : lab.L / kappa;
  const zr = fz * fz * fz > epsilon ? fz * fz * fz : (116 * fz - 16) / kappa;

  const x = xr * D65_WHITE[0] / 100;
  const y = yr * D65_WHITE[1] / 100;
  const z = zr * D65_WHITE[2] / 100;

  // 2. XYZ → linear RGB
  const rLin =
    XYZ_TO_SRGB[0][0] * x + XYZ_TO_SRGB[0][1] * y + XYZ_TO_SRGB[0][2] * z;
  const gLin =
    XYZ_TO_SRGB[1][0] * x + XYZ_TO_SRGB[1][1] * y + XYZ_TO_SRGB[1][2] * z;
  const bLin =
    XYZ_TO_SRGB[2][0] * x + XYZ_TO_SRGB[2][1] * y + XYZ_TO_SRGB[2][2] * z;

  // 3. Gamma-compress and scale to 0-255
  return {
    r: clamp(Math.round(linearToSrgb(clamp(rLin, 0, 1)) * 255), 0, 255),
    g: clamp(Math.round(linearToSrgb(clamp(gLin, 0, 1)) * 255), 0, 255),
    b: clamp(Math.round(linearToSrgb(clamp(bLin, 0, 1)) * 255), 0, 255),
  };
}

// ---------------------------------------------------------------------------
// Delta E (CIE76)
// ---------------------------------------------------------------------------

/**
 * Computes the CIE76 colour difference (Delta E) between two sRGB colours.
 * This is the Euclidean distance in CIE L*a*b* space.
 *
 * Perceptual thresholds (approximate):
 * - < 1   : imperceptible
 * - 1-2   : perceptible upon close inspection
 * - 2-10  : obvious
 * - 11-50 : very different
 * - > 50  : unrelated
 */
export function computeDeltaE(color1: RGB, color2: RGB): number {
  const lab1 = rgbToLab(color1);
  const lab2 = rgbToLab(color2);
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 +
    (lab1.a - lab2.a) ** 2 +
    (lab1.b - lab2.b) ** 2,
  );
}

// ---------------------------------------------------------------------------
// Accuracy
// ---------------------------------------------------------------------------

/**
 * Computes an accuracy score (0-100) between a target and submitted colour.
 *
 * The maximum meaningful Delta E in sRGB is roughly 100 (black vs white).
 * The function maps Delta E → accuracy via a quadratic curve that is more
 * forgiving for small errors.
 *
 * @returns A number in [0, 100] where 100 = perfect match.
 */
export function computeAccuracy(target: RGB, submitted: RGB): number {
  const deltaE = computeDeltaE(target, submitted);
  const maxDeltaE = 100;
  const normalised = clamp(deltaE / maxDeltaE, 0, 1);
  // Quadratic fall-off: small errors penalised less
  const accuracy = (1 - normalised) ** 0.8 * 100;
  return clamp(Math.round(accuracy * 100) / 100, 0, 100);
}

// ---------------------------------------------------------------------------
// Kubelka-Munk subtractive mixing
// ---------------------------------------------------------------------------

/**
 * Performs Kubelka-Munk subtractive colour mixing.
 *
 * The K-M model treats each pigment as having absorption (K) and scattering
 * (S) coefficients.  Mixing pigments sums the weighted K and S values
 * independently, then derives reflectance from the combined K/S ratio:
 *
 *   R = 1 + K/S − √((K/S)² + 2·(K/S))
 *
 * The per-channel reflectance (0-1) is then converted to sRGB.
 *
 * @param ingredients - Array of { ingredient, amount } pairs.
 * @returns The mixed sRGB colour.
 */
export function mixColorsKM(
  ingredients: { ingredient: Ingredient; amount: number }[],
): RGB {
  if (ingredients.length === 0) {
    // No pigment → pure white substrate
    return { r: 255, g: 255, b: 255 };
  }

  // Accumulate weighted K and S across all ingredients, per channel.
  const totalK: [number, number, number] = [0, 0, 0];
  const totalS: [number, number, number] = [0, 0, 0];
  let totalWeight = 0;

  for (const { ingredient, amount } of ingredients) {
    if (amount <= 0) continue;
    for (let ch = 0; ch < 3; ch++) {
      totalK[ch] += ingredient.km.K[ch] * amount;
      totalS[ch] += ingredient.km.S[ch] * amount;
    }
    totalWeight += amount;
  }

  if (totalWeight === 0) {
    return { r: 255, g: 255, b: 255 };
  }

  // Convert K/S ratios to reflectance per channel
  const reflectance: [number, number, number] = [0, 0, 0];
  for (let ch = 0; ch < 3; ch++) {
    const ks = totalS[ch] > 0 ? totalK[ch] / totalS[ch] : 0;
    // R = 1 + K/S − sqrt((K/S)² + 2·K/S)
    reflectance[ch] = clamp(1 + ks - Math.sqrt(ks * ks + 2 * ks), 0, 1);
  }

  // Reflectance → sRGB (apply gamma)
  return {
    r: clamp(Math.round(linearToSrgb(reflectance[0]) * 255), 0, 255),
    g: clamp(Math.round(linearToSrgb(reflectance[1]) * 255), 0, 255),
    b: clamp(Math.round(linearToSrgb(reflectance[2]) * 255), 0, 255),
  };
}

// ---------------------------------------------------------------------------
// Base ingredient palette
// ---------------------------------------------------------------------------

/**
 * The 8 base pigment ingredients available to the player.
 *
 * K/S coefficients are tuned so that:
 * - Primary subtractive mixes behave intuitively (red + yellow → orange, etc.)
 * - White has low absorption / high scattering (lightens mixes)
 * - Black has high absorption / low scattering (darkens mixes)
 *
 * Coefficients follow the convention [R, G, B] channels.
 * Higher K = more absorption in that channel (removes that light).
 * Higher S = more scattering in that channel (reflects that light).
 */
export const BASE_INGREDIENTS: Ingredient[] = [
  {
    id: 'red',
    name: 'Crimson Essence',
    displayColor: { r: 220, g: 30, b: 30 },
    km: {
      K: [0.12, 3.5, 3.8],   // Low absorption in R (reflects red), high in G & B
      S: [1.0, 0.8, 0.8],
    },
  },
  {
    id: 'blue',
    name: 'Azure Dust',
    displayColor: { r: 30, g: 60, b: 220 },
    km: {
      K: [4.0, 2.5, 0.1],    // High absorption in R, moderate in G, low in B
      S: [0.8, 0.9, 1.0],
    },
  },
  {
    id: 'yellow',
    name: 'Sol Pollen',
    displayColor: { r: 240, g: 220, b: 30 },
    km: {
      K: [0.05, 0.1, 4.2],   // Very low R & G absorption (reflects both), high B absorption
      S: [1.0, 1.0, 0.7],
    },
  },
  {
    id: 'green',
    name: 'Verdant Sap',
    displayColor: { r: 30, g: 180, b: 50 },
    km: {
      K: [3.6, 0.15, 3.2],   // Absorbs R and B, reflects G
      S: [0.8, 1.0, 0.85],
    },
  },
  {
    id: 'white',
    name: 'Moonstone Powder',
    displayColor: { r: 245, g: 245, b: 240 },
    km: {
      K: [0.02, 0.02, 0.02], // Almost no absorption
      S: [2.0, 2.0, 2.0],    // Very high scattering
    },
  },
  {
    id: 'black',
    name: 'Void Ash',
    displayColor: { r: 25, g: 25, b: 30 },
    km: {
      K: [5.0, 5.0, 5.0],    // Maximum absorption
      S: [0.15, 0.15, 0.15], // Minimal scattering
    },
  },
  {
    id: 'orange',
    name: 'Ember Extract',
    displayColor: { r: 235, g: 130, b: 20 },
    km: {
      K: [0.08, 1.8, 4.5],   // Low R absorption, moderate G, high B
      S: [1.0, 0.9, 0.75],
    },
  },
  {
    id: 'purple',
    name: 'Nightshade Tincture',
    displayColor: { r: 140, g: 30, b: 180 },
    km: {
      K: [1.5, 4.2, 0.6],    // Moderate R absorption, high G, low B
      S: [0.85, 0.7, 0.95],
    },
  },
  {
    id: 'teal',
    name: 'Deepwater Pearl',
    displayColor: { r: 0, g: 150, b: 160 },
    km: {
      K: [3.5, 0.15, 0.15],
      S: [0.8, 1.0, 1.0],
    },
    unlockWave: 3,
  },
  {
    id: 'magenta',
    name: "Dragon's Blood",
    displayColor: { r: 210, g: 30, b: 140 },
    km: {
      K: [0.15, 4.0, 0.15],
      S: [1.0, 0.75, 0.95],
    },
    unlockWave: 4,
  },
  {
    id: 'ochre',
    name: 'Earth Clay',
    displayColor: { r: 180, g: 120, b: 50 },
    km: {
      K: [0.5, 1.8, 3.8],
      S: [0.9, 0.85, 0.7],
    },
    unlockWave: 5,
  },
  {
    id: 'silver',
    name: 'Lunar Dust',
    displayColor: { r: 200, g: 205, b: 215 },
    km: {
      K: [0.03, 0.025, 0.01],
      S: [2.5, 2.5, 2.7],
    },
    unlockWave: 6,
  },
];

// ---------------------------------------------------------------------------
// Target colour generation
// ---------------------------------------------------------------------------

/**
 * Generates a random target colour by mixing 2-4 random base ingredients.
 *
 * @param difficulty - 1 (easy), 2 (medium), or 3 (hard).
 *   - Easy:  2 ingredients, generous amounts.
 *   - Medium: 2-3 ingredients, mixed amounts.
 *   - Hard:  3-4 ingredients with subtle ratios.
 * @param wave - Current wave to filter available ingredients.
 * @returns An sRGB colour suitable as a client's target.
 */
export function generateTargetColor(difficulty: number, wave: number = 1): RGB {
  const diff = clamp(Math.round(difficulty), 1, 3);

  // Filter ingredients to only those unlocked in the current wave
  const unlockedIngredients = BASE_INGREDIENTS.filter(
    (ing) => (ing.unlockWave ?? 1) <= wave
  );

  // Number of ingredients based on difficulty
  let ingredientCount: number;
  switch (diff) {
    case 1:
      ingredientCount = Math.min(2, unlockedIngredients.length);
      break;
    case 2:
      ingredientCount = clamp(randomInt(2, 3), 1, unlockedIngredients.length);
      break;
    case 3:
    default:
      ingredientCount = clamp(randomInt(3, 4), 1, unlockedIngredients.length);
      break;
  }

  // Pick distinct random ingredients (avoid duplicates)
  const availableIndices = Array.from(
    { length: unlockedIngredients.length },
    (_, i) => i,
  );
  const chosen: { ingredient: Ingredient; amount: number }[] = [];

  for (let i = 0; i < ingredientCount && availableIndices.length > 0; i++) {
    const pickIdx = randomInt(0, availableIndices.length - 1);
    const ingredientIdx = availableIndices.splice(pickIdx, 1)[0];
    const ingredient = unlockedIngredients[ingredientIdx];

    // Amount range shrinks with difficulty for subtler mixes
    let amount: number;
    switch (diff) {
      case 1:
        amount = randomFloat(0.5, 2.0);
        break;
      case 2:
        amount = randomFloat(0.3, 1.5);
        break;
      case 3:
      default:
        amount = randomFloat(0.15, 1.0);
        break;
    }

    chosen.push({ ingredient, amount });
  }

  return mixColorsKM(chosen);
}

