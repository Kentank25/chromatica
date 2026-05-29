import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAchievementStore } from '../../store/achievementStore';
import { ACHIEVEMENT_DEFINITIONS } from '../../engine/achievementDefinitions';
import AchievementCard from '../../components/game/AchievementCard';
import Button from '../../components/common/Button';
import GlassCard from '../../components/common/GlassCard';
import ProgressBar from '../../components/common/ProgressBar';
import { BackIcon, TrophyIcon, ResetIcon } from '../../utils/icons';
import type { AchievementCategory } from '../../types/achievement.types';
import './AchievementsScreen.css';
import { audioManager } from '../../audio/AudioManager';

export const AchievementsScreen: React.FC = () => {
  const navigate = useNavigate();
  const achievementsState = useAchievementStore((s) => s.achievements);
  const resetAllAchievements = useAchievementStore((s) => s.resetAll);

  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  const categories: Array<{ id: AchievementCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'brewing', label: 'Brewing' },
    { id: 'combo', label: 'Combos' },
    { id: 'clients', label: 'Clients' },
    { id: 'waves', label: 'Waves' },
    { id: 'color_science', label: 'Color Science' },
  ];

  // Calculate completion statistics
  const stats = useMemo(() => {
    const total = ACHIEVEMENT_DEFINITIONS.length;
    let unlocked = 0;
    
    ACHIEVEMENT_DEFINITIONS.forEach((def) => {
      if (achievementsState[def.id]?.unlockedAt !== null) {
        unlocked += 1;
      }
    });

    const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { total, unlocked, percent };
  }, [achievementsState]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    if (activeCategory === 'all') return ACHIEVEMENT_DEFINITIONS;
    return ACHIEVEMENT_DEFINITIONS.filter((def) => def.category === activeCategory);
  }, [activeCategory]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to lock all achievements and reset all lifetime progress? This cannot be undone.')) {
      audioManager.playSFX('uiClick');
      resetAllAchievements();
    }
  };

  return (
    <div className="achievements-screen" id="achievements-screen">
      <div className="achievements-screen__orb achievements-screen__orb--1" />
      <div className="achievements-screen__orb achievements-screen__orb--2" />

      <div className="achievements-screen__content">
        <div className="achievements-screen__header">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              audioManager.playSFX('uiClick');
              navigate('/menu');
            }}
            id="btn-back-menu"
            icon={<BackIcon className="icon--sm" />}
          >
            Back to Menu
          </Button>

          <h1 className="achievements-screen__title">Achievements</h1>
          <p className="achievements-screen__tagline">Showcase of color alchemy accomplishments</p>
        </div>

        {/* Overall Completion Progress */}
        <GlassCard className="achievements-screen__overview" padding="md">
          <div className="achievements-screen__overview-text">
            <span className="achievements-screen__overview-label">
              <TrophyIcon className="icon--sm icon--gold" style={{ marginRight: '8px' }} /> Overall Completion
            </span>
            <span className="achievements-screen__overview-value">
              {stats.unlocked} / {stats.total} Unlocked ({stats.percent}%)
            </span>
          </div>
          <ProgressBar
            value={stats.percent}
            maxValue={100}
            color="gold"
            size="normal"
            glow={true}
          />
        </GlassCard>

        {/* Category Filter Tabs */}
        <div className="achievements-screen__tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`achievements-screen__tab ${
                activeCategory === cat.id ? 'achievements-screen__tab--active' : ''
              }`}
              onClick={() => {
                audioManager.playSFX('uiHover');
                setActiveCategory(cat.id);
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="achievements-screen__grid">
          {filteredAchievements.map((def) => {
            const progress = achievementsState[def.id] || { unlockedAt: null, progress: 0 };
            return (
              <div key={def.id} className="achievements-screen__grid-item">
                <AchievementCard definition={def} progressState={progress} />
              </div>
            );
          })}
        </div>

        {/* Reset Progress Section (Subtle Footer Link) */}
        <div className="achievements-screen__footer">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            id="btn-reset-achievements"
            className="achievements-screen__reset-btn"
            icon={<ResetIcon className="icon--xs" />}
          >
            Reset All Achievements
          </Button>
        </div>
      </div>
    </div>
  );
};
export default AchievementsScreen;
