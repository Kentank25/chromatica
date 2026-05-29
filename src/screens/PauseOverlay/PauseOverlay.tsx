import React from 'react';
import Button from '../../components/common/Button';
import { useSettingsStore } from '../../store/settingsStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './PauseOverlay.css';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume, onRestart, onQuit }) => {
  const { bgmVolume, sfxVolume, setVolume } = useSettingsStore();
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

        <div className="pause-overlay__volume">
          <label className="pause-overlay__slider">
            <span>🎵 Music</span>
            <input type="range" min="0" max="1" step="0.05" value={bgmVolume}
              onChange={(e) => setVolume('bgm', parseFloat(e.target.value))} />
          </label>
          <label className="pause-overlay__slider">
            <span>🔊 Effects</span>
            <input type="range" min="0" max="1" step="0.05" value={sfxVolume}
              onChange={(e) => setVolume('sfx', parseFloat(e.target.value))} />
          </label>
        </div>

        <div className="pause-overlay__actions">
          <Button variant="primary" size="lg" onClick={onResume} id="btn-resume">▶ Resume</Button>
          <Button variant="secondary" size="md" onClick={onRestart} id="btn-restart">🔄 Restart</Button>
          <Button variant="danger" size="md" onClick={onQuit} id="btn-quit">🚪 Quit to Menu</Button>
        </div>
      </div>
    </div>
  );
};
