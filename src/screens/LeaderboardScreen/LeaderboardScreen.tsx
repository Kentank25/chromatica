import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import GlassCard from '../../components/common/GlassCard';
import { getHighScores } from '../../utils/storageUtils';
import { MedalIcon, BackIcon } from '../../utils/icons';
import { useLeaderboardStore } from '../../store/leaderboardStore';
import { useAuthStore } from '../../store/authStore';
import type { Difficulty } from '../../types/leaderboard.types';
import './LeaderboardScreen.css';

export const LeaderboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    globalScores,
    playerBest,
    playerRank,
    activeDifficulty,
    isLoading,
    error,
    isOnline,
    fetchLeaderboard,
    setActiveDifficulty
  } = useLeaderboardStore();

  const user = useAuthStore((s) => s.user);
  const localScores = useMemo(() => {
    const allLocal = getHighScores();
    return allLocal.filter((entry) => 
      entry.difficulty === activeDifficulty || 
      (!entry.difficulty && activeDifficulty === 'journeyman')
    );
  }, [activeDifficulty]);

  // Load online leaderboard
  useEffect(() => {
    fetchLeaderboard(activeDifficulty);
  }, [activeDifficulty, fetchLeaderboard]);

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'S': return '#FFD700'; // Gold
      case 'A': return '#45B6FE'; // Blue
      case 'B': return '#4ade80'; // Green
      case 'C': return '#FFA726'; // Orange
      default: return '#FF4A4A'; // Red
    }
  };

  const displayedScores = isOnline ? globalScores : localScores;

  const handleTabChange = (diff: Difficulty) => {
    setActiveDifficulty(diff);
  };

  return (
    <div className="leaderboard-screen" id="leaderboard-screen">
      <div className="leaderboard-screen__orb leaderboard-screen__orb--1" />
      <div className="leaderboard-screen__orb leaderboard-screen__orb--2" />

      <div className="leaderboard-screen__content">
        <h1 className="leaderboard-screen__title">HALL OF ALCHEMY</h1>
        <p className="leaderboard-screen__subtitle">Global high score registry & rankings</p>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="leaderboard-screen__offline-banner">
            ⚠️ Offline Mode — Displaying local achievements only
          </div>
        )}

        {/* Difficulty Selector Tabs */}
        <div className="leaderboard-screen__tabs" role="tablist" aria-label="Leaderboard difficulties">
          {(['apprentice', 'journeyman', 'master'] as const).map((diff) => (
            <button
              key={diff}
              role="tab"
              aria-selected={activeDifficulty === diff}
              className={`leaderboard-screen__tab leaderboard-screen__tab--${diff} ${
                activeDifficulty === diff ? 'leaderboard-screen__tab--active' : ''
              }`}
              onClick={() => handleTabChange(diff)}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Personal Best Rank Summary Card */}
        {user && (
          <GlassCard className="leaderboard-screen__personal-card" padding="md">
            <h3 className="leaderboard-screen__personal-title">Your Alchemy Record</h3>
            <div className="leaderboard-screen__personal-grid">
              <div className="leaderboard-screen__personal-stat">
                <span className="leaderboard-screen__personal-label">Rank</span>
                <span className="leaderboard-screen__personal-value">
                  {playerRank ? `#${playerRank}` : isOnline ? 'Unranked' : '#-'}
                </span>
              </div>
              <div className="leaderboard-screen__personal-stat">
                <span className="leaderboard-screen__personal-label">Best Score</span>
                <span className="leaderboard-screen__personal-value font-mono">
                  {playerBest ? playerBest.score.toLocaleString() : '0'}
                </span>
              </div>
              <div className="leaderboard-screen__personal-stat">
                <span className="leaderboard-screen__personal-label">Grade</span>
                <span 
                  className="leaderboard-screen__personal-value font-display"
                  style={{ color: playerBest ? getGradeColor(playerBest.grade) : 'var(--text-muted)' }}
                >
                  {playerBest ? playerBest.grade : '-'}
                </span>
              </div>
              <div className="leaderboard-screen__personal-stat">
                <span className="leaderboard-screen__personal-label">Max Wave</span>
                <span className="leaderboard-screen__personal-value font-mono">
                  {playerBest?.wave ? playerBest.wave : '-'}
                </span>
              </div>
            </div>
          </GlassCard>
        )}

        <GlassCard className="leaderboard-screen__card" padding="lg">
          <div className="leaderboard-screen__table-wrapper">
            <table className="leaderboard-screen__table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '80px' }}>Rank</th>
                  <th scope="col">Alchemist</th>
                  <th scope="col">Score</th>
                  <th scope="col">Grade</th>
                  <th scope="col" className="hide-mobile">Max Wave</th>
                  <th scope="col" className="hide-mobile">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Skeleton Shimmer Rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="leaderboard-screen__row--skeleton">
                      <td><div className="skeleton-box rank" /></td>
                      <td><div className="skeleton-box name" /></td>
                      <td><div className="skeleton-box score" /></td>
                      <td><div className="skeleton-box grade" /></td>
                      <td className="hide-mobile"><div className="skeleton-box wave" /></td>
                      <td className="hide-mobile"><div className="skeleton-box date" /></td>
                    </tr>
                  ))
                ) : displayedScores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="leaderboard-screen__empty">
                      {error ? error : "No recipes recorded yet on the archives. Go brew some potions!"}
                    </td>
                  </tr>
                ) : (
                  displayedScores.map((entry, index) => {
                    const isNew = entry.id === localStorage.getItem('chromatica_v2_latest_score_id');
                    const isCurrentUser = entry.uid === user?.uid;
                    const rankNum = index + 1;

                    return (
                      <tr
                        key={entry.id}
                        className={`
                          ${isNew ? 'leaderboard-screen__row--new' : ''} 
                          ${isCurrentUser ? 'leaderboard-screen__row--current-user' : ''}
                        `}
                      >
                        <td className="leaderboard-screen__cell-rank">
                          {rankNum === 1 ? (
                            <MedalIcon className="icon--sm icon--gold" />
                          ) : rankNum === 2 ? (
                            <MedalIcon className="icon--sm icon--silver" />
                          ) : rankNum === 3 ? (
                            <MedalIcon className="icon--sm icon--bronze" />
                          ) : (
                            rankNum
                          )}
                        </td>
                        <td className="leaderboard-screen__cell-name">
                          <span className="leaderboard-screen__display-name">
                            {entry.displayName || 'Themed Alchemist'}
                          </span>
                          {entry.isGuest && (
                            <span className="leaderboard-screen__guest-indicator">Guest</span>
                          )}
                        </td>
                        <td className="leaderboard-screen__cell-score">
                          {entry.score.toLocaleString()}
                          {isNew && <span className="leaderboard-screen__new-badge">NEW</span>}
                        </td>
                        <td className="leaderboard-screen__cell-grade">
                          <span
                            className="leaderboard-screen__grade-badge"
                            style={{
                              color: getGradeColor(entry.grade),
                              textShadow: `0 0 10px ${getGradeColor(entry.grade)}40`,
                            }}
                          >
                            {entry.grade}
                          </span>
                        </td>
                        <td className="leaderboard-screen__cell-wave hide-mobile">
                          {entry.wave ? `Wave ${entry.wave}` : '-'}
                        </td>
                        <td className="leaderboard-screen__cell-date hide-mobile">
                          {entry.date}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="leaderboard-screen__actions">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/menu')}
            id="btn-back-menu"
            icon={<BackIcon className="icon--sm" />}
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
};
