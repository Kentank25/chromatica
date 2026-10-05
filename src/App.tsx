import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen/SplashScreen';
import { MainMenu } from './screens/MainMenu/MainMenu';
import { GameScreen } from './screens/GameScreen/GameScreen';
import { ResultsScreen } from './screens/ResultsScreen/ResultsScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen/LeaderboardScreen';
import { AchievementsScreen } from './screens/AchievementsScreen/AchievementsScreen';
import { useAudio } from './hooks/useAudio';
import { audioManager } from './audio/AudioManager';
import { musicManager } from './audio/MusicManager';
import { useAchievementStore } from './store/achievementStore';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useGameStore } from './store/gameStore';

const ResultsGuard = ({ children }: { children: React.ReactNode }) => {
  const phase = useGameStore((s) => s.phase);
  if (phase === 'idle') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  useAudio(); // Synchronizes volume settings globally from the settingsStore

  useEffect(() => {
    audioManager.init();
    const ctx = audioManager.getContext();
    if (ctx) {
      musicManager.connectContext(ctx);
      musicManager.preloadAll(ctx);
    }
    
    // Subscribe achievement store to event bus
    const unsubAchievements = useAchievementStore.getState().init();
    // Subscribe auth store to Firebase auth state changes
    const unsubAuth = useAuthStore.getState().initAuth();

    return () => {
      unsubAchievements();
      unsubAuth();
    };
  }, []);

  return (
    <HashRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/results" element={<ResultsGuard><ResultsScreen /></ResultsGuard>} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/achievements" element={<AchievementsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}

export default App;

