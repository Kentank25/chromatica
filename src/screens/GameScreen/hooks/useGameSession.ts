import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../store/gameStore';
import { useAchievementStore } from '../../../store/achievementStore';
import { generateClient } from '../../../engine/clientGenerator';
import { evaluatePotion, getComboReward } from '../../../engine/scoring';
import { getWaveMetrics, isWaveClear } from '../../../engine/waveManager';
import { PERK_POOL } from '../../../engine/perksManager';
import type { PerkDefinition } from '../../../engine/perksManager';
import { audioManager } from '../../../audio/AudioManager';
import { musicManager } from '../../../audio/MusicManager';
import { BASE_INGREDIENTS } from '../../../engine/colorScience';
import { AchievementEventBus } from '../../../engine/achievementEventBus';
import { useGameTimer } from './useGameTimer';
import type { EvaluationResult } from '../../../types/game.types';

export function useGameSession() {
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
  const activeEffect = useGameStore((s) => s.activeEffect);

  // Stable Action References
  const startGame = useGameStore((s) => s.startGame);
  const autoCorrectMixer = useGameStore((s) => s.autoCorrectMixer);
  const setCurrentClient = useGameStore((s) => s.setCurrentClient);
  const updateScore = useGameStore((s) => s.updateScore);
  const updateSatisfaction = useGameStore((s) => s.updateSatisfaction);
  const incrementCombo = useGameStore((s) => s.incrementCombo);
  const resetCombo = useGameStore((s) => s.resetCombo);
  const setMultiOrder = useGameStore((s) => s.setMultiOrder);
  const clearMultiOrder = useGameStore((s) => s.clearMultiOrder);
  const advanceSubOrder = useGameStore((s) => s.advanceSubOrder);
  const resetMixerAmounts = useGameStore((s) => s.resetMixerAmounts);
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

  // Local Component States
  const [showPause, setShowPause] = useState(false);
  const [feedback, setFeedback] = useState<EvaluationResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hintChannel, setHintChannel] = useState<'r' | 'g' | 'b' | null>(null);
  const [waveAccuracies, setWaveAccuracies] = useState<number[]>([]);
  const [showWaveTransition, setShowWaveTransition] = useState(false);
  const [transitionStats, setTransitionStats] = useState<{
    waveNumber: number;
    clientsServed: number;
    accuracy: number;
    pointsEarned: number;
    perks: PerkDefinition[];
  }>({
    waveNumber: 1,
    clientsServed: 0,
    accuracy: 0,
    pointsEarned: 0,
    perks: [],
  });
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('chromatica-tutorial');
  });
  const [isTutorialFromPause, setIsTutorialFromPause] = useState(false);

  // Refs
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sessionClientTypesServed = useRef<Set<string>>(new Set());

  // Stable game over sequence
  const triggerGameOver = useCallback((immediate: boolean = false) => {
    setPhase('gameOver');
    const { score, potionsCompleted, potionsFailed, highestCombo, waveHistory } = useGameStore.getState();
    AchievementEventBus.publish('SESSION_END', {
      finalScore: score,
      totalCompleted: potionsCompleted,
      totalFailed: potionsFailed,
      highestCombo: highestCombo,
      wavesCleared: waveHistory.length,
    });
    if (immediate) {
      navigate('/results', { replace: true });
    } else {
      navigateTimer.current = setTimeout(() => navigate('/results', { replace: true }), 500);
    }
  }, [setPhase, navigate]);

  // Stable check and advance logic
  const checkAndAdvance = useCallback(() => {
    const currentSatisfaction = useGameStore.getState().satisfaction;
    if (currentSatisfaction <= 0) {
      triggerGameOver(false);
      return;
    }

    const waveConfig = getWaveMetrics(currentWave, difficulty);
    if (isWaveClear(clientsServedThisWave, waveScore, waveConfig)) {
      const avgAccuracy = waveAccuracies.length > 0
        ? waveAccuracies.reduce((sum, val) => sum + val, 0) / waveAccuracies.length
        : 0;

      AchievementEventBus.publish('WAVE_CLEARED', {
        waveNumber: currentWave,
        clientsServed: clientsServedThisWave,
        averageAccuracy: avgAccuracy,
        pointsEarned: waveScore,
      });

      // Generate 3 unique random perks for this wave clear
      const pool = [...PERK_POOL];
      const selected: PerkDefinition[] = [];
      while (selected.length < 3 && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        selected.push(pool.splice(idx, 1)[0]);
      }

      setTransitionStats({
        waveNumber: currentWave,
        clientsServed: clientsServedThisWave,
        accuracy: avgAccuracy,
        pointsEarned: waveScore,
        perks: selected,
      });
      setShowWaveTransition(true);
      setPhase('waveClear');
      audioManager.playSFX('waveClear');
      return;
    }

    const newClient = generateClient(currentWave, difficulty);
    if (newClient.subOrders) {
      setMultiOrder(newClient.subOrders);
    } else {
      clearMultiOrder();
    }
    setCurrentClient(newClient);
    setPhase('playing');
  }, [
    currentWave,
    clientsServedThisWave,
    waveScore,
    waveAccuracies,
    difficulty,
    setPhase,
    setCurrentClient,
    setMultiOrder,
    clearMultiOrder,
    triggerGameOver,
  ]);

  // Stable timeout logic
  const handleTimeout = useCallback(() => {
    if (!currentClient) return;
    audioManager.playSFX('timeout');
    
    // Apply client-specific satisfaction penalty rather than immediately ending the game
    const activePerks = useGameStore.getState().activePerks || [];
    let penaltyMult = 1.0;
    for (const perkId of activePerks) {
      const perk = PERK_POOL.find((p) => p.id === perkId);
      if (perk && perk.penaltyMultiplier) {
        penaltyMult *= perk.penaltyMultiplier;
      }
    }
    const penalty = Math.round(currentClient.modifiers.penaltySeverity * penaltyMult);
    updateSatisfaction(-penalty);
    
    resetCombo();
    incrementPotionsFailed();
    incrementClientsServed();

    // Check if satisfaction reached 0. If so, trigger game over immediately. Otherwise, check and advance.
    const liveSatisfaction = useGameStore.getState().satisfaction;
    if (liveSatisfaction <= 0) {
      triggerGameOver(true);
    } else {
      checkAndAdvance();
    }
  }, [currentClient, updateSatisfaction, resetCombo, incrementPotionsFailed, incrementClientsServed, triggerGameOver, checkAndAdvance]);

  // Hook up timer logic
  const isTimerRunning = phase === 'playing' && !showPause && !showFeedback && !showTutorial;
  const localTimeRef = useGameTimer({
    currentClient,
    running: isTimerRunning,
    onTimeout: handleTimeout,
  });

  // Initialize game on mount
  useEffect(() => {
    startGame();
    useAchievementStore.getState().clearSessionRecap();
    sessionClientTypesServed.current.clear();
    const client = generateClient(1, useGameStore.getState().difficulty);
    if (client.subOrders) {
      setMultiOrder(client.subOrders);
    } else {
      clearMultiOrder();
    }
    setCurrentClient(client);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hint token auto-dismiss after 5 seconds
  useEffect(() => {
    if (hintChannel) {
      const timer = setTimeout(() => {
        setHintChannel(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hintChannel]);

  // Clean up feedback and navigate timers on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) {
        clearTimeout(feedbackTimer.current);
      }
      if (navigateTimer.current) {
        clearTimeout(navigateTimer.current);
      }
    };
  }, []);

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
  const currentClientId = currentClient?.id;
  useEffect(() => {
    if (currentClient && phase === 'playing') {
      if (currentClient.type === 'wizard') {
        audioManager.playSFX('clientArriveWizard');
      } else if (currentClient.type === 'zombie') {
        audioManager.playSFX('clientArriveZombie');
      } else if (currentClient.type === 'villager' || currentClient.type === 'noble' || currentClient.type === 'mystic') {
        audioManager.playSFX('clientArriveVillager');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentClientId, phase]);

  // Stable transition close handler
  const handleTransitionClose = useCallback(() => {
    setShowWaveTransition(false);

    addWaveResult({
      waveNumber: transitionStats.waveNumber,
      clientsServed: transitionStats.clientsServed,
      averageAccuracy: transitionStats.accuracy,
      pointsEarned: transitionStats.pointsEarned,
    });

    nextWave();
    setWaveAccuracies([]);

    const nextWaveNumber = transitionStats.waveNumber + 1;
    const newClient = generateClient(nextWaveNumber, difficulty);
    setCurrentClient(newClient);
    setPhase('playing');
  }, [
    transitionStats,
    addWaveResult,
    nextWave,
    setCurrentClient,
    setPhase,
    difficulty,
  ]);

  // Stable pause handler
  const handlePause = useCallback(() => {
    if (phase === 'playing') {
      setTimeRemaining(localTimeRef.current);
      setShowPause(true);
    }
  }, [phase, setTimeRemaining, localTimeRef]);

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

  // Stable submit handler
  const handleSubmit = useCallback(() => {
    if (!currentClient || phase !== 'playing') return;

    setTimeRemaining(localTimeRef.current);

    const mixerAmounts = useGameStore.getState().mixerAmounts;
    const activeIngredients = Object.entries(mixerAmounts).filter(([, amt]) => amt > 0);
    const ingredientsUsed = activeIngredients.map(([id]) => id);
    const totalAmount = activeIngredients.reduce((sum, [, amt]) => sum + amt, 0);

    const activePerks = useGameStore.getState().activePerks || [];
    const result = evaluatePotion(
      currentClient.targetColor,
      playerMix,
      currentClient,
      localTimeRef.current,
      comboStreak,
      currentClient.modifiers.efficiencyPenalty
        ? { ingredientsUsed: activeIngredients.length, totalAmount }
        : undefined,
      playerMix,
      activePerks,
    );

    setFeedback(result);
    setShowFeedback(true);
    setPhase('evaluating');

    const isMultiOrder = !!currentClient.subOrders;
    const subOrderIndex = currentClient.currentSubOrder ?? 0;
    const subOrderTotal = currentClient.subOrders ? currentClient.subOrders.length : 1;
    const hasMoreSubOrders = isMultiOrder && (subOrderIndex + 1 < subOrderTotal);

    if (result.passed) {
      audioManager.playSFX('success');
      updateScore(result.pointsEarned);
      addWaveScore(result.pointsEarned);
      incrementCombo();
      incrementPotionsCompleted();

      const reward = getComboReward(comboStreak + 1);
      if (reward) addToken(reward);

      const newStreak = comboStreak + 1;
      if (newStreak === 3 || newStreak === 5 || newStreak === 7) {
        audioManager.playSFX('comboMilestone');
      }

      if (result.effectBonus && result.effectBonus > 0) {
        audioManager.playSFX('effectMatch');
      }

      if (result.tipReward) {
        audioManager.playSFX('tipReward');
        if (result.tipReward.type === 'score') {
          updateScore(result.tipReward.amount);
          addWaveScore(result.tipReward.amount);
        } else if (result.tipReward.type === 'token') {
          addToken(result.tipReward.token);
        }
      }

      if (hasMoreSubOrders) {
        const activePerksList = useGameStore.getState().activePerks || [];
        let patienceMult = 1.0;
        for (const perkId of activePerksList) {
          const perk = PERK_POOL.find((p) => p.id === perkId);
          if (perk && perk.patienceMultiplier) {
            patienceMult *= perk.patienceMultiplier;
          }
        }
        const actualPatience = currentClient.modifiers.patience * patienceMult;
        localTimeRef.current = Math.min(actualPatience, localTimeRef.current + 2);
        setTimeRemaining(localTimeRef.current);
      }
    } else {
      audioManager.playSFX('failure');
      // Apply client-specific satisfaction penalty rather than immediately ending the game
      const activePerks = useGameStore.getState().activePerks || [];
      let penaltyMult = 1.0;
      for (const perkId of activePerks) {
        const perk = PERK_POOL.find((p) => p.id === perkId);
        if (perk && perk.penaltyMultiplier) {
          penaltyMult *= perk.penaltyMultiplier;
        }
      }
      const penalty = Math.round(currentClient.modifiers.penaltySeverity * penaltyMult);
      updateSatisfaction(-penalty);
      resetCombo();
      incrementPotionsFailed();
    }

    if (result.passed) {
      sessionClientTypesServed.current.add(currentClient.type);
    }

    AchievementEventBus.publish('POTION_SUBMITTED', {
      passed: result.passed,
      accuracy: result.accuracy,
      comboStreak: result.passed ? comboStreak + 1 : 0,
      clientType: currentClient.type,
      patience: currentClient.modifiers.patience,
      timeRemaining: localTimeRef.current,
      ingredientsUsed,
      sessionClientTypesServed: sessionClientTypesServed.current,
      detectedEffect: result.detectedEffect,
      effectMatched: result.effectBonus ? result.effectBonus > 0 : false,
      reactionTier: result.reactionTier,
      tipReceived: !!result.tipReward,
    });

    if (!result.passed || !hasMoreSubOrders) {
      incrementClientsServed();
    }

    setWaveAccuracies((prev) => [...prev, result.accuracy]);

    feedbackTimer.current = setTimeout(() => {
      setShowFeedback(false);
      setFeedback(null);
      setHintChannel(null);

      if (result.passed && hasMoreSubOrders) {
        resetMixerAmounts();
        advanceSubOrder();
        setPhase('playing');
      } else {
        const currentSatisfaction = useGameStore.getState().satisfaction;
        if (currentSatisfaction <= 0) {
          triggerGameOver(true);
        } else {
          checkAndAdvance();
        }
      }
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
    resetMixerAmounts,
    advanceSubOrder,
    localTimeRef,
    triggerGameOver,
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
  }, [startGame, setCurrentClient, difficulty]);

  return {
    phase,
    timeRemaining,
    currentClient,
    satisfaction,
    currentWave,
    clientsServedThisWave,
    waveScore,
    playerMix,
    comboStreak,
    activeEffect,
    showPause,
    setShowPause,
    feedback,
    showFeedback,
    hintChannel,
    setHintChannel,
    showWaveTransition,
    transitionStats,
    showTutorial,
    setShowTutorial,
    isTutorialFromPause,
    setIsTutorialFromPause,
    handleTimeout,
    handlePause,
    skipFeedback,
    handleSubmit,
    handleUseToken,
    handleRestart,
    handleTransitionClose,
  };
}
export default useGameSession;
