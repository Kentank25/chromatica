import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { BASE_INGREDIENTS, mixColorsKM } from '../../engine/colorScience';
import { detectEffect } from '../../engine/potionEffects';
import { rgbToHex } from '../../utils/colorUtils';
import type { RGB, Ingredient } from '../../types/color.types';
import Button from '../common/Button';
import { audioManager } from '../../audio/AudioManager';
import { ResetIcon, SubmitPotionIcon } from '../../utils/icons';
import './ColorMixer.css';

interface ColorMixerProps {
  onSubmit: () => void;
  disabled?: boolean;
  resetKey?: string;
}

const ColorMixerComponent: React.FC<ColorMixerProps> = ({
  onSubmit,
  disabled = false,
  resetKey,
}) => {
  const setPlayerMix = useGameStore((s) => s.setPlayerMix);
  const setActiveEffect = useGameStore((s) => s.setActiveEffect);
  const currentWave = useGameStore((s) => s.currentWave);
  const mixerAmounts = useGameStore((s) => s.mixerAmounts);
  const setMixerAmount = useGameStore((s) => s.setMixerAmount);
  const resetMixerAmounts = useGameStore((s) => s.resetMixerAmounts);

  // Toast notifications for newly unlocked ingredients
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const prevWaveRef = useRef<number | null>(null);

  const lastAnnouncedColorRef = useRef<RGB>({ r: 40, g: 40, b: 50 });
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');

  useEffect(() => {
    if (prevWaveRef.current === null) {
      prevWaveRef.current = currentWave;
      return; // skip on initial mount
    }
    const newlyUnlocked = BASE_INGREDIENTS.filter(
      (ing) =>
        ing.unlockWave !== undefined &&
        ing.unlockWave > prevWaveRef.current! &&
        ing.unlockWave <= currentWave
    );
    if (newlyUnlocked.length > 0) {
      setToastMessage(`New ingredient unlocked: ${newlyUnlocked[0].name}!`);
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
    prevWaveRef.current = currentWave;
  }, [currentWave]);

  // Filter ingredients visible in the current wave
  const visibleIngredients = useMemo(() => {
    return BASE_INGREDIENTS.filter((ing) => (ing.unlockWave ?? 1) <= currentWave);
  }, [currentWave]);

  // Compute the mixed color from current amounts of unlocked ingredients only
  const mixedColor: RGB = useMemo(() => {
    const entries: Array<{ ingredient: Ingredient; amount: number }> = [];
    visibleIngredients.forEach((ing: Ingredient) => {
      const amt = mixerAmounts[ing.id] || 0;
      if (amt > 0) {
        entries.push({ ingredient: ing, amount: amt });
      }
    });
    if (entries.length === 0) {
      return { r: 40, g: 40, b: 50 }; // empty dark
    }
    return mixColorsKM(entries);
  }, [mixerAmounts, visibleIngredients]);

  // Live potion effect detection based on mixedColor
  const currentEffect = useMemo(() => detectEffect(mixedColor), [mixedColor]);

  // Sync to store
  useEffect(() => {
    setPlayerMix(mixedColor);
    setActiveEffect(currentEffect);
  }, [mixedColor, currentEffect, setPlayerMix, setActiveEffect]);

  const totalAmount = useMemo(
    () => Object.values(mixerAmounts).reduce((s, v) => s + v, 0),
    [mixerAmounts],
  );

  const increment = useCallback((id: string) => {
    audioManager.playSFX('pour');
    const current = mixerAmounts[id] || 0;
    setMixerAmount(id, Math.min(10, current + 1));
  }, [mixerAmounts, setMixerAmount]);

  const decrement = useCallback((id: string) => {
    audioManager.playSFX('pour');
    const current = mixerAmounts[id] || 0;
    setMixerAmount(id, Math.max(0, current - 1));
  }, [mixerAmounts, setMixerAmount]);

  const resetAll = useCallback(() => {
    resetMixerAmounts();
  }, [resetMixerAmounts]);

  // Reset mixer when resetKey changes (e.g. client changes)
  useEffect(() => {
    resetAll();
    lastAnnouncedColorRef.current = { r: 40, g: 40, b: 50 };
  }, [resetKey, resetAll]);

  const hex = rgbToHex(mixedColor);

  // Announce mix color change via aria-live when RGB delta > 20
  useEffect(() => {
    const last = lastAnnouncedColorRef.current;
    const distance = Math.sqrt(
      Math.pow(mixedColor.r - last.r, 2) +
      Math.pow(mixedColor.g - last.g, 2) +
      Math.pow(mixedColor.b - last.b, 2)
    );
    if (distance > 20) {
      setAriaAnnouncement(`Potion color updated to ${hex}`);
      lastAnnouncedColorRef.current = mixedColor;
    }
  }, [mixedColor, hex]);

  return (
    <section className="color-mixer" aria-label="Color Mixer">
      <div className="sr-only" aria-live="polite">{ariaAnnouncement}</div>
      {/* Toast Alert */}
      {showToast && (
        <div className="color-mixer__toast" role="alert">
          {toastMessage}
        </div>
      )}

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
        {visibleIngredients.map((ing: Ingredient) => {
          const amt = mixerAmounts[ing.id] || 0;
          return (
            <div
              key={ing.id}
              className={`color-mixer__ingredient ${amt > 0 ? 'color-mixer__ingredient--active' : ''}`}
              role="slider"
              aria-valuenow={amt}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-label={ing.name}
              tabIndex={0}
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
          icon={<ResetIcon className="icon--sm" />}
        >
          Reset
        </Button>
        <Button
          id="mixer-submit-btn"
          variant="primary"
          size="lg"
          onClick={onSubmit}
          disabled={totalAmount === 0 || disabled}
          icon={<SubmitPotionIcon className="icon--sm" />}
        >
          Submit Potion
        </Button>
      </div>
    </section>
  );
};

export default React.memo(ColorMixerComponent);
