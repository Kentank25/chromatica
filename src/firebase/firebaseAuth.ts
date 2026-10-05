import {
  signInAnonymously,
  signInWithPopup,
  linkWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

const CHROMATICA_PREFIXES = [
  'Crimson', 'Azure', 'Verdant', 'Moonstone', 'Ember', 'Nightshade', 'Sol', 'Void',
  'Luminous', 'Shadowy', 'Vivid', 'Muted', 'Warm', 'Cool', 'Radiant', 'Spectral',
  'Prism', 'Golden', 'Silver', 'Bronze', 'Cobalt', 'Amber', 'Amethyst', 'Emerald',
  'Obsidian', 'Sparkling', 'Bubbling', 'Alchemical', 'Cosmic', 'Solar', 'Lunar'
];

const CHROMATICA_SUFFIXES = [
  'Brewer', 'Alchemist', 'Mixer', 'Initiate', 'Apprentice', 'Adept', 'Mystic', 'Weaver',
  'Crafter', 'Sage', 'Specialist', 'Artisan', 'Sorcerer', 'Witch', 'Mage', 'Scholar',
  'Botanist', 'Druid', 'Synthesizer', 'Philosopher', 'Hermit', 'Acolyte'
];

function generateChromaticaName(): string {
  const prefix = CHROMATICA_PREFIXES[Math.floor(Math.random() * CHROMATICA_PREFIXES.length)];
  const suffix = CHROMATICA_SUFFIXES[Math.floor(Math.random() * CHROMATICA_SUFFIXES.length)];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix} ${suffix} #${randomNum}`;
}

export async function ensureUserProfile(user: User): Promise<{ displayName: string; isGuest: boolean }> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      displayName: data.displayName || 'Unnamed Alchemist',
      isGuest: !!data.isGuest
    };
  } else {
    // Create new profile
    const isGuest = user.isAnonymous;
    const displayName = isGuest
      ? generateChromaticaName()
      : (user.displayName || 'Alchemist');

    await setDoc(userRef, {
      uid: user.uid,
      displayName,
      isGuest,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp()
    });

    return { displayName, isGuest };
  }
}

export async function signInAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  if (result.user) {
    await ensureUserProfile(result.user);
  }
  return result.user;
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const currentUser = auth.currentUser;

  if (currentUser && currentUser.isAnonymous) {
    // Link the anonymous session to Google to preserve UID + leaderboard data
    try {
      const result = await linkWithPopup(currentUser, provider);
      const linkedUser = result.user;

      // Update Firestore profile: promote from guest to named user
      const userRef = doc(db, 'users', linkedUser.uid);
      await updateDoc(userRef, {
        isGuest: false,
        displayName: linkedUser.displayName || 'Alchemist',
        lastSeenAt: serverTimestamp()
      });

      return linkedUser;
    } catch (error: unknown) {
      // credential-already-in-use: the Google account already has its own Firebase account.
      // Fall through to a direct sign-in in that case.
      const code = (error as { code?: string }).code;
      if (code !== 'auth/credential-already-in-use' && code !== 'auth/email-already-in-use') {
        throw error;
      }
      console.warn('Account linking skipped (account already exists), falling back to direct sign-in:', code);
    }
  }

  // Direct sign-in (new user or fallback from failed link)
  const result = await signInWithPopup(auth, provider);
  if (result.user) {
    await ensureUserProfile(result.user);
  }
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
