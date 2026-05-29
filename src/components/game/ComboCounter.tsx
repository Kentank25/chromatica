import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import './ComboCounter.css';

const COMBO_TOKEN_THRESHOLDS = [3, 5, 7];

const ComboCounter: React.FC = () => {
  const comboStreak = useGameStore((s) => s.comboStreak);
  const [popping, setPopping] = useState(false);
  const prevCombo = useRef(comboStreak);

  useEffect(() => {
    if (comboStreak > prevCombo.current && comboStreak > 0) {
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 350);
      prevCombo.current = comboStreak;
      return () => clearTimeout(t);
    }
    prevCombo.current = comboStreak;
  }, [comboStreak]);

  if (comboStreak <= 0) {
    return <div className="combo-counter combo-counter--hidden" aria-hidden="true" />;
  }

  // Determine tier
  const tier = comboStreak >= 7 ? 'tier3' : comboStreak >= 4 ? 'tier2' : 'tier1';
  const icon = comboStreak >= 7 ? '⚡' : comboStreak >= 4 ? '🔥' : '✨';

  // Next token threshold
  const nextThreshold = COMBO_TOKEN_THRESHOLDS.find((t) => t > comboStreak);
  const hint = nextThreshold
    ? `${nextThreshold - comboStreak} more for token!`
    : 'Max streak!';

  return (
    <div className={`combo-counter combo-counter--${tier}`} aria-label={`Combo streak: ${comboStreak}`}>
      <span className="combo-counter__icon">{icon}</span>
      <span
        className={`combo-counter__number ${popping ? 'combo-counter__number--pop' : ''}`}
      >
        {comboStreak}
      </span>
      <span className="combo-counter__label">combo</span>
      <span className="combo-counter__hint">{hint}</span>
    </div>
  );
};

export default React.memo(ComboCounter);
