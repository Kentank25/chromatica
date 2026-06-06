import React from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useGameStore } from '../../store/gameStore';
import type { PerkDefinition } from '../../engine/perksManager';
import './WaveTransition.css';

interface WaveTransitionProps {
  waveNumber: number;
  clientsServed: number;
  accuracy: number;
  pointsEarned: number;
  perks: PerkDefinition[];
  onClose: () => void;
}

export const WaveTransition: React.FC<WaveTransitionProps> = ({
  waveNumber,
  clientsServed,
  accuracy,
  pointsEarned,
  perks,
  onClose,
}) => {
  const { containerRef, handleKeyDown } = useFocusTrap<HTMLDivElement>(true);
  const acquirePerk = useGameStore((s) => s.acquirePerk);

  const handleSelectPerk = (perkId: string) => {
    acquirePerk(perkId);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      className="wave-transition"
      role="dialog"
      aria-modal="true"
      aria-label="Wave Clear Celebration and Perk Selection"
    >
      <div className="wave-transition__content">
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

        <div className="wave-transition__perks-section">
          <h2 className="wave-transition__perks-title">Choose a Perk for the next wave</h2>
          <div className="wave-transition__perks-list">
            {perks.map((perk) => (
              <div
                key={perk.id}
                className={`wave-transition__perk-card wave-transition__perk-card--${perk.rarity}`}
                onClick={() => handleSelectPerk(perk.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectPerk(perk.id);
                  }
                }}
              >
                <div className="wave-transition__perk-rarity">{perk.rarity}</div>
                <div className="wave-transition__perk-name">{perk.name}</div>
                <div className="wave-transition__perk-desc">{perk.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
