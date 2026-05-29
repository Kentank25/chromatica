import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import GlassCard from '../../components/common/GlassCard';
import { getHighScores, type LeaderboardEntry } from '../../utils/storageUtils';
import { MedalIcon, BackIcon } from '../../utils/icons';
import './LeaderboardScreen.css';

export const LeaderboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [latestScoreId, setLatestScoreId] = useState<string | null>(null);

  useEffect(() => {
    setScores(getHighScores());
    const id = localStorage.getItem('chromatica_v2_latest_score_id');
    setLatestScoreId(id);
  }, []);

  // Determine grade display color
  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'S': return '#FFD700'; // Gold
      case 'A': return '#45B6FE'; // Blue
      case 'B': return '#4ade80'; // Green
      case 'C': return '#FFA726'; // Orange
      default: return '#FF4A4A'; // Red
    }
  };

  return (
    <div className="leaderboard-screen" id="leaderboard-screen">
      <div className="leaderboard-screen__orb leaderboard-screen__orb--1" />
      <div className="leaderboard-screen__orb leaderboard-screen__orb--2" />

      <div className="leaderboard-screen__content">
        <h1 className="leaderboard-screen__title">HALL OF ALCHEMY</h1>
        <p className="leaderboard-screen__subtitle">Your greatest brewing achievements</p>

        <GlassCard className="leaderboard-screen__card" padding="lg">
          <div className="leaderboard-screen__table-wrapper">
            <table className="leaderboard-screen__table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Score</th>
                  <th scope="col">Grade</th>
                  <th scope="col">Date Obtained</th>
                </tr>
              </thead>
              <tbody>
                {scores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="leaderboard-screen__empty">
                      No recipes recorded yet. Go brew some potions!
                    </td>
                  </tr>
                ) : (
                  scores.map((entry, index) => {
                    const isNew = entry.id === latestScoreId;
                    return (
                      <tr
                        key={entry.id}
                        className={isNew ? 'leaderboard-screen__row--new' : undefined}
                      >
                        <td className="leaderboard-screen__cell-rank">
                          {index + 1 === 1 ? (
                            <MedalIcon className="icon--sm icon--gold" />
                          ) : index + 1 === 2 ? (
                            <MedalIcon className="icon--sm icon--silver" />
                          ) : index + 1 === 3 ? (
                            <MedalIcon className="icon--sm icon--bronze" />
                          ) : (
                            `${index + 1}`
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
                        <td className="leaderboard-screen__cell-date">{entry.date}</td>
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
