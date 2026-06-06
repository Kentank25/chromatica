import { describe, it, expect } from 'vitest';
import { rgbToLab, labToRgb, computeDeltaE, computeAccuracy, mixColorsKM, BASE_INGREDIENTS } from './colorScience';

describe('colorScience', () => {
  describe('sRGB ↔ CIE L*a*b* conversion', () => {
    it('should convert black correctly', () => {
      const black = { r: 0, g: 0, b: 0 };
      const lab = rgbToLab(black);
      expect(lab.L).toBeCloseTo(0, 1);
      const rgb = labToRgb(lab);
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it('should convert white correctly', () => {
      const white = { r: 255, g: 255, b: 255 };
      const lab = rgbToLab(white);
      expect(lab.L).toBeCloseTo(100, 1);
      const rgb = labToRgb(lab);
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(255);
      expect(rgb.b).toBe(255);
    });

    it('should round-trip mid-gray color', () => {
      const gray = { r: 128, g: 128, b: 128 };
      const lab = rgbToLab(gray);
      const rgb = labToRgb(lab);
      expect(Math.abs(rgb.r - gray.r)).toBeLessThanOrEqual(2);
      expect(Math.abs(rgb.g - gray.g)).toBeLessThanOrEqual(2);
      expect(Math.abs(rgb.b - gray.b)).toBeLessThanOrEqual(2);
    });
  });

  describe('Delta E & Accuracy', () => {
    it('should calculate 100% accuracy for identical colors', () => {
      const color = { r: 100, g: 150, b: 200 };
      expect(computeAccuracy(color, color)).toBe(100);
    });

    it('should verify quadratic fall-off matching option A specs', () => {
      const target = { r: 255, g: 255, b: 255 }; // white
      const submitted = { r: 0, g: 0, b: 0 };    // black
      
      // Delta E of black vs white is 100
      const deltaE = computeDeltaE(target, submitted);
      expect(deltaE).toBeCloseTo(100, 1);

      // Maximum deltaE 100 should return 0% accuracy
      expect(computeAccuracy(target, submitted)).toBe(0);

      // Test a color that is halfway
      // Delta E of 50: accuracyRatio = 0.5. With exponent 2.0, (0.5)^2 * 100 = 25%
      const gray = { r: 119, g: 119, b: 119 }; // Close to 50 L
      const halfDeltaE = computeDeltaE(target, gray);
      const accuracy = computeAccuracy(target, gray);
      
      // Let's verify the formula matches: (1 - halfDeltaE/100)^2 * 100
      const expectedRatio = 1 - (halfDeltaE / 100);
      const expectedAccuracy = Math.pow(expectedRatio, 2) * 100;
      expect(accuracy).toBeCloseTo(expectedAccuracy, 1);
    });
  });

  describe('Kubelka-Munk Mixing', () => {
    it('should return white for empty ingredients', () => {
      expect(mixColorsKM([])).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return white if all amounts are zero', () => {
      const red = BASE_INGREDIENTS.find(i => i.id === 'red')!;
      expect(mixColorsKM([{ ingredient: red, amount: 0 }])).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should mix primary subtractive colors intuitively', () => {
      const yellow = BASE_INGREDIENTS.find(i => i.id === 'yellow')!;
      const blue = BASE_INGREDIENTS.find(i => i.id === 'blue')!;
      
      // Blue + Yellow should produce green-ish tone
      const mixed = mixColorsKM([
        { ingredient: yellow, amount: 5 },
        { ingredient: blue, amount: 5 }
      ]);
      
      // Green is characterized by G > R and G > B
      expect(mixed.g).toBeGreaterThan(mixed.r);
    });
  });
});
