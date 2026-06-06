import { describe, it, expect } from 'vitest';
import { getComboMultiplier, getComboReward, evaluatePotion } from './scoring';
import type { Client } from '../types/game.types';

describe('scoring', () => {
  describe('Combo Multiplier Capping', () => {
    it('should calculate linear combo multipliers under the cap', () => {
      // 10% per streak level
      expect(getComboMultiplier(0)).toBe(1.0);
      expect(getComboMultiplier(5)).toBe(1.5);
      expect(getComboMultiplier(10)).toBe(2.0);
      expect(getComboMultiplier(19)).toBe(2.9);
    });

    it('should cap the combo multiplier at 3.0x for streaks >= 20', () => {
      expect(getComboMultiplier(20)).toBe(3.0);
      expect(getComboMultiplier(25)).toBe(3.0);
      expect(getComboMultiplier(50)).toBe(3.0);
    });
  });

  describe('Combo Rewards', () => {
    it('should assign correct tokens for streak milestones', () => {
      expect(getComboReward(3)).toBe('skip');
      expect(getComboReward(5)).toBe('hint');
      expect(getComboReward(7)).toBe('autoCorrect');
      
      expect(getComboReward(0)).toBeNull();
      expect(getComboReward(4)).toBeNull();
      expect(getComboReward(8)).toBeNull();
    });
  });

  describe('Potion Evaluation', () => {
    const mockClient: Client = {
      id: 'client_1',
      name: 'Test Villager',
      type: 'villager',
      expression: 'neutral',
      dialogue: 'Hello',
      targetColor: { r: 255, g: 0, b: 0 },
      requestedEffect: null,
      modifiers: {
        patience: 30,
        scoreMultiplier: 1.0,
        accuracyThreshold: 0.7, // 70%
        penaltySeverity: 10,
      },
    };

    it('should fail evaluations below the threshold', () => {
      // White vs Red should have a low accuracy
      const result = evaluatePotion(
        mockClient.targetColor,
        { r: 255, g: 255, b: 255 }, // white submitted
        mockClient,
        30, // time remaining
        0   // combo streak
      );
      
      expect(result.passed).toBe(false);
      expect(result.pointsEarned).toBe(0);
    });

    it('should pass evaluations above the threshold and reward points', () => {
      // Exact color submitted
      const result = evaluatePotion(
        mockClient.targetColor,
        mockClient.targetColor,
        mockClient,
        30, // time remaining
        0   // combo streak
      );
      
      expect(result.passed).toBe(true);
      expect(result.pointsEarned).toBeGreaterThan(0);
    });

    it('should apply combo multipliers to base points', () => {
      const resultNoCombo = evaluatePotion(
        mockClient.targetColor,
        mockClient.targetColor,
        mockClient,
        30,
        0 // no combo
      );

      const resultWithCombo = evaluatePotion(
        mockClient.targetColor,
        mockClient.targetColor,
        mockClient,
        30,
        10 // 2.0x multiplier
      );

      // Points should be approximately doubled
      expect(resultWithCombo.pointsEarned).toBeGreaterThan(resultNoCombo.pointsEarned * 1.5);
    });
  });
});
