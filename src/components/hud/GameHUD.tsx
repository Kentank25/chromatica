import React, { useMemo } from 'react';
import { ScoreDisplay } from './ScoreDisplay';
import { SatisfactionBar } from './SatisfactionBar';
import { WaveIndicator } from './WaveIndicator';
import { TokenDisplay } from './TokenDisplay';
import ComboCounter from '../game/ComboCounter';
import { PauseIcon } from '../../utils/icons';
import { useGameStore } from '../../store/gameStore';
import { PERK_POOL } from '../../engine/perksManager';
import { groupActivePerks } from '../../utils/perkUtils';
import './GameHUD.css';

interface GameHUDProps {
  onUseToken?: (type: 'skip' | 'hint' | 'autoCorrect') => void;
  onPause?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ onUseToken, onPause }) => {
  const difficulty = useGameStore((s) => s.difficulty);
  const activePerks = useGameStore((s) => s.activePerks);

  const groupedPerks = useMemo(() => {
    return groupActivePerks(activePerks, PERK_POOL);
  }, [activePerks]);

  return (
    <div className="game-hud" id="game-hud">
      <div className="game-hud__top">
        <div className="game-hud__left">
          <WaveIndicator />
          <div className="game-hud__mode-badge">
            <span className="game-hud__mode-label">Endless Mode</span>
            <span className={`game-hud__difficulty-badge game-hud__difficulty-badge--${difficulty}`}>
              {difficulty}
            </span>
          </div>
          {groupedPerks.length > 0 && (
            <div className="game-hud__perks-tray" role="list" aria-label="Active Perks">
              {groupedPerks.map(({ perk, count, initials }) => (
                <div
                  key={perk.id}
                  className={`game-hud__perk-badge game-hud__perk-badge--${perk.rarity}`}
                  data-tooltip={`${perk.name}: ${perk.description}`}
                  role="listitem"
                  tabIndex={0}
                >
                  <span className="game-hud__perk-initials">{initials}</span>
                  {count > 1 && <span className="game-hud__perk-multiplier">×{count}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="game-hud__center">
          <ScoreDisplay />
          <ComboCounter />
        </div>
        <div className="game-hud__right">
          <TokenDisplay onUseToken={onUseToken} />
          <button className="game-hud__pause-btn" onClick={onPause} id="pause-button" title="Pause (Esc)">
            <PauseIcon className="icon--sm" />
          </button>
        </div>
      </div>
      <div className="game-hud__bottom">
        <SatisfactionBar />
      </div>
    </div>
  );
};
