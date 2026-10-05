import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  getCountFromServer,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type { Difficulty, FirestoreScoreEntry, LeaderboardEntry } from '../types/leaderboard.types';

// In-memory cache for global leaderboard
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const globalLeaderboardCache: Record<string, CacheEntry<LeaderboardEntry[]>> = {};
const playerBestCache: Record<string, CacheEntry<LeaderboardEntry | null>> = {};
const playerRankCache: Record<string, CacheEntry<number | null>> = {};

const CACHE_TTL_MS = 60000;       // 60 seconds for global leaderboards
const PLAYER_CACHE_TTL_MS = 30000; // 30 seconds for player ranks/bests

function isCacheValid<T>(entry: CacheEntry<T> | undefined, ttl: number): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < ttl;
}

function docToEntry(docSnap: QueryDocumentSnapshot<DocumentData>): LeaderboardEntry {
  const data = docSnap.data() as FirestoreScoreEntry;
  const createdAt = data.createdAt as Timestamp | null;
  return {
    id: docSnap.id,
    ...data,
    date: createdAt ? createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString(),
    timestamp: createdAt ? createdAt.toMillis() : Date.now()
  };
}

export async function submitScore(entry: Omit<FirestoreScoreEntry, 'createdAt'>): Promise<string> {
  const collectionName = `leaderboard_${entry.difficulty}`;
  const docRef = await addDoc(collection(db, collectionName), {
    ...entry,
    createdAt: serverTimestamp()
  });

  // Invalidate caches for this difficulty
  delete globalLeaderboardCache[entry.difficulty];
  delete playerBestCache[`${entry.difficulty}_${entry.uid}`];
  delete playerRankCache[`${entry.difficulty}_${entry.uid}`];

  return docRef.id;
}

/**
 * Update the displayName on all existing score documents for a user.
 * Called when a user changes their tag name so the leaderboard stays up to date.
 */
export async function updateScoreDisplayNames(uid: string, displayName: string): Promise<void> {
  const difficulties: Difficulty[] = ['apprentice', 'journeyman', 'master'];

  await Promise.all(
    difficulties.map(async (difficulty) => {
      const collectionName = `leaderboard_${difficulty}`;
      const q = query(collection(db, collectionName), where('uid', '==', uid));
      const snapshot = await getDocs(q);

      const updates = snapshot.docs.map((docSnap) =>
        updateDoc(docSnap.ref, { displayName })
      );
      await Promise.all(updates);

      // Invalidate all caches for this player + difficulty
      delete globalLeaderboardCache[difficulty];
      delete playerBestCache[`${difficulty}_${uid}`];
    })
  );
}

export async function fetchTopScores(difficulty: Difficulty, limitCount = 50): Promise<LeaderboardEntry[]> {
  const cacheKey = `${difficulty}_${limitCount}`;
  if (isCacheValid(globalLeaderboardCache[cacheKey], CACHE_TTL_MS)) {
    return globalLeaderboardCache[cacheKey].data;
  }

  try {
    const collectionName = `leaderboard_${difficulty}`;
    const q = query(
      collection(db, collectionName),
      orderBy('score', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = snapshot.docs.map(docToEntry);

    globalLeaderboardCache[cacheKey] = { data: entries, timestamp: Date.now() };
    return entries;
  } catch (error) {
    console.error(`Error fetching top scores for ${difficulty}:`, error);
    throw error;
  }
}

export async function fetchPlayerBest(difficulty: Difficulty, uid: string): Promise<LeaderboardEntry | null> {
  const cacheKey = `${difficulty}_${uid}`;
  if (isCacheValid(playerBestCache[cacheKey], PLAYER_CACHE_TTL_MS)) {
    return playerBestCache[cacheKey].data;
  }

  try {
    const collectionName = `leaderboard_${difficulty}`;
    const q = query(
      collection(db, collectionName),
      where('uid', '==', uid),
      orderBy('score', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    const bestEntry = snapshot.docs.length > 0 ? docToEntry(snapshot.docs[0]) : null;

    playerBestCache[cacheKey] = { data: bestEntry, timestamp: Date.now() };
    return bestEntry;
  } catch (error) {
    console.error(`Error fetching player best for ${difficulty}:`, error);
    throw error;
  }
}

export async function fetchPlayerRank(difficulty: Difficulty, uid: string, score: number): Promise<number | null> {
  const cacheKey = `${difficulty}_${uid}`;
  if (isCacheValid(playerRankCache[cacheKey], PLAYER_CACHE_TTL_MS)) {
    return playerRankCache[cacheKey].data;
  }

  try {
    // Use a count query: how many scores are strictly greater than this one?
    const collectionName = `leaderboard_${difficulty}`;
    const q = query(
      collection(db, collectionName),
      where('score', '>', score)
    );

    const countSnapshot = await getCountFromServer(q);
    const rank = countSnapshot.data().count + 1;

    playerRankCache[cacheKey] = { data: rank, timestamp: Date.now() };
    return rank;
  } catch (error) {
    console.error(`Error fetching player rank for ${difficulty}:`, error);
    return null;
  }
}
