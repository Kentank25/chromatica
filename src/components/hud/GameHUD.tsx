import React from 'react';
import { ScoreDisplay } from './ScoreDisplay';
import { SatisfactionBar } from './SatisfactionBar';
import { WaveIndicator } from './WaveIndicator';
import { TokenDisplay } from './TokenDisplay';
import ComboCounter from '../game/ComboCounter';
import { PauseIcon } from '../../utils/icons';
import './GameHUD.css';

interface GameHUDProps {
  onUseToken?: (type: 'skip' | 'hint' | 'autoCorrect') => void;
  onPause?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ onUseToken, onPause }) => {
  return (
    <div className="game-hud" id="game-hud">
      <div className="game-hud__top">
        <div className="game-hud__left">
          <WaveIndicator />
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
