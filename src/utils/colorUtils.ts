/**
 * @module colorUtils
 * Convenience colour-conversion helpers for display and CSS interop.
 */

import type { RGB, HSL } from '../types/color.types';
import { clamp } from './mathUtils';

/**
 * Converts an RGB colour to a 6-digit hex string (e.g. "#ff8800").
 */
export function rgbToHex(color: RGB): string {
  const toHex = (n: number): string =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

/**
 * Parses a hex colour string into an RGB object.
 * Accepts "#rgb", "#rrggbb", "rgb", and "rrggbb".
 */
export function hexToRgb(hex: string): RGB {
  let h = hex.replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6) {
    throw new Error(`Invalid hex colour: "${hex}"`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Returns a CSS `rgb(r, g, b)` string.
 */
export function rgbToCssString(color: RGB): string {
  return `rgb(${clamp(Math.round(color.r), 0, 255)}, ${clamp(Math.round(color.g), 0, 255)}, ${clamp(Math.round(color.b), 0, 255)})`;
}

/**
 * Converts an RGB colour (0-255) to HSL.
 * H: 0-360, S: 0-100, L: 0-100.
 */
export function rgbToHsl(color: RGB): HSL {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
