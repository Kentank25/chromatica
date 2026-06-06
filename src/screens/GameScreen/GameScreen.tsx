import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameHUD } from '../../components/hud/GameHUD';
import ClientCard from '../../components/game/ClientCard';
import ColorMixer from '../../components/game/ColorMixer';
import { PotionVial } from '../../components/game/PotionVial';
import { useEscapeKey } from '../../hooks/useInput';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { PauseOverlay } from '../PauseOverlay/PauseOverlay';
import { WaveTransition } from '../WaveTransition/WaveTransition';
import { TutorialOverlay } from '../../components/game/TutorialOverlay';
import { HintTokenIcon, MoreIcon, LessIcon, SparkleIcon, FailIcon } from '../../utils/icons';
import { AchievementToastContainer } from '../../components/game/AchievementToast';
import { useGameSession } from './hooks/useGameSession';
import './GameScreen.css';

export const GameScreen: React.FC = () => {
  const navigate = useNavigate();

  const {
    phase,
    timeRemaining,
    currentClient,
    playerMix,
    activeEffect,
    showPause,
    setShowPause,
    feedback,
    showFeedback,
    hintChannel,
    showWaveTransition,
    transitionStats,
    showTutorial,
    setShowTutorial,
    isTutorialFromPause,
    setIsTutorialFromPause,
    handlePause,
    skipFeedback,
    handleSubmit,
    handleUseToken,
    handleRestart,
    handleTransitionClose,
  } = useGameSession();

  // Hook up inputs and shortcuts
  useKeyboardShortcuts({
    enabled: (phase === 'playing' || phase === 'evaluating') && !showPause && !showTutorial,
    onPause: handlePause,
    onSkipFeedback: skipFeedback,
  });

  useEscapeKey(() => {
    if (phase === 'playing' && showPause) {
      setShowPause(false);
    }
  });

  const timerRatio = currentClient && currentClient.modifiers.patience > 0
    ? timeRemaining / currentClient.modifiers.patience
    : 1;

  const isUrgent = timerRatio < 0.25 && phase === 'playing' && !showPause && !showFeedback;
  const isCritical = timerRatio < 0.10 && phase === 'playing' && !showPause && !showFeedback;

  const gameScreenClass = `game-screen ${isCritical ? 'game-screen--critical' : isUrgent ? 'game-screen--urgent' : ''}`;

  return (
    <div className={gameScreenClass} id="game-screen">
      <GameHUD
        onUseToken={handleUseToken}
        onPause={handlePause}
      />

      <div className="game-screen__main" role="main">
        <div className="game-screen__left">
          {currentClient && (
            <ClientCard
              client={currentClient}
              timerPct={currentClient.modifiers.patience > 0 ? (timeRemaining / currentClient.modifiers.patience) * 100 : 0}
              phase={phase}
              feedback={feedback}
              reactionTier={feedback?.reactionTier}
              reactionDialogue={feedback?.reactionDialogue}
            />
          )}
        </div>

        <div className="game-screen__center">
          <div className="game-screen__vials">
            <PotionVial color={playerMix} label="Your Mix" size="lg" effect={activeEffect} />
            {currentClient && (
              <PotionVial
                color={currentClient.type === 'mystic' ? { r: 35, g: 25, b: 50 } : currentClient.targetColor}
                label={currentClient.type === 'mystic' ? 'Unknown Target' : 'Target'}
                size="lg"
                animated={currentClient.type === 'mystic'}
                isMystic={currentClient.type === 'mystic'}
              />
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
              {feedback.passed && feedback.effectBonus !== undefined && feedback.effectBonus > 0 && (
                <span className="game-screen__feedback-effect-bonus">
                  ✦ Effect Bonus: +{feedback.effectBonus} pts
                </span>
              )}
              {feedback.passed && feedback.tipReward && (
                <span className="game-screen__feedback-tip">
                  💰 Tip: {feedback.tipReward.type === 'score' ? `+${feedback.tipReward.amount} pts!` : `${feedback.tipReward.token === 'skip' ? 'Skip' : feedback.tipReward.token === 'hint' ? 'Hint' : 'Auto-Correct'} Token!`}
                </span>
              )}
              {feedback.passed && feedback.efficiencyDeduction !== undefined && feedback.efficiencyDeduction > 0 && (
                <span className="game-screen__feedback-efficiency">
                  &minus;{feedback.efficiencyDeduction} pts: Inefficient Mixing
                </span>
              )}
              {currentClient?.subOrders && feedback.passed && (
                <span className="game-screen__feedback-suborder">
                  Potion {(currentClient.currentSubOrder ?? 0) + 1} of {currentClient.subOrders.length} Done!
                </span>
              )}
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
          onTriggerTutorial={() => {
            setIsTutorialFromPause(true);
            setShowPause(false);
            setShowTutorial(true);
          }}
        />
      )}

      {showWaveTransition && (
        <WaveTransition
          waveNumber={transitionStats.waveNumber}
          clientsServed={transitionStats.clientsServed}
          accuracy={transitionStats.accuracy}
          pointsEarned={transitionStats.pointsEarned}
          perks={transitionStats.perks}
          onClose={handleTransitionClose}
        />
      )}

      {showTutorial && (
        <TutorialOverlay
          onClose={() => {
            setShowTutorial(false);
            if (isTutorialFromPause) {
              setIsTutorialFromPause(false);
              setShowPause(true);
            }
          }}
        />
      )}
      <AchievementToastContainer />
    </div>
  );
};

export default GameScreen;
