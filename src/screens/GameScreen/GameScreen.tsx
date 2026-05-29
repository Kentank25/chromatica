import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { GameHUD } from '../../components/hud/GameHUD';
import ClientCard from '../../components/game/ClientCard';
import ColorMixer from '../../components/game/ColorMixer';
import { PotionVial } from '../../components/game/PotionVial';
import { generateClient } from '../../engine/clientGenerator';
import { evaluatePotion, getComboReward } from '../../engine/scoring';
import { getWaveConfig, isWaveClear } from '../../engine/waveManager';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useEscapeKey } from '../../hooks/useInput';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { PauseOverlay } from '../PauseOverlay/PauseOverlay';
import { WaveTransition } from '../WaveTransition/WaveTransition';
import { TutorialOverlay } from '../../components/game/TutorialOverlay';
import type { EvaluationResult } from '../../types/game.types';
import { audioManager } from '../../audio/AudioManager';
import { musicManager } from '../../audio/MusicManager';
import { HintTokenIcon, MoreIcon, LessIcon, SparkleIcon, FailIcon } from '../../utils/icons';
import { BASE_INGREDIENTS } from '../../engine/colorScience';
import { AchievementEventBus } from '../../engine/achievementEventBus';
import { useAchievementStore } from '../../store/achievementStore';
import { AchievementToastContainer } from '../../components/game/AchievementToast';
import './GameScreen.css';

export const GameScreen: React.FC = () => {
  const navigate = useNavigate();

  // Granular State Subscriptions
  const phase = useGameStore((s) => s.phase);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const currentClient = useGameStore((s) => s.currentClient);
  const satisfaction = useGameStore((s) => s.satisfaction);
  const currentWave = useGameStore((s) => s.currentWave);
  const clientsServedThisWave = useGameStore((s) => s.clientsServedThisWave);
  const waveScore = useGameStore((s) => s.waveScore);
  const playerMix = useGameStore((s) => s.playerMix);
  const comboStreak = useGameStore((s) => s.comboStreak);
  const difficulty = useGameStore((s) => s.difficulty);

  // Stable Action References
  const startGame = useGameStore((s) => s.startGame);
  const autoCorrectMixer = useGameStore((s) => s.autoCorrectMixer);
  const setCurrentClient = useGameStore((s) => s.setCurrentClient);
  const updateScore = useGameStore((s) => s.updateScore);
  const updateSatisfaction = useGameStore((s) => s.updateSatisfaction);
  const incrementCombo = useGameStore((s) => s.incrementCombo);
  const resetCombo = useGameStore((s) => s.resetCombo);
  const addToken = useGameStore((s) => s.addToken);
  const consumeToken = useGameStore((s) => s.useToken);
  const setPhase = useGameStore((s) => s.setPhase);
  const setTimeRemaining = useGameStore((s) => s.setTimeRemaining);
  const addWaveResult = useGameStore((s) => s.addWaveResult);
  const nextWave = useGameStore((s) => s.nextWave);
  const incrementPotionsCompleted = useGameStore((s) => s.incrementPotionsCompleted);
  const incrementPotionsFailed = useGameStore((s) => s.incrementPotionsFailed);
  const incrementClientsServed = useGameStore((s) => s.incrementClientsServed);
  const addWaveScore = useGameStore((s) => s.addWaveScore);

  const [showPause, setShowPause] = useState(false);
  const [feedback, setFeedback] = useState<EvaluationResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hintChannel, setHintChannel] = useState<'r' | 'g' | 'b' | null>(null);

  // Wave stats local tracking
  const [waveAccuracies, setWaveAccuracies] = useState<number[]>([]);
  const [showWaveTransition, setShowWaveTransition] = useState(false);
  const [transitionStats, setTransitionStats] = useState({
    waveNumber: 1,
    clientsServed: 0,
    accuracy: 0,
    pointsEarned: 0,
  });

  // Timers and Refs
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const localTimeRef = useRef(0);
  const lastStoreUpdate = useRef(0);
  const sessionClientTypesServed = useRef<Set<string>>(new Set());

  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('chromatica-tutorial');
  });

  // Initialize game on mount
  useEffect(() => {
    startGame();
    useAchievementStore.getState().clearSessionRecap();
    sessionClientTypesServed.current.clear();
    const client = generateClient(1, useGameStore.getState().difficulty);
    setCurrentClient(client);
    localTimeRef.current = client.modifiers.patience;
    setTimeRemaining(client.modifiers.patience);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize local timer reference when currentClient changes
  useEffect(() => {
    if (currentClient) {
      localTimeRef.current = currentClient.modifiers.patience;
      setTimeRemaining(currentClient.modifiers.patience);
    }
  }, [currentClient, setTimeRemaining]);

  // Hint token auto-dismiss after 5 seconds
  useEffect(() => {
    if (hintChannel) {
      const timer = setTimeout(() => {
        setHintChannel(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hintChannel]);

  // Synchronize BGM track and intensity reactively
  useEffect(() => {
    if (phase === 'playing') {
      const trackKey = currentWave <= 2 ? 'wave1'
                     : currentWave <= 4 ? 'wave2'
                     : 'wave3';
      musicManager.play(trackKey);
    } else if (phase === 'waveClear' || phase === 'gameOver') {
      musicManager.setIntensity('normal');
    }
  }, [phase, currentWave]);

  useEffect(() => {
    if (phase === 'playing' && currentClient) {
      const patience = currentClient.modifiers.patience || 1;
      const pct = timeRemaining / patience;
      if (pct > 0.25) {
        musicManager.setIntensity('normal');
      } else if (pct > 0.10) {
        musicManager.setIntensity('warning');
      } else {
        musicManager.setIntensity('urgent');
      }
    }
  }, [phase, timeRemaining, currentClient]);

  // Trigger client arrival sounds
  useEffect(() => {
    if (currentClient && phase === 'playing') {
      if (currentClient.type === 'wizard') {
        audioManager.playSFX('clientArriveWizard');
      } else if (currentClient.type === 'zombie') {
        audioManager.playSFX('clientArriveZombie');
      } else if (currentClient.type === 'villager' || currentClient.type === 'noble') {
        audioManager.playSFX('clientArriveVillager');
      }
    }
  }, [currentClient, phase]);

  // Stable check and advance logic
  const checkAndAdvance = useCallback(() => {
    if (satisfaction <= 0) {
      setPhase('gameOver');
      const { score, potionsCompleted, potionsFailed, highestCombo, waveHistory } = useGameStore.getState();
      AchievementEventBus.publish('SESSION_END', {
        finalScore: score,
        totalCompleted: potionsCompleted,
        totalFailed: potionsFailed,
        highestCombo: highestCombo,
        wavesCleared: waveHistory.length,
      });
      setTimeout(() => navigate('/results'), 500);
      return;
    }

    const waveConfig = getWaveConfig(currentWave, difficulty);
    if (isWaveClear(clientsServedThisWave, waveScore, waveConfig)) {
      // Calculate average accuracy of the wave
      const avgAccuracy = waveAccuracies.length > 0
        ? waveAccuracies.reduce((sum, val) => sum + val, 0) / waveAccuracies.length
        : 0;

      AchievementEventBus.publish('WAVE_CLEARED', {
        waveNumber: currentWave,
        clientsServed: clientsServedThisWave,
        averageAccuracy: avgAccuracy,
        pointsEarned: waveScore,
      });

      setTransitionStats({
        waveNumber: currentWave,
        clientsServed: clientsServedThisWave,
        accuracy: avgAccuracy,
        pointsEarned: waveScore,
      });
      setShowWaveTransition(true);
      setPhase('waveClear');
      audioManager.playSFX('waveClear');
      return;
    }

    // Spawn next client
    const newClient = generateClient(currentWave, difficulty);
    setCurrentClient(newClient);
    localTimeRef.current = newClient.modifiers.patience;
    setTimeRemaining(newClient.modifiers.patience);
    setPhase('playing');
  }, [
    satisfaction,
    currentWave,
    clientsServedThisWave,
    waveScore,
    waveAccuracies,
    difficulty,
    setPhase,
    setCurrentClient,
    setTimeRemaining,
    navigate,
  ]);

  // Stable transition close handler
  const handleTransitionClose = useCallback(() => {
    setShowWaveTransition(false);

    // Save wave results history
    addWaveResult({
      waveNumber: transitionStats.waveNumber,
      clientsServed: transitionStats.clientsServed,
      averageAccuracy: transitionStats.accuracy,
      pointsEarned: transitionStats.pointsEarned,
    });

    // Advance wave
    nextWave();
    setWaveAccuracies([]);

    // Spawn first client of the next wave
    const nextWaveNumber = transitionStats.waveNumber + 1;
    const newClient = generateClient(nextWaveNumber, difficulty);
    setCurrentClient(newClient);
    localTimeRef.current = newClient.modifiers.patience;
    setTimeRemaining(newClient.modifiers.patience);
    setPhase('playing');
  }, [
    transitionStats,
    addWaveResult,
    nextWave,
    setCurrentClient,
    setTimeRemaining,
    setPhase,
    difficulty,
  ]);

  // Stable timeout logic
  const handleTimeout = useCallback(() => {
    if (!currentClient) return;
    audioManager.playSFX('timeout');
    updateSatisfaction(-currentClient.modifiers.penaltySeverity);
    resetCombo();
    incrementPotionsFailed();
    incrementClientsServed();
    checkAndAdvance();
  }, [currentClient, updateSatisfaction, resetCombo, incrementPotionsFailed, incrementClientsServed, checkAndAdvance]);

  // Timer countdown with throttled store updates
  useGameLoop({
    onTick: (dt) => {
      if (phase !== 'playing' || showPause || showFeedback || showTutorial) return;
      localTimeRef.current -= dt;
      if (localTimeRef.current <= 0) {
        localTimeRef.current = 0;
        setTimeRemaining(0);
        handleTimeout();
      } else {
        // Throttle store writes to 10fps
        const now = performance.now();
        if (now - lastStoreUpdate.current >= 100) {
          setTimeRemaining(localTimeRef.current);
          lastStoreUpdate.current = now;
        }
      }
    },
    running: phase === 'playing' && !showPause && !showFeedback && !showTutorial,
  });

  // Stable pause handler
  const handlePause = useCallback(() => {
    if (phase === 'playing') {
      setTimeRemaining(localTimeRef.current);
      setShowPause(true);
    }
  }, [phase, setTimeRemaining]);

  useEscapeKey(() => {
    if (phase === 'playing' && showPause) {
      setShowPause(false);
    }
  });

  const skipFeedback = useCallback(() => {
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = undefined;
      setShowFeedback(false);
      setFeedback(null);
      setHintChannel(null);
      checkAndAdvance();
    }
  }, [checkAndAdvance]);

  useKeyboardShortcuts({
    enabled: (phase === 'playing' || phase === 'evaluating') && !showPause && !showTutorial,
    onPause: handlePause,
    onSkipFeedback: skipFeedback,
  });

  // Stable submit handler
  const handleSubmit = useCallback(() => {
    if (!currentClient || phase !== 'playing') return;

    // Sync exact remaining time to store before evaluation
    setTimeRemaining(localTimeRef.current);

    const result = evaluatePotion(
      currentClient.targetColor,
      playerMix,
      currentClient,
      localTimeRef.current,
      comboStreak
    );

    setFeedback(result);
    setShowFeedback(true);
    setPhase('evaluating');

    if (result.passed) {
      audioManager.playSFX('success');
      updateScore(result.pointsEarned);
      addWaveScore(result.pointsEarned);
      incrementCombo();
      incrementPotionsCompleted();

      const reward = getComboReward(comboStreak + 1);
      if (reward) addToken(reward);

      // Play comboMilestone if streak reaches 3, 5, 7
      const newStreak = comboStreak + 1;
      if (newStreak === 3 || newStreak === 5 || newStreak === 7) {
        audioManager.playSFX('comboMilestone');
      }
    } else {
      audioManager.playSFX('failure');
      updateSatisfaction(-currentClient.modifiers.penaltySeverity);
      resetCombo();
      incrementPotionsFailed();
    }

    if (result.passed) {
      sessionClientTypesServed.current.add(currentClient.type);
    }

    const ingredientsUsed = Object.entries(useGameStore.getState().mixerAmounts)
      .filter(([, amt]) => amt > 0)
      .map(([id]) => id);

    AchievementEventBus.publish('POTION_SUBMITTED', {
      passed: result.passed,
      accuracy: result.accuracy,
      comboStreak: result.passed ? comboStreak + 1 : 0,
      clientType: currentClient.type,
      patience: currentClient.modifiers.patience,
      timeRemaining: localTimeRef.current,
      ingredientsUsed,
      sessionClientTypesServed: sessionClientTypesServed.current,
    });

    incrementClientsServed();

    // Track accuracy of the current submission
    setWaveAccuracies((prev) => [...prev, result.accuracy]);

    feedbackTimer.current = setTimeout(() => {
      setShowFeedback(false);
      setFeedback(null);
      setHintChannel(null);
      checkAndAdvance();
    }, 1800);
  }, [
    currentClient,
    phase,
    playerMix,
    comboStreak,
    setTimeRemaining,
    updateScore,
    addWaveScore,
    incrementCombo,
    incrementPotionsCompleted,
    addToken,
    updateSatisfaction,
    resetCombo,
    incrementPotionsFailed,
    incrementClientsServed,
    checkAndAdvance,
    setPhase,
  ]);

  // Stable token use handler
  const handleUseToken = useCallback((type: 'skip' | 'hint' | 'autoCorrect') => {
    if (!currentClient) return;
    const used = consumeToken(type);
    if (!used) return;

    if (type === 'skip') {
      incrementClientsServed();
      const newClient = generateClient(currentWave, difficulty);
      setCurrentClient(newClient);
      localTimeRef.current = newClient.modifiers.patience;
      setTimeRemaining(newClient.modifiers.patience);
      setHintChannel(null);
    } else if (type === 'hint') {
      const channels: Array<'r' | 'g' | 'b'> = ['r', 'g', 'b'];
      setHintChannel(channels[Math.floor(Math.random() * 3)]);
    } else if (type === 'autoCorrect') {
      const visibleIngredients = BASE_INGREDIENTS.filter((ing) => (ing.unlockWave ?? 1) <= currentWave);
      autoCorrectMixer(currentClient.targetColor, visibleIngredients);
    }
  }, [
    currentClient,
    consumeToken,
    incrementClientsServed,
    currentWave,
    setCurrentClient,
    setTimeRemaining,
    autoCorrectMixer,
    difficulty,
  ]);

  // Stable restart handler
  const handleRestart = useCallback(() => {
    setShowPause(false);
    setShowWaveTransition(false);
    setWaveAccuracies([]);
    startGame();
    useAchievementStore.getState().clearSessionRecap();
    sessionClientTypesServed.current.clear();
    const client = generateClient(1, difficulty);
    setCurrentClient(client);
    localTimeRef.current = client.modifiers.patience;
    setTimeRemaining(client.modifiers.patience);
  }, [startGame, setCurrentClient, setTimeRemaining, difficulty]);

  const timerRatio = currentClient && currentClient.modifiers.patience > 0
    ? timeRemaining / currentClient.modifiers.patience
    : 1;

  const isUrgent = timerRatio < 0.25 && phase === 'playing' && !showPause && !showFeedback;
  const isCritical = timerRatio < 0.10 && phase === 'playing' && !showPause && !showFeedback;

  const gameScreenClass = `game-screen ${isCritical ? 'game-screen--critical' : isUrgent ? 'game-screen--urgent' : ''}`;

  return (
    <div className={gameScreenClass} id="game-screen">
      <GameHUD onUseToken={handleUseToken} onPause={handlePause} />

      <div className="game-screen__main" role="main">
        <div className="game-screen__left">
          {currentClient && (
            <ClientCard
              client={currentClient}
              timerPct={currentClient.modifiers.patience > 0 ? (timeRemaining / currentClient.modifiers.patience) * 100 : 0}
              phase={phase}
              feedback={feedback}
            />
          )}
        </div>

        <div className="game-screen__center">
          <div className="game-screen__vials">
            <PotionVial color={playerMix} label="Your Mix" size="lg" />
            {currentClient && (
              <PotionVial color={currentClient.targetColor} label="Target" size="lg" animated={false} />
            )}
          </div>

          {/* Hint Overlay Panel */}
          {hintChannel && currentClient && (
            <div className="game-screen__hint-panel">
              <span className="game-screen__hint-title">
                <HintTokenIcon className="icon--sm" style={{ marginRight: '6px' }} /> {hintChannel === 'r' ? 'Red' : hintChannel === 'g' ? 'Green' : 'Blue'} Channel Target: <strong>{currentClient.targetColor[hintChannel]}</strong>
              </span>
              <span className="game-screen__hint-direction">
                {playerMix[hintChannel] < currentClient.targetColor[hintChannel] ? (
                  <span className="game-screen__hint-direction--more">
                    Needs MORE {hintChannel === 'r' ? 'red' : hintChannel === 'g' ? 'green' : 'blue'}{' '}
                    <MoreIcon className="icon--xs icon--success" />
                  </span>
                ) : playerMix[hintChannel] > currentClient.targetColor[hintChannel] ? (
                  <span className="game-screen__hint-direction--less">
                    Needs LESS {hintChannel === 'r' ? 'red' : hintChannel === 'g' ? 'green' : 'blue'}{' '}
                    <LessIcon className="icon--xs icon--failure" />
                  </span>
                ) : (
                  <span className="game-screen__hint-direction--perfect">
                    Perfect match! <SparkleIcon className="icon--sm icon--gold" />
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Feedback overlay */}
          {showFeedback && feedback && (
            <div
              className={`game-screen__feedback ${feedback.passed ? 'game-screen__feedback--success' : 'game-screen__feedback--fail'}`}
              aria-live="polite"
            >
              <span className="game-screen__feedback-icon">
                {feedback.passed ? <SparkleIcon className="icon--xl icon--gold" /> : <FailIcon className="icon--xl icon--failure" />}
              </span>
              <span className="game-screen__feedback-accuracy">{feedback.accuracy.toFixed(1)}%</span>
              {feedback.passed && <span className="game-screen__feedback-points">+{feedback.pointsEarned}</span>}
            </div>
          )}
        </div>

        <div className="game-screen__right">
          <ColorMixer
            onSubmit={handleSubmit}
            disabled={phase !== 'playing' || showPause}
            resetKey={currentClient?.id}
          />
        </div>
      </div>

      {showPause && (
        <PauseOverlay
          onResume={() => setShowPause(false)}
          onRestart={handleRestart}
          onQuit={() => navigate('/menu')}
        />
      )}

      {showWaveTransition && (
        <WaveTransition
          waveNumber={transitionStats.waveNumber}
          clientsServed={transitionStats.clientsServed}
          accuracy={transitionStats.accuracy}
          pointsEarned={transitionStats.pointsEarned}
          onClose={handleTransitionClose}
        />
      )}

      {showTutorial && (
        <TutorialOverlay onClose={() => setShowTutorial(false)} />
      )}
      <AchievementToastContainer />
    </div>
  );
};
