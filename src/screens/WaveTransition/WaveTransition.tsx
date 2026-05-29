import React, { useEffect } from 'react';
import './WaveTransition.css';

interface WaveTransitionProps {
  waveNumber: number;
  clientsServed: number;
  accuracy: number;
  pointsEarned: number;
  onClose: () => void;
}

export const WaveTransition: React.FC<WaveTransitionProps> = ({
  waveNumber,
  clientsServed,
  accuracy,
  pointsEarned,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="wave-transition" onClick={onClose}>
      <div className="wave-transition__content" onClick={(e) => e.stopPropagation()}>
        <div className="wave-transition__sparkles">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`wave-transition__sparkle wave-transition__sparkle--${i + 1}`} />
          ))}
        </div>

        <h1 className="wave-transition__title">Wave {waveNumber} Complete!</h1>
        
        <div className="wave-transition__stats">
          <div className="wave-transition__stat">
            <span className="wave-transition__stat-label">Clients Served</span>
            <span className="wave-transition__stat-value">{clientsServed}</span>
          </div>
          <div className="wave-transition__stat">
            <span className="wave-transition__stat-label">Average Accuracy</span>
            <span className="wave-transition__stat-value">{accuracy.toFixed(1)}%</span>
          </div>
          <div className="wave-transition__stat">
            <span className="wave-transition__stat-label">Score Earned</span>
            <span className="wave-transition__stat-value">+{pointsEarned}</span>
          </div>
        </div>

        <button className="wave-transition__btn" onClick={onClose}>
          Tap to Skip
        </button>
      </div>
    </div>
  );
};
