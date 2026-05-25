import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { BASE_INGREDIENTS, mixColorsKM } from '../../engine/colorScience';
import type { RGB, Ingredient } from '../../types/color.types';
import Button from '../common/Button';
import './ColorMixer.css';

interface ColorMixerProps {
  onSubmit: () => void;
  disabled?: boolean;
}

function rgbToHex(c: RGB): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

const ColorMixer: React.FC<ColorMixerProps> = ({ onSubmit, disabled = false }) => {
  const setPlayerMix = useGameStore((s) => s.setPlayerMix);

  // Track amount per ingredient by ingredient id
  const [amounts, setAmounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    BASE_INGREDIENTS.forEach((ing: Ingredient) => {
      initial[ing.id] = 0;
    });
    return initial;
  });

  // Compute the mixed color from current amounts
  const mixedColor: RGB = useMemo(() => {
    const entries: Array<{ ingredient: Ingredient; amount: number }> = [];
    BASE_INGREDIENTS.forEach((ing: Ingredient) => {
      const amt = amounts[ing.id] || 0;
      if (amt > 0) {
        entries.push({ ingredient: ing, amount: amt });
      }
    });
    if (entries.length === 0) {
      return { r: 40, g: 40, b: 50 }; // empty dark
    }
    return mixColorsKM(entries);
  }, [amounts]);

  // Sync to store
  useEffect(() => {
    setPlayerMix(mixedColor);
  }, [mixedColor, setPlayerMix]);

  const totalAmount = useMemo(
    () => Object.values(amounts).reduce((s, v) => s + v, 0),
    [amounts],
  );

  const increment = useCallback((id: string) => {
    setAmounts((prev) => ({
      ...prev,
      [id]: Math.min(10, (prev[id] || 0) + 1),
    }));
  }, []);

  const decrement = useCallback((id: string) => {
    setAmounts((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) - 1),
    }));
  }, []);

  const resetAll = useCallback(() => {
    const cleared: Record<string, number> = {};
    BASE_INGREDIENTS.forEach((ing: Ingredient) => {
      cleared[ing.id] = 0;
    });
    setAmounts(cleared);
  }, []);

  const hex = rgbToHex(mixedColor);

  return (
    <section className="color-mixer" aria-label="Color Mixer">
      {/* Preview */}
      <div className="color-mixer__preview">
        <span className="color-mixer__preview-label">Your Brew</span>
        <div
          className="color-mixer__preview-orb"
          style={{
            background: `rgb(${mixedColor.r}, ${mixedColor.g}, ${mixedColor.b})`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.4),
                         0 0 30px rgba(${mixedColor.r}, ${mixedColor.g}, ${mixedColor.b}, 0.35),
                         inset 0 -4px 12px rgba(0,0,0,0.3),
                         inset 0 4px 12px rgba(255,255,255,0.08)`,
          }}
        />
        <span className="color-mixer__preview-hex">{totalAmount > 0 ? hex : '—'}</span>
      </div>

      {/* Ingredients */}
      <div className="color-mixer__ingredients">
        {BASE_INGREDIENTS.map((ing: Ingredient) => {
          const amt = amounts[ing.id] || 0;
          return (
            <div
              key={ing.id}
              className={`color-mixer__ingredient ${amt > 0 ? 'color-mixer__ingredient--active' : ''}`}
            >
              <div
                className="color-mixer__ingredient-orb"
                style={{
                  background: `rgb(${ing.displayColor.r}, ${ing.displayColor.g}, ${ing.displayColor.b})`,
                  boxShadow: amt > 0
                    ? `0 2px 10px rgba(0,0,0,0.3), 0 0 ${6 + amt * 2}px rgba(${ing.displayColor.r}, ${ing.displayColor.g}, ${ing.displayColor.b}, 0.4)`
                    : undefined,
                }}
              />
              <span className="color-mixer__ingredient-name">{ing.name}</span>
              <div className="color-mixer__ingredient-controls">
                <button
                  id={`mixer-dec-${ing.id}`}
                  className="color-mixer__ingredient-btn"
                  onClick={() => decrement(ing.id)}
                  disabled={amt <= 0 || disabled}
                  aria-label={`Decrease ${ing.name}`}
                >
                  −
                </button>
                <span className="color-mixer__ingredient-amount">{amt}</span>
                <button
                  id={`mixer-inc-${ing.id}`}
                  className="color-mixer__ingredient-btn"
                  onClick={() => increment(ing.id)}
                  disabled={amt >= 10 || disabled}
                  aria-label={`Increase ${ing.name}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="color-mixer__actions">
        <Button
          id="mixer-reset-btn"
          variant="secondary"
          size="md"
          onClick={resetAll}
          disabled={totalAmount === 0 || disabled}
          icon={<span>↺</span>}
        >
          Reset
        </Button>
        <Button
          id="mixer-submit-btn"
          variant="primary"
          size="lg"
          onClick={onSubmit}
          disabled={totalAmount === 0 || disabled}
          icon={<span>⚗️</span>}
        >
          Submit Potion
        </Button>
      </div>
    </section>
  );
};

export default ColorMixer;
