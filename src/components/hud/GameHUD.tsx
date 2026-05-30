import React from 'react';
import { ScoreDisplay } from './ScoreDisplay';
import { SatisfactionBar } from './SatisfactionBar';
import { WaveIndicator } from './WaveIndicator';
import { TokenDisplay } from './TokenDisplay';
import ComboCounter from '../game/ComboCounter';
import { PauseIcon } from '../../utils/icons';
import { useGameStore } from '../../store/gameStore';
import './GameHUD.css';

interface GameHUDProps {
  onUseToken?: (type: 'skip' | 'hint' | 'autoCorrect') => void;
  onPause?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ onUseToken, onPause }) => {
  const difficulty = useGameStore((s) => s.difficulty);

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
