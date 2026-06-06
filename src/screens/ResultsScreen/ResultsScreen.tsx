import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import Button from '../../components/common/Button';
import GlassCard from '../../components/common/GlassCard';
import { saveHighScore } from '../../utils/storageUtils';
import { musicManager } from '../../audio/MusicManager';
import { RestartIcon } from '../../utils/icons';
import { useAchievementStore } from '../../store/achievementStore';
import { ACHIEVEMENT_DEFINITIONS } from '../../engine/achievementDefinitions';
import { DynamicLucideIcon } from '../../components/game/AchievementToast';
import './ResultsScreen.css';

function getRating(score: number): { grade: string; color: string } {
  if (score >= 2000) return { grade: 'S', color: '#FFD700' };
  if (score >= 1000) return { grade: 'A', color: '#45B6FE' };
  if (score >= 500) return { grade: 'B', color: '#4ade80' };
  if (score >= 200) return { grade: 'C', color: '#FFA726' };
  return { grade: 'D', color: '#FF4A4A' };
}

export const ResultsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { score, potionsCompleted, potionsFailed, highestCombo, currentWave, waveHistory } = useGameStore();
  const [displayScore, setDisplayScore] = useState(0);
  const sessionRecap = useAchievementStore((s) => s.sessionRecap);

  const sessionAchievements = useMemo(() => {
    const RARITY_PRIORITY: Record<string, number> = {
      legendary: 5,
      epic: 4,
      rare: 3,
      uncommon: 2,
      common: 1,
    };
    const list = sessionRecap
      .map((id) => ACHIEVEMENT_DEFINITIONS.find((def) => def.id === id))
      .filter((def): def is typeof ACHIEVEMENT_DEFINITIONS[number] => !!def);
    return [...list].sort((a, b) => {
      const priorityA = RARITY_PRIORITY[a.rarity] || 0;
      const priorityB = RARITY_PRIORITY[b.rarity] || 0;
      return priorityB - priorityA;
    });
  }, [sessionRecap]);

  const displayedAchievements = useMemo(() => {
    return sessionAchievements.slice(0, 5);
  }, [sessionAchievements]);

  const extraAchievements = useMemo(() => {
    return sessionAchievements.slice(5);
  }, [sessionAchievements]);

  const extraTooltip = useMemo(() => {
    return extraAchievements
      .map((def) => `${def.name} (${def.rarity.toUpperCase()}): ${def.description}`)
      .join('\n');
  }, [extraAchievements]);

  const avgAccuracy = useMemo(() => {
    const total = potionsCompleted + potionsFailed;
    return total > 0 ? Math.round((potionsCompleted / total) * 100) : 0;
  }, [potionsCompleted, potionsFailed]);

  const rating = getRating(score);

  useEffect(() => {
    saveHighScore(score);
    musicManager.play('results');
    // Animated count-up
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="results" id="results-screen">
      <div className="results__orb results__orb--1" />
      <div className="results__orb results__orb--2" />

      <div className="results__content">
        <h1 className="results__title">Game Over</h1>

        <div className="results__rating" style={{ color: rating.color, textShadow: `0 0 30px ${rating.color}` }}>
          {rating.grade}
        </div>

        <div className="results__score">
          <span className="results__score-label">Final Score</span>
          <span className="results__score-value">{displayScore.toLocaleString()}</span>
        </div>

        <div className="results__stats">
          <GlassCard className="results__stat" padding="md">
            <span className="results__stat-value">{potionsCompleted}</span>
            <span className="results__stat-label">Potions Brewed</span>
          </GlassCard>
          <GlassCard className="results__stat" padding="md">
            <span className="results__stat-value">{highestCombo}×</span>
            <span className="results__stat-label">Best Combo</span>
          </GlassCard>
          <GlassCard className="results__stat" padding="md">
            <span className="results__stat-value">{avgAccuracy}%</span>
            <span className="results__stat-label">Success Rate</span>
          </GlassCard>
          <GlassCard className="results__stat" padding="md">
            <span className="results__stat-value">{waveHistory.length || currentWave}</span>
            <span className="results__stat-label">Waves Cleared</span>
          </GlassCard>
        </div>

        {sessionAchievements.length > 0 && (
          <div className="results__achievements">
            <h3 className="results__achievements-title">Achievements Earned</h3>
            <div className="results__achievements-list">
              {displayedAchievements.map((def) => (
                <div
                  key={def.id}
                  className={`results__achievement-badge results__achievement-badge--${def.rarity}`}
                  title={`${def.name}: ${def.description}`}
                >
                  <DynamicLucideIcon name={def.icon} size={18} className="results__achievement-badge-icon" />
                  <span className="results__achievement-badge-name">{def.name}</span>
                </div>
              ))}
              {extraAchievements.length > 0 && (
                <div
                  className="results__achievement-badge results__achievement-badge--more"
                  title={extraTooltip}
                >
                  <span className="results__achievement-badge-name">+{extraAchievements.length} more</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="results__actions">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/game')}
            id="btn-retry"
            icon={<RestartIcon className="icon--sm" />}
          >
            Try Again
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate('/menu')} id="btn-menu">
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
};
