import type { Timestamp } from 'firebase/firestore';

export type Difficulty = 'apprentice' | 'journeyman' | 'master';

export interface UserProfile {
  uid: string;
  displayName: string;
  isGuest: boolean;
  createdAt: Timestamp;
  lastSeenAt: Timestamp;
}

export interface FirestoreScoreEntry {
  uid: string;
  displayName: string;
  isGuest: boolean;
  score: number;
  grade: string;
  wave: number;
  potionsBrewed: number;
  highestCombo: number;
  difficulty: Difficulty;
  createdAt: Timestamp;
}

export interface LeaderboardEntry {
  id: string;
  uid?: string;
  displayName?: string;
  isGuest?: boolean;
  score: number;
  grade: string;
  wave?: number;
  potionsBrewed?: number;
  highestCombo?: number;
  difficulty?: Difficulty;
  date: string;
  timestamp: number;
  rank?: number;
}
