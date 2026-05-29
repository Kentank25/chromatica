import React from 'react';
import type { AchievementDefinition, AchievementProgress } from '../../types/achievement.types';
import { DynamicLucideIcon } from './AchievementToast';
import ProgressBar from '../common/ProgressBar';
import GlassCard from '../common/GlassCard';
import './AchievementCard.css';

interface AchievementCardProps {
  definition: AchievementDefinition;
  progressState: AchievementProgress;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ definition, progressState }) => {
  const isUnlocked = progressState.unlockedAt !== null;
  const showProgress = definition.maxProgress !== undefined && !isUnlocked;
  
  // Rarity color mappings for the background glows
  const glowMap: Record<string, 'none' | 'success' | 'combo' | 'gold'> = {
    common: 'none',
    uncommon: 'success', // green
    rare: 'success',    // using success as base, but styling overrides for blue
    epic: 'combo',      // purple
    legendary: 'gold',  // gold
  };

  // Determine display contents in case of secret locked achievements
  const isSecret = definition.secret && !isUnlocked;
  const name = isSecret ? 'Secret Achievement' : definition.name;
  const description = isSecret
    ? 'Mystery awaits. Keep brewing and exploring to discover this recipe.'
    : definition.description;

  const cardClass = `achievement-card achievement-card--${definition.rarity} ${
    isUnlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'
  } ${isSecret ? 'achievement-card--secret' : ''}`;

  return (
    <GlassCard
      className={cardClass}
      glowColor={isUnlocked ? glowMap[definition.rarity] : 'none'}
      hoverable={true}
      padding="md"
    >
      <div className="achievement-card__header">
        <div className="achievement-card__icon-wrap">
          {isUnlocked ? (
            <DynamicLucideIcon name={definition.icon} className="achievement-card__icon" size={24} />
          ) : (
            <DynamicLucideIcon name="Lock" className="achievement-card__icon achievement-card__icon--locked" size={24} />
          )}
        </div>
        <div className="achievement-card__meta">
          <span className="achievement-card__rarity">{definition.rarity}</span>
          <h3 className="achievement-card__name">{name}</h3>
        </div>
      </div>

      <div className="achievement-card__body">
        <p className="achievement-card__desc">{description}</p>
        
        {showProgress && definition.maxProgress && (
          <div className="achievement-card__progress">
            <div className="achievement-card__progress-labels">
              <span>Progress</span>
              <span>
                {progressState.progress} / {definition.maxProgress}
              </span>
            </div>
            <ProgressBar
              value={progressState.progress}
              maxValue={definition.maxProgress}
              color="green"
              size="thin"
            />
          </div>
        )}

        {isUnlocked && progressState.unlockedAt && (
          <span className="achievement-card__date">
            Unlocked: {new Date(progressState.unlockedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </GlassCard>
  );
};
export default AchievementCard;
