/**
 * @module storageUtils
 * LocalStorage persistence helpers for Chromatica v2.
 */

export interface LeaderboardEntry {
  id: string;
  score: number;
  grade: string;
  date: string;
  timestamp: number;
}

const HIGH_SCORES_KEY = 'chromatica_v2_high_scores';
const MAX_HIGH_SCORES = 10;
const SCORES_VERSION_KEY = 'chromatica_v2_scores_version';

function getRatingGrade(score: number): string {
  if (score >= 2000) return 'S';
  if (score >= 1000) return 'A';
  if (score >= 500) return 'B';
  if (score >= 200) return 'C';
  return 'D';
}

/**
 * Returns the saved high scores as a descending-sorted array (max 10) of LeaderboardEntry objects.
 * Handles automatic migration from old number[] score structures if found.
 */
export function getHighScores(): LeaderboardEntry[] {
  try {
    const version = localStorage.getItem(SCORES_VERSION_KEY);
    const raw = localStorage.getItem(HIGH_SCORES_KEY);

    if (version !== '2') {
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'number') {
          const migrated: LeaderboardEntry[] = (parsed as number[]).map((numScore, index) => ({
            id: `migrated_${index}_${numScore}_${Date.now()}`,
            score: numScore,
            grade: getRatingGrade(numScore),
            date: new Date().toLocaleDateString(),
            timestamp: Date.now() - index * 1000,
          }));
          localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(migrated));
          localStorage.setItem(SCORES_VERSION_KEY, '2');
          return migrated;
        }
      }
      localStorage.setItem(SCORES_VERSION_KEY, '2');
    }

    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return (parsed as LeaderboardEntry[])
      .filter((entry) => entry && typeof entry.score === 'number')
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_HIGH_SCORES);
  } catch {
    return [];
  }
}

/**
 * Saves a new high score to localStorage as a LeaderboardEntry.
 * Keeps only the top {@link MAX_HIGH_SCORES} entries, sorted descending.
 * Saves the newly added entry's ID to localStorage key 'chromatica_v2_latest_score_id'.
 */
export function saveHighScore(score: number): void {
  const entries = getHighScores();
  const newEntry: LeaderboardEntry = {
    id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    score,
    grade: getRatingGrade(score),
    date: new Date().toLocaleDateString(),
    timestamp: Date.now(),
  };

  entries.push(newEntry);
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, MAX_HIGH_SCORES);

  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(trimmed));
    localStorage.setItem('chromatica_v2_latest_score_id', newEntry.id);
  } catch {
    // Storage full or unavailable — silently degrade.
  }
}
