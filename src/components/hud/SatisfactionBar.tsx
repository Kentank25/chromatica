import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './SatisfactionBar.css';

export const SatisfactionBar: React.FC = () => {
  const satisfaction = useGameStore((s) => s.satisfaction);
  const color = satisfaction > 60 ? '#4ade80' : satisfaction > 30 ? '#FFA726' : '#FF4A4A';
  const critical = satisfaction < 20;

  return (
    <div
      className={`satisfaction-bar ${critical ? 'satisfaction-bar--critical' : ''}`}
      id="satisfaction-bar"
      role="progressbar"
      aria-valuenow={Math.round(satisfaction)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Client Satisfaction"
    >
      <div className="satisfaction-bar__header">
        <span className="satisfaction-bar__icon">🧪</span>
        <span className="satisfaction-bar__label">Client Satisfaction</span>
        <span className="satisfaction-bar__value" style={{ color }}>{Math.round(satisfaction)}%</span>
      </div>
      <div className="satisfaction-bar__track">
        <div
          className="satisfaction-bar__fill"
          style={{ width: `${satisfaction}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
        />
      </div>
    </div>
  );
};
