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
import { PauseOverlay } from '../PauseOverlay/PauseOverlay';
import type { EvaluationResult } from '../../types/game.types';
import './GameScreen.css';

export const GameScreen: React.FC = () => {
  const navigate = useNavigate();
  const store = useGameStore();
  const [showPause, setShowPause] = useState(false);
  const [feedback, setFeedback] = useState<EvaluationResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hintChannel, setHintChannel] = useState<'r' | 'g' | 'b' | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>();

  // Initialize game on mount
  useEffect(() => {
    store.startGame();
    const client = generateClient(1);
    store.setCurrentClient(client);
    store.setTimeRemaining(client.modifiers.patience);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer countdown
  useGameLoop({
    onTick: (dt) => {
      if (store.phase !== 'playing' || showPause || showFeedback) return;
      const newTime = store.timeRemaining - dt;
      if (newTime <= 0) {
        handleTimeout();
      } else {
        store.setTimeRemaining(newTime);
      }
    },
    running: store.phase === 'playing' && !showPause && !showFeedback,
  });

  useEscapeKey(() => {
    if (store.phase === 'playing') setShowPause((p) => !p);
  });

  const handleTimeout = useCallback(() => {
    // Auto-fail on timeout
    if (!store.currentClient) return;
    store.updateSatisfaction(-store.currentClient.modifiers.penaltySeverity);
    store.resetCombo();
    store.incrementPotionsFailed();
    store.incrementClientsServed();
    checkAndAdvance();
  }, [store]);

  const handleSubmit = useCallback(() => {
    if (!store.currentClient || store.phase !== 'playing') return;

    const result = evaluatePotion(
      store.currentClient.targetColor,
      store.playerMix,
      store.currentClient,
      store.timeRemaining,
      store.comboStreak
    );

    setFeedback(result);
    setShowFeedback(true);
    store.setPhase('evaluating');

    if (result.passed) {
      store.updateScore(result.pointsEarned);
      store.addWaveScore(result.pointsEarned);
      store.incrementCombo();
      store.incrementPotionsCompleted();

      const reward = getComboReward(store.comboStreak + 1);
      if (reward) store.addToken(reward);
    } else {
      store.updateSatisfaction(-store.currentClient.modifiers.penaltySeverity);
      store.resetCombo();
      store.incrementPotionsFailed();
    }

    store.incrementClientsServed();

    feedbackTimer.current = setTimeout(() => {
      setShowFeedback(false);
      setFeedback(null);
      setHintChannel(null);
      checkAndAdvance();
    }, 1800);
  }, [store]);

  const checkAndAdvance = useCallback(() => {
    if (store.satisfaction <= 0) {
      store.setPhase('gameOver');
      setTimeout(() => navigate('/results'), 500);
      return;
    }

    const waveConfig = getWaveConfig(store.currentWave);
    if (isWaveClear(store.clientsServedThisWave, store.waveScore, waveConfig)) {
      store.addWaveResult({
        waveNumber: store.currentWave,
        clientsServed: store.clientsServedThisWave,
        averageAccuracy: 0,
        pointsEarned: store.waveScore,
      });
      store.nextWave();
    }

    // Spawn next client
    const newClient = generateClient(store.currentWave);
    store.setCurrentClient(newClient);
    store.setTimeRemaining(newClient.modifiers.patience);
    store.setPhase('playing');
  }, [store, navigate]);

  const handleUseToken = useCallback((type: 'skip' | 'hint' | 'autoCorrect') => {
    if (!store.currentClient) return;
    const used = store.useToken(type);
    if (!used) return;

    if (type === 'skip') {
      store.incrementClientsServed();
      const newClient = generateClient(store.currentWave);
      store.setCurrentClient(newClient);
      store.setTimeRemaining(newClient.modifiers.patience);
      setHintChannel(null);
    } else if (type === 'hint') {
      const channels: Array<'r' | 'g' | 'b'> = ['r', 'g', 'b'];
      setHintChannel(channels[Math.floor(Math.random() * 3)]);
    } else if (type === 'autoCorrect') {
      if (store.currentClient) {
        const channels: Array<'r' | 'g' | 'b'> = ['r', 'g', 'b'];
        const ch = channels[Math.floor(Math.random() * 3)];
        store.setPlayerMix({ ...store.playerMix, [ch]: store.currentClient.targetColor[ch] });
      }
    }
  }, [store]);

  const handleRestart = useCallback(() => {
    setShowPause(false);
    store.startGame();
    const client = generateClient(1);
    store.setCurrentClient(client);
    store.setTimeRemaining(client.modifiers.patience);
  }, [store]);

  const timerRatio = store.currentClient
    ? store.timeRemaining / store.currentClient.modifiers.patience
    : 1;

  return (
    <div className="game-screen" id="game-screen">
      <GameHUD onUseToken={handleUseToken} onPause={() => setShowPause(true)} />

      <div className="game-screen__main">
        <div className="game-screen__left">
          {store.currentClient && (
            <ClientCard client={store.currentClient} timeRemaining={store.timeRemaining} maxTime={store.currentClient.modifiers.patience} />
          )}
        </div>

        <div className="game-screen__center">
          <div className="game-screen__vials">
            <PotionVial color={store.playerMix} label="Your Mix" size="lg" />
            {store.currentClient && (
              <PotionVial color={store.currentClient.targetColor} label="Target" size="lg" animated={false} />
            )}
          </div>

          {/* Feedback overlay */}
          {showFeedback && feedback && (
            <div className={`game-screen__feedback ${feedback.passed ? 'game-screen__feedback--success' : 'game-screen__feedback--fail'}`}>
              <span className="game-screen__feedback-icon">{feedback.passed ? '✨' : '💨'}</span>
              <span className="game-screen__feedback-accuracy">{feedback.accuracy.toFixed(1)}%</span>
              {feedback.passed && <span className="game-screen__feedback-points">+{feedback.pointsEarned}</span>}
            </div>
          )}
        </div>

        <div className="game-screen__right">
          <ColorMixer onSubmit={handleSubmit} disabled={store.phase !== 'playing' || showPause} />
        </div>
      </div>

      {showPause && (
        <PauseOverlay
          onResume={() => setShowPause(false)}
          onRestart={handleRestart}
          onQuit={() => navigate('/menu')}
        />
      )}
    </div>
  );
};
