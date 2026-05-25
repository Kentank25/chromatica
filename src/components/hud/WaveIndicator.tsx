import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './WaveIndicator.css';

export const WaveIndicator: React.FC = () => {
  const wave = useGameStore((s) => s.currentWave);
  return (
    <div className="wave-indicator" id="wave-indicator">
      <span className="wave-indicator__label">Wave</span>
      <span className="wave-indicator__number">{wave}</span>
    </div>
  );
};
