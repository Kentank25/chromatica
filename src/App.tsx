import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen/SplashScreen';
import { MainMenu } from './screens/MainMenu/MainMenu';
import { GameScreen } from './screens/GameScreen/GameScreen';
import { ResultsScreen } from './screens/ResultsScreen/ResultsScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen/LeaderboardScreen';
import { useAudio } from './hooks/useAudio';
import { audioManager } from './audio/AudioManager';
import { musicManager } from './audio/MusicManager';

function App() {
  useAudio(); // Synchronizes volume settings globally from the settingsStore

  useEffect(() => {
    audioManager.init();
    const ctx = audioManager.getContext();
    if (ctx) {
      musicManager.connectContext(ctx);
      musicManager.preloadAll(ctx);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/menu" element={<MainMenu />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/results" element={<ResultsScreen />} />
        <Route path="/leaderboard" element={<LeaderboardScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

