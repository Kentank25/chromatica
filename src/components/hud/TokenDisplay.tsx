import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './TokenDisplay.css';

interface TokenInfo {
  type: 'skip' | 'hint' | 'autoCorrect';
  icon: string;
  label: string;
  desc: string;
}

const TOKENS: TokenInfo[] = [
  { type: 'skip', icon: '🪙', label: 'Skip', desc: 'Skip this client without penalty' },
  { type: 'hint', icon: '🔮', label: 'Hint', desc: 'Reveal one color channel' },
  { type: 'autoCorrect', icon: '⚗️', label: 'Fix', desc: 'Auto-correct one channel' },
];

interface TokenDisplayProps {
  onUseToken?: (type: 'skip' | 'hint' | 'autoCorrect') => void;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({ onUseToken }) => {
  const tokens = useGameStore((s) => s.tokens);

  return (
    <div className="token-display" id="token-display">
      {TOKENS.map((t) => {
        const count = tokens[t.type];
        return (
          <button
            key={t.type}
            className={`token-display__item ${count > 0 ? 'token-display__item--active' : ''}`}
            disabled={count <= 0}
            onClick={() => count > 0 && onUseToken?.(t.type)}
            title={t.desc}
            id={`token-${t.type}`}
            aria-label={`${count} ${t.label.toLowerCase()} token${count === 1 ? '' : 's'} remaining`}
          >
            <span className="token-display__icon">{t.icon}</span>
            <span className="token-display__count">{count}</span>
          </button>
        );
      })}
    </div>
  );
};
