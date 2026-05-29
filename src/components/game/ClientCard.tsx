import React, { useMemo, useState, useEffect } from 'react';
import type { Client, GamePhase, ClientExpression } from '../../types/game.types';
import { rgbToHex } from '../../utils/colorUtils';
import ProgressBar from '../common/ProgressBar';
import './ClientCard.css';

interface ClientCardProps {
  client: Client | null;
  timerPct: number;
  phase?: GamePhase;
  feedback?: {
    passed: boolean;
    accuracy: number;
  } | null;
}

const CLIENT_EMOJIS: Record<string, string> = {
  wizard: '🧙',
  zombie: '🧟',
  villager: '👤',
  noble: '👑',
  alchemist: '⚗️',
};

const EXPRESSION_EMOJIS: Record<ClientExpression, string> = {
  neutral: '😐',
  happy: '😊',
  ecstatic: '🤩',
  annoyed: '😤',
  enraged: '😡',
};

const ClientCardComponent: React.FC<ClientCardProps> = ({
  client,
  timerPct,
  phase = 'idle',
  feedback = null,
}) => {
  const [dialogue, setDialogue] = useState('');
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    if (!client) {
      setShowBubble(false);
      return;
    }

    const dialogues: Record<string, string[]> = {
      villager: ["I need this for my garden fence!", "Can you match this for me?"],
      wizard: ["I require PRECISELY this hue.", "My spell demands exactness."],
      zombie: ["Graaagh... me want this color...", "Pretty... color..."],
      noble: ["Perfect, commoner. Not one shade off.", "I hope you know what you're doing."],
    };

    const lines = dialogues[client.type] || [];
    const line = lines[Math.floor(Math.random() * lines.length)] || '';
    setDialogue(line);
    setShowBubble(true);

    const timer = setTimeout(() => {
      setShowBubble(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [client?.id, client?.type]);

  const dynamicExpression = useMemo<ClientExpression>(() => {
    if (phase === 'evaluating' && feedback) {
      if (feedback.passed) {
        return feedback.accuracy >= 90 ? 'ecstatic' : 'happy';
      } else {
        return 'enraged';
      }
    }
    if (timerPct > 70) return 'neutral';
    if (timerPct > 40) return 'annoyed';
    return 'enraged'; // This maps both >15% and <=15% to 'enraged'
  }, [timerPct, phase, feedback]);

  const typeClass = useMemo(() => {
    if (!client) return '';
    return `client-card__type-badge--${client.type}`;
  }, [client]);

  if (!client) {
    return (
      <div className="client-card client-card--empty">
        <span className="client-card__empty-text">Awaiting next client…</span>
      </div>
    );
  }

  const avatar = CLIENT_EMOJIS[client.type] || '👤';
  const expressionEmoji = EXPRESSION_EMOJIS[dynamicExpression] || '😐';
  const hex = rgbToHex(client.targetColor);

  const urgencyClass =
    phase === 'playing'
      ? timerPct < 10
        ? 'client-card--critical'
        : timerPct < 25
          ? 'client-card--urgent'
          : ''
      : '';

  return (
    <article className={`client-card client-card--entering ${urgencyClass}`} key={client.id}>
      {/* Speech bubble */}
      {dialogue && (
        <div className={`client-card__bubble ${showBubble ? 'client-card__bubble--visible' : ''}`}>
          {dialogue}
        </div>
      )}

      {/* Expression with key to trigger CSS pop animation on change */}
      <span
        key={dynamicExpression}
        className="client-card__expression"
        title={`Feeling: ${dynamicExpression}`}
      >
        {expressionEmoji}
      </span>

      {/* Header */}
      <div className="client-card__header">
        <div className="client-card__avatar">{avatar}</div>
        <div className="client-card__info">
          <h3 className="client-card__name">{client.name}</h3>
          <span className={`client-card__type-badge ${typeClass}`}>
            {client.type}
          </span>
        </div>
      </div>

      {/* Target Color */}
      <div className="client-card__target">
        <span className="client-card__target-label">They want this color</span>
        <div
          className="client-card__target-swatch"
          style={{
            background: `rgb(${client.targetColor.r}, ${client.targetColor.g}, ${client.targetColor.b})`,
            boxShadow: `0 4px 20px rgba(${client.targetColor.r}, ${client.targetColor.g}, ${client.targetColor.b}, 0.3)`,
          }}
          aria-label={`Target color swatch: Red ${client.targetColor.r}, Green ${client.targetColor.g}, Blue ${client.targetColor.b}, hex ${hex}`}
        />
        <span className="client-card__target-hex">{hex}</span>
      </div>

      {/* Timer */}
      <div className="client-card__timer" role="timer" aria-label="Client patience remaining" aria-valuenow={Math.round(timerPct)}>
        <span className="client-card__timer-label">⏳ Patience</span>
        <ProgressBar
          value={timerPct}
          color="auto"
          animated={true}
          size="thin"
          glow={timerPct < 25}
        />
      </div>
    </article>
  );
};

export default React.memo(ClientCardComponent);

