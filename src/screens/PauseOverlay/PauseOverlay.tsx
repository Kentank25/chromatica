import React from 'react';
import Button from '../../components/common/Button';
import { useSettingsStore } from '../../store/settingsStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './PauseOverlay.css';

import {
  MusicIcon,
  VolumeIcon,
  MutedIcon,
  PlayIcon,
  RestartIcon,
  QuitIcon,
  HelpIcon
} from '../../utils/icons';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onTriggerTutorial?: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume, onRestart, onQuit, onTriggerTutorial }) => {
  const { bgmVolume, sfxVolume, setVolume, muted, toggleMute } = useSettingsStore();
  const { containerRef, handleKeyDown } = useFocusTrap<HTMLDivElement>(true);

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      className="pause-overlay"
      id="pause-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Pause Menu"
    >
      <div className="pause-overlay__card">
        <h2 className="pause-overlay__title">PAUSED</h2>

        <div className="pause-overlay__settings">
          <label className="pause-overlay__slider">
            <span className="pause-overlay__slider-label-text">
              <MusicIcon className="icon--sm" style={{ marginRight: '6px' }} /> Music
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgmVolume}
              onChange={(e) => setVolume('bgm', parseFloat(e.target.value))}
              aria-label="Music Volume"
            />
            <span className="pause-overlay__slider-val">{Math.round(bgmVolume * 100)}%</span>
          </label>
          <label className="pause-overlay__slider">
            <span className="pause-overlay__slider-label-text">
              <VolumeIcon className="icon--sm" style={{ marginRight: '6px' }} /> Effects
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => setVolume('sfx', parseFloat(e.target.value))}
              aria-label="Effects Volume"
            />
            <span className="pause-overlay__slider-val">{Math.round(sfxVolume * 100)}%</span>
          </label>
          <Button
            variant={muted ? 'danger' : 'secondary'}
            size="sm"
            onClick={toggleMute}
            id="btn-mute"
            className="pause-overlay__mute-btn"
            icon={muted ? <MutedIcon className="icon--sm" /> : <VolumeIcon className="icon--sm" />}
          >
            {muted ? 'Unmute All' : 'Mute All'}
          </Button>
        </div>

        <div className="pause-overlay__actions">
          <Button
            variant="primary"
            size="lg"
            onClick={onResume}
            id="btn-resume"
            icon={<PlayIcon className="icon--sm" />}
          >
            Resume
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onTriggerTutorial}
            id="btn-how-to-play"
            icon={<HelpIcon className="icon--sm" />}
          >
            How to Play
          </Button>
          <div className="pause-overlay__secondary-actions">
            <Button
              variant="secondary"
              size="md"
              onClick={onRestart}
              id="btn-restart"
              icon={<RestartIcon className="icon--sm" />}
            >
              Restart
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={onQuit}
              id="btn-quit"
              icon={<QuitIcon className="icon--sm" />}
            >
              Quit to Menu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
