import React, { useMemo, useState } from 'react';
import Button from '../../components/common/Button';
import { useSettingsStore } from '../../store/settingsStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useGameStore } from '../../store/gameStore';
import { PERK_POOL } from '../../engine/perksManager';
import { groupActivePerks } from '../../utils/perkUtils';
import './PauseOverlay.css';

import {
  MusicIcon,
  VolumeIcon,
  MutedIcon,
  PlayIcon,
  RestartIcon,
  QuitIcon,
  HelpIcon,
  KeyboardIcon,
  ShieldIcon
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
  const activePerks = useGameStore((s) => s.activePerks);
  const [activeTab, setActiveTab] = useState<'volume' | 'perks' | 'keyboard'>('volume');

  const groupedPerks = useMemo(() => {
    return groupActivePerks(activePerks, PERK_POOL);
  }, [activePerks]);

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

        <div className="pause-overlay__layout">
          {/* Left Column: Sidebar Navigation */}
          <div className="pause-overlay__sidebar">
            <div className="pause-overlay__tabs" role="tablist" aria-label="Pause settings categories">
              <button
                className={`pause-overlay__tab-btn ${activeTab === 'volume' ? 'pause-overlay__tab-btn--active' : ''}`}
                onClick={() => setActiveTab('volume')}
                role="tab"
                aria-selected={activeTab === 'volume'}
                tabIndex={0}
              >
                <VolumeIcon className="icon--sm" />
                <span>Volume</span>
              </button>
              <button
                className={`pause-overlay__tab-btn ${activeTab === 'perks' ? 'pause-overlay__tab-btn--active' : ''}`}
                onClick={() => setActiveTab('perks')}
                role="tab"
                aria-selected={activeTab === 'perks'}
                tabIndex={0}
              >
                <ShieldIcon className="icon--sm" />
                <span>Active Perks</span>
              </button>
              <button
                className={`pause-overlay__tab-btn ${activeTab === 'keyboard' ? 'pause-overlay__tab-btn--active' : ''}`}
                onClick={() => setActiveTab('keyboard')}
                role="tab"
                aria-selected={activeTab === 'keyboard'}
                tabIndex={0}
              >
                <KeyboardIcon className="icon--sm" />
                <span>Keys Guide</span>
              </button>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={onTriggerTutorial}
              id="btn-how-to-play"
              className="pause-overlay__tutorial-btn"
              icon={<HelpIcon className="icon--sm" />}
            >
              How to Play
            </Button>
          </div>

          {/* Right Column: Panel Content */}
          <div className="pause-overlay__panel-container">
            {activeTab === 'volume' && (
              <div className="pause-overlay__tab-panel">
                <h3 className="pause-overlay__panel-title">Volume Settings</h3>
                <div className="pause-overlay__settings-group">
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
              </div>
            )}

            {activeTab === 'perks' && (
              <div className="pause-overlay__tab-panel">
                <h3 className="pause-overlay__panel-title">Active Perks</h3>
                {groupedPerks.length === 0 ? (
                  <p className="pause-overlay__no-perks">No active perks yet. Clear waves to choose upgrades!</p>
                ) : (
                  <div className="pause-overlay__perks-list">
                    {groupedPerks.map(({ perk, count }) => (
                      <div key={perk.id} className={`pause-overlay__perk-item pause-overlay__perk-item--${perk.rarity}`}>
                        <div className="pause-overlay__perk-header">
                          <span className="pause-overlay__perk-name">{perk.name}</span>
                          <span className="pause-overlay__perk-rarity">{perk.rarity}</span>
                        </div>
                        <div className="pause-overlay__perk-body">
                          <span className="pause-overlay__perk-desc">{perk.description}</span>
                          {count > 1 && <span className="pause-overlay__perk-count">×{count}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'keyboard' && (
              <div className="pause-overlay__tab-panel">
                <h3 className="pause-overlay__panel-title">Accessibility Keys</h3>
                <div className="pause-overlay__keyboard-list">
                  <div className="pause-overlay__keyboard-item">
                    <div className="pause-overlay__keyboard-keys">
                      <kbd className="pause-overlay__kbd">1</kbd> - <kbd className="pause-overlay__kbd">8</kbd>
                    </div>
                    <span className="pause-overlay__kbd-desc">Select & focus ingredient slider</span>
                  </div>
                  <div className="pause-overlay__keyboard-item">
                    <div className="pause-overlay__keyboard-keys">
                      <kbd className="pause-overlay__kbd">↑</kbd> <kbd className="pause-overlay__kbd">→</kbd>
                    </div>
                    <span className="pause-overlay__kbd-desc">Increase focused ingredient amount</span>
                  </div>
                  <div className="pause-overlay__keyboard-item">
                    <div className="pause-overlay__keyboard-keys">
                      <kbd className="pause-overlay__kbd">↓</kbd> <kbd className="pause-overlay__kbd">←</kbd>
                    </div>
                    <span className="pause-overlay__kbd-desc">Decrease focused ingredient amount</span>
                  </div>
                  <div className="pause-overlay__keyboard-item">
                    <div className="pause-overlay__keyboard-keys">
                      <kbd className="pause-overlay__kbd">Enter</kbd>
                    </div>
                    <span className="pause-overlay__kbd-desc">Submit mix to client</span>
                  </div>
                  <div className="pause-overlay__keyboard-item">
                    <div className="pause-overlay__keyboard-keys">
                      <kbd className="pause-overlay__kbd">R</kbd>
                    </div>
                    <span className="pause-overlay__kbd-desc">Reset all mixer amounts to zero</span>
                  </div>
                  <div className="pause-overlay__keyboard-item">
                    <div className="pause-overlay__keyboard-keys">
                      <kbd className="pause-overlay__kbd">Space</kbd>
                    </div>
                    <span className="pause-overlay__kbd-desc">Skip client evaluation feedback</span>
                  </div>
                  <div className="pause-overlay__keyboard-item">
                    <div className="pause-overlay__keyboard-keys">
                      <kbd className="pause-overlay__kbd">Esc</kbd>
                    </div>
                    <span className="pause-overlay__kbd-desc">Pause / resume gameplay</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global actions at bottom */}
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
