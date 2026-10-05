import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import Button from '../../components/common/Button';
import GlassCard from '../../components/common/GlassCard';
import { saveHighScore } from '../../utils/storageUtils';
import { musicManager } from '../../audio/MusicManager';
import { RestartIcon, TrophyIcon } from '../../utils/icons';
import { useAchievementStore } from '../../store/achievementStore';
import { ACHIEVEMENT_DEFINITIONS } from '../../engine/achievementDefinitions';
import { DynamicLucideIcon } from '../../components/game/AchievementToast';
import { useAuthStore } from '../../store/authStore';
import { useLeaderboardStore } from '../../store/leaderboardStore';
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

  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const submitNewScore = useLeaderboardStore((s) => s.submitNewScore);

  const [submittingOnline, setSubmittingOnline] = useState(false);
  const [submittedOnline, setSubmittedOnline] = useState(false);
  const [onlineSubmitError, setOnlineSubmitError] = useState<string | null>(null);

  const [customName, setCustomName] = useState('');
  const [nameEditing, setNameEditing] = useState(false);
  const [nameUpdateSuccess, setNameUpdateSuccess] = useState(false);
  const [nameUpdateError, setNameUpdateError] = useState<string | null>(null);

  const lastSubmittedUid = React.useRef<string | null>(null);

  useEffect(() => {
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

  // Save score locally with full details once auth resolves
  useEffect(() => {
    if (!authLoading && user) {
      saveHighScore(score, {
        uid: user.uid,
        displayName: user.displayName,
        isGuest: user.isGuest,
        wave: waveHistory.length || currentWave,
        potionsBrewed: potionsCompleted,
        highestCombo,
        difficulty: useGameStore.getState().difficulty
      });
    }
  }, [authLoading, user, score, currentWave, highestCombo, potionsCompleted, waveHistory]);

  // Sync score online to global leaderboard
  useEffect(() => {
    if (!authLoading && user && score > 0) {
      const shouldSubmit = !submittedOnline && !submittingOnline && !onlineSubmitError;
      const uidChanged = lastSubmittedUid.current !== null && lastSubmittedUid.current !== user.uid;

      if (shouldSubmit || uidChanged) {
        lastSubmittedUid.current = user.uid;
        setSubmittingOnline(true);
        setSubmittedOnline(false);
        setOnlineSubmitError(null);

        submitNewScore({
          score,
          grade: rating.grade,
          wave: waveHistory.length || currentWave,
          potionsBrewed: potionsCompleted,
          highestCombo
        })
        .then(() => {
          setSubmittedOnline(true);
          setSubmittingOnline(false);
        })
        .catch((err: unknown) => {
          console.error(err);
          setOnlineSubmitError("Could not sync score online.");
          setSubmittingOnline(false);
        });
      }
    }
  }, [authLoading, user, score, submittedOnline, submittingOnline, onlineSubmitError, rating.grade, currentWave, potionsCompleted, highestCombo, waveHistory, submitNewScore]);

  const handleUpdateName = async () => {
    if (!customName.trim()) return;
    try {
      setNameUpdateError(null);
      setNameUpdateSuccess(false);
      await updateDisplayName(customName.trim());
      setNameUpdateSuccess(true);
      setNameEditing(false);

      // Re-submit score to update name on global leaderboard
      setSubmittingOnline(true);
      await submitNewScore({
        score,
        grade: rating.grade,
        wave: waveHistory.length || currentWave,
        potionsBrewed: potionsCompleted,
        highestCombo
      });
      setSubmittedOnline(true);
      setSubmittingOnline(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update tag name.";
      setNameUpdateError(message);
    }
  };

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

        {/* Global Leaderboard Sync Status & Identity Controls */}
        <GlassCard className="results__leaderboard-card" padding="md">
          <h3 className="results__leaderboard-title">
            <TrophyIcon className="icon--sm icon--gold" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Hall of Alchemy Registry
          </h3>

          {authLoading ? (
            <p className="results__leaderboard-status">Consulting the registry archives...</p>
          ) : (
            <div className="results__leaderboard-details">
              {user && (
                <>
                  <p className="results__leaderboard-text">
                    Registered as: <strong className="results__leaderboard-name">{user.displayName}</strong>
                    {user.isGuest && <span className="results__leaderboard-guest-badge">Guest</span>}
                  </p>

                  {/* Submission Status Message */}
                  {submittingOnline && (
                    <p className="results__leaderboard-status results__leaderboard-status--syncing">
                      Inscribing your recipe to the global archives...
                    </p>
                  )}
                  {submittedOnline && (
                    <p className="results__leaderboard-status results__leaderboard-status--success">
                      ✓ Score successfully synced to the global archives!
                    </p>
                  )}
                  {onlineSubmitError && (
                    <p className="results__leaderboard-status results__leaderboard-status--error">
                      ⚠️ {onlineSubmitError} (Saved locally)
                    </p>
                  )}

                  {/* Tag name editing — available for all users, including guests */}
                  <div className="results__leaderboard-actions">
                    {nameEditing ? (
                      <div className="results__leaderboard-edit-form">
                        <input
                          type="text"
                          maxLength={20}
                          value={customName}
                          onChange={(e) => {
                            setCustomName(e.target.value);
                            setNameUpdateError(null);
                          }}
                          className="results__leaderboard-input"
                          placeholder="Enter tag name..."
                        />
                        <div className="results__leaderboard-edit-buttons">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!customName.trim() || customName.trim() === user.displayName}
                            onClick={handleUpdateName}
                          >
                            Save Tag
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNameEditing(false);
                              setCustomName(user.displayName);
                              setNameUpdateError(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        {nameUpdateError && (
                          <span className="results__leaderboard-error">{nameUpdateError}</span>
                        )}
                      </div>
                    ) : (
                      <div className="results__leaderboard-view-form">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setNameEditing(true);
                            setNameUpdateSuccess(false);
                            setCustomName(user.displayName);
                          }}
                        >
                          Change Tag Name
                        </Button>
                        {nameUpdateSuccess && (
                          <span className="results__leaderboard-success">✓ Tag updated!</span>
                        )}
                      </div>
                    )}

                  </div>
                </>
              )}
            </div>
          )}
        </GlassCard>

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
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/leaderboard')}
            id="btn-leaderboard"
            icon={<TrophyIcon className="icon--sm" />}
          >
            Leaderboard
          </Button>
          <Button variant="ghost" size="md" onClick={() => navigate('/menu')} id="btn-menu">
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
};
