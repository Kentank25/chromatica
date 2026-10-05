import { create } from 'zustand';
import { 
  signInAsGuest, 
  signInWithGoogle, 
  signOut, 
  onAuthChange,
  ensureUserProfile 
} from '../firebase/firebaseAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

interface AuthUser {
  uid: string;
  displayName: string;
  isGuest: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  initAuth: () => () => void;
  loginAsGuest: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  initAuth: () => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      set({ isLoading: true });
      if (firebaseUser) {
        try {
          const profile = await ensureUserProfile(firebaseUser);
          set({
            user: {
              uid: firebaseUser.uid,
              displayName: profile.displayName,
              isGuest: profile.isGuest
            },
            isLoading: false,
            error: null
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to load user profile";
          console.error("Error ensuring user profile:", err);
          set({
            user: {
              uid: firebaseUser.uid,
              displayName: 'Guest Alchemist',
              isGuest: true
            },
            isLoading: false,
            error: message
          });
        }
      } else {
        // Force guest sign in if not logged in
        try {
          await signInAsGuest();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to authenticate";
          console.error("Error auto-signing in as guest:", err);
          set({ isLoading: false, error: message });
        }
      }
    });

    return unsubscribe;
  },

  loginAsGuest: async () => {
    set({ isLoading: true, error: null });
    try {
      await signInAsGuest();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Guest sign in failed";
      set({ isLoading: false, error: message });
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign in failed";
      set({ isLoading: false, error: message });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await signOut();
      // App will automatically trigger onAuthChange and sign back in as guest
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign out failed";
      set({ isLoading: false, error: message });
    }
  },

  updateDisplayName: async (name: string) => {
    const currentUser = get().user;
    if (!currentUser) throw new Error("No user authenticated");

    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 20) {
      throw new Error("Display name must be between 1 and 20 characters");
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { displayName: trimmed });
      set({
        user: {
          ...currentUser,
          displayName: trimmed
        }
      });

      // Propagate new name to all existing leaderboard score documents
      const { useLeaderboardStore } = await import('./leaderboardStore');
      await useLeaderboardStore.getState().propagateNameChange(currentUser.uid, trimmed);
    } catch (err: unknown) {
      console.error("Error updating display name:", err);
      const message = err instanceof Error ? err.message : "Failed to update display name";
      throw new Error(message, { cause: err });
    }
  }
}));
