import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useSettingsStore } from '../../store/settingsStore';
import { useGameStore } from '../../store/gameStore';
import { audioManager } from '../../audio/AudioManager';
import { musicManager } from '../../audio/MusicManager';
import {
  ApprenticeIcon,
  SubmitPotionIcon,
  WizardIcon,
  TrophyIcon,
  SettingsIcon,
  MusicIcon,
  VolumeIcon,
  MutedIcon,
  MedalIcon,
  LockIcon,
  BookIcon,
} from '../../utils/icons';
import { useAchievementStore } from '../../store/achievementStore';
import './MainMenu.css';

export const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const { bgmVolume, sfxVolume, setVolume, muted, toggleMute } = useSettingsStore();
  const { difficulty, setDifficulty } = useGameStore();
  const achievements = useAchievementStore((s) => s.achievements);

  const stats = React.useMemo(() => {
    const total = Object.keys(achievements).length;
    const unlocked = Object.values(achievements).filter((a) => a.unlockedAt !== null).length;
    return { total, unlocked };
  }, [achievements]);

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

        <div className="main-menu__actions">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              audioManager.playSFX('uiClick');
              setShowDifficultyModal(true);
            }}
            id="btn-play"
            icon={<SubmitPotionIcon className="icon--sm" />}
          >
            Endless Mode
          </Button>
          <Button
            variant="secondary"
            size="lg"
            disabled={true}
            id="btn-story"
            icon={<BookIcon className="icon--sm" />}
            className="main-menu__story-btn"
          >
            <span>Story Mode</span>
            <span className="main-menu__coming-soon-badge">
              <LockIcon className="icon--xs" /> Coming Soon
            </span>
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/leaderboard')}
            id="btn-leaderboard"
            icon={<TrophyIcon className="icon--sm" />}
          >
            Leaderboard
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              audioManager.playSFX('uiClick');
              navigate('/achievements');
            }}
            id="btn-achievements"
            icon={<MedalIcon className="icon--sm" />}
          >
            Achievements {stats.total > 0 && `(${stats.unlocked}/${stats.total})`}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowSettings(true)}
            id="btn-settings"
            icon={<SettingsIcon className="icon--sm" />}
          >
            Settings
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

      {/* Difficulty Selection Modal */}
      <Modal
        isOpen={showDifficultyModal}
        onClose={() => setShowDifficultyModal(false)}
        title="Select Endless Difficulty"
        closable
        className="modal-content--difficulty"
      >
        <div className="main-menu__difficulty-modal">
          <p className="main-menu__difficulty-modal-subtitle">
            Configure your alchemy lab parameters. Apprentice offers a relaxed study environment, while Master demands rapid execution under strict accuracy requirements.
          </p>

          <div className="main-menu__difficulty-cards" role="radiogroup" aria-label="Game difficulty">
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
                role="radio"
                aria-checked={difficulty === mode}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    audioManager.playSFX('uiClick');
                    setDifficulty(mode);
                  }
                }}
              >
                <div className="main-menu__difficulty-icon">
                  {mode === 'apprentice' && <ApprenticeIcon className="icon--md" />}
                  {mode === 'journeyman' && <SubmitPotionIcon className="icon--md" />}
                  {mode === 'master' && <WizardIcon className="icon--md" />}
                </div>
                <div className="main-menu__difficulty-name">{mode}</div>
              </div>
            ))}
          </div>

          <div className={`main-menu__difficulty-details main-menu__difficulty-details--${difficulty}`}>
            <h4 className="main-menu__difficulty-details-title">
              {difficulty === 'apprentice' && 'Apprentice (Relaxed Mode)'}
              {difficulty === 'journeyman' && 'Journeyman (Standard Mode)'}
              {difficulty === 'master' && 'Master Alchemist (Expert Mode)'}
            </h4>
            <p className="main-menu__difficulty-details-highlight">
              {difficulty === 'apprentice' && 'Relaxed pacing & low requirements. Perfect for casual play.'}
              {difficulty === 'journeyman' && 'Standard recipe matching. The intended Chromatica experience.'}
              {difficulty === 'master' && 'Extreme urgency and unforgiving standards. Ultimate test of speed & skill.'}
            </p>
            <table className="main-menu__difficulty-details-table">
              <tbody>
                {difficulty === 'apprentice' && (
                  <>
                    <tr>
                      <td><strong>Client Patience:</strong></td>
                      <td>+15s additional prep time for all clients</td>
                    </tr>
                    <tr>
                      <td><strong>Accuracy Threshold:</strong></td>
                      <td>Standard matches require only 60% accuracy</td>
                    </tr>
                    <tr>
                      <td><strong>Wave Clears:</strong></td>
                      <td>Wave target scores are cut in half (50% easier)</td>
                    </tr>
                    <tr>
                      <td><strong>Lab Standard:</strong></td>
                      <td>Less stress, perfect for practicing subtractive color mixing</td>
                    </tr>
                  </>
                )}
                {difficulty === 'journeyman' && (
                  <>
                    <tr>
                      <td><strong>Client Patience:</strong></td>
                      <td>Dynamic patience limits per client type (20s to 45s)</td>
                    </tr>
                    <tr>
                      <td><strong>Accuracy Threshold:</strong></td>
                      <td>Standard requirements (70% standard, 80% for Picky Nobles)</td>
                    </tr>
                    <tr>
                      <td><strong>Wave Clears:</strong></td>
                      <td>Standard wave targets and progression scaling</td>
                    </tr>
                    <tr>
                      <td><strong>Tip Rewards:</strong></td>
                      <td>Standard token rewards and combo bonuses on clean matches</td>
                    </tr>
                  </>
                )}
                {difficulty === 'master' && (
                  <>
                    <tr>
                      <td><strong>Client Patience:</strong></td>
                      <td>-5s off all client timers (Wizards demand in 15s!)</td>
                    </tr>
                    <tr>
                      <td><strong>Accuracy Threshold:</strong></td>
                      <td>Cruel 80% minimum accuracy required for all clients</td>
                    </tr>
                    <tr>
                      <td><strong>Failure Penalty:</strong></td>
                      <td>1.5× higher satisfaction penalty on wrong mixtures</td>
                    </tr>
                    <tr>
                      <td><strong>Noble Demands:</strong></td>
                      <td>Highly punishing environment. Only for master mixers</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="main-menu__difficulty-modal-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setShowDifficultyModal(false);
                navigate('/game');
              }}
              icon={<SubmitPotionIcon className="icon--sm" />}
            >
              Begin Journey
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings" closable>
        <div className="main-menu__settings">
          <label className="main-menu__slider-label">
            <span>
              <MusicIcon className="icon--sm" style={{ marginRight: '6px' }} /> Music
            </span>
            <input type="range" min="0" max="1" step="0.05" value={bgmVolume}
              onChange={(e) => setVolume('bgm', parseFloat(e.target.value))} />
            <span className="main-menu__slider-val">{Math.round(bgmVolume * 100)}%</span>
          </label>
          <label className="main-menu__slider-label">
            <span>
              <VolumeIcon className="icon--sm" style={{ marginRight: '6px' }} /> Effects
            </span>
            <input type="range" min="0" max="1" step="0.05" value={sfxVolume}
              onChange={(e) => setVolume('sfx', parseFloat(e.target.value))} />
            <span className="main-menu__slider-val">{Math.round(sfxVolume * 100)}%</span>
          </label>
          <Button
            variant={muted ? 'danger' : 'secondary'}
            size="sm"
            onClick={toggleMute}
            id="btn-mute"
            icon={muted ? <MutedIcon className="icon--sm" /> : <VolumeIcon className="icon--sm" />}
          >
            {muted ? 'Unmute All' : 'Mute All'}
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
