import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useSettingsStore } from '../../store/settingsStore';
import { useGameStore } from '../../store/gameStore';
import { audioManager } from '../../audio/AudioManager';
import { musicManager } from '../../audio/MusicManager';
import './MainMenu.css';

export const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const { bgmVolume, sfxVolume, setVolume, muted, toggleMute } = useSettingsStore();
  const { difficulty, setDifficulty } = useGameStore();

  useEffect(() => {
    // Initialize audio system and start menu music
    audioManager.init();
    const ctx = audioManager.getContext();
    if (ctx) {
      musicManager.connectContext(ctx);
    }
    musicManager.play('menu');
  }, []);

  return (
    <div className="main-menu" id="main-menu">
      <div className="main-menu__orb main-menu__orb--1" />
      <div className="main-menu__orb main-menu__orb--2" />

      <div className="main-menu__content">
        <div className="main-menu__header">
          <h1 className="main-menu__title">CHROMATICA</h1>
          <p className="main-menu__tagline">Master the art of color alchemy</p>
        </div>

        {/* Difficulty Selection */}
        <div className="main-menu__difficulty">
          <h3 className="main-menu__difficulty-title">Select Difficulty</h3>
          <div className="main-menu__difficulty-cards">
            {(['apprentice', 'journeyman', 'master'] as const).map((mode) => (
              <div
                key={mode}
                className={`main-menu__difficulty-card main-menu__difficulty-card--${mode} ${
                  difficulty === mode ? 'main-menu__difficulty-card--selected' : ''
                }`}
                onClick={() => {
                  audioManager.playSFX('uiClick');
                  setDifficulty(mode);
                }}
              >
                <div className="main-menu__difficulty-icon">
                  {mode === 'apprentice' ? '🌱' : mode === 'journeyman' ? '⚗️' : '🧙'}
                </div>
                <div className="main-menu__difficulty-name">{mode}</div>
                <div className="main-menu__difficulty-desc">
                  {mode === 'apprentice' && 'Relaxed pacing & low requirements.'}
                  {mode === 'journeyman' && 'Standard color recipe testing.'}
                  {mode === 'master' && 'Severe time pressure & strict demands.'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="main-menu__actions">
          <Button variant="primary" size="lg" onClick={() => navigate('/game')} id="btn-play">
            ⚗️ Begin Brewing
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate('/leaderboard')} id="btn-leaderboard">
            🏆 Leaderboard
          </Button>
          <Button variant="secondary" size="md" onClick={() => setShowSettings(true)} id="btn-settings">
            ⚙️ Settings
          </Button>
          <Button variant="ghost" size="md" onClick={() => setShowCredits(true)} id="btn-credits">
            Credits
          </Button>
        </div>

        {/* Decorative vials */}
        <div className="main-menu__deco">
          <div className="main-menu__vial main-menu__vial--1" />
          <div className="main-menu__vial main-menu__vial--2" />
          <div className="main-menu__vial main-menu__vial--3" />
        </div>
      </div>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings" closable>
        <div className="main-menu__settings">
          <label className="main-menu__slider-label">
            <span>🎵 Music</span>
            <input type="range" min="0" max="1" step="0.05" value={bgmVolume}
              onChange={(e) => setVolume('bgm', parseFloat(e.target.value))} />
            <span className="main-menu__slider-val">{Math.round(bgmVolume * 100)}%</span>
          </label>
          <label className="main-menu__slider-label">
            <span>🔊 Effects</span>
            <input type="range" min="0" max="1" step="0.05" value={sfxVolume}
              onChange={(e) => setVolume('sfx', parseFloat(e.target.value))} />
            <span className="main-menu__slider-val">{Math.round(sfxVolume * 100)}%</span>
          </label>
          <Button variant={muted ? 'danger' : 'secondary'} size="sm" onClick={toggleMute} id="btn-mute">
            {muted ? '🔇 Unmute' : '🔊 Mute All'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showCredits} onClose={() => setShowCredits(false)} title="Credits" closable>
        <div className="main-menu__credits">
          <p><strong>Chromatica v2</strong></p>
          <p>A color-mixing potion game</p>
          <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Built with React • TypeScript • Zustand<br />
            Color science: Kubelka-Munk / CIE Delta E<br />
            Inspired by TryColors.com
          </p>
        </div>
      </Modal>
    </div>
  );
};
