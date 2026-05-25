import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen/SplashScreen';
import { MainMenu } from './screens/MainMenu/MainMenu';
import { GameScreen } from './screens/GameScreen/GameScreen';
import { ResultsScreen } from './screens/ResultsScreen/ResultsScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/menu" element={<MainMenu />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/results" element={<ResultsScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
