/**
 * @module color.types
 * Core color-space and ingredient type definitions for Chromatica v2.
 */

/** Standard sRGB color with channels in the 0-255 range. */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Hue-Saturation-Lightness representation. H: 0-360, S: 0-100, L: 0-100. */
export interface HSL {
  h: number;
  s: number;
  l: number;
}

/** CIE L*a*b* perceptual color space. L: 0-100, a/b: roughly -128 to 127. */
export interface LAB {
  L: number;
  a: number;
  b: number;
}

/**
 * Kubelka-Munk absorption (K) and scattering (S) coefficients.
 * Each is a 3-element tuple representing the RGB channels.
 */
export interface KMCoefficients {
  K: [number, number, number];
  S: [number, number, number];
}

/** A mixable potion ingredient with display colour and physical paint properties. */
export interface Ingredient {
  id: string;
  name: string;
  displayColor: RGB;
  km: KMCoefficients;
}
