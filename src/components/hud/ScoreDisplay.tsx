import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import './ScoreDisplay.css';

export const ScoreDisplay: React.FC = () => {
  const score = useGameStore((s) => s.score);
  const [displayScore, setDisplayScore] = useState(0);
  const [showPop, setShowPop] = useState(false);
  const prevScore = useRef(0);

  useEffect(() => {
    if (score !== prevScore.current) {
      setShowPop(true);
      const start = prevScore.current;
      const diff = score - start;
      const duration = 400;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(start + diff * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);

      prevScore.current = score;
      setTimeout(() => setShowPop(false), 500);
    }
  }, [score]);

  return (
    <div className="score-display" id="score-display">
      <span className="score-display__label">Score</span>
      <span className={`score-display__value ${showPop ? 'score-display__value--pop' : ''}`}>
        {displayScore.toLocaleString()}
      </span>
    </div>
  );
};
