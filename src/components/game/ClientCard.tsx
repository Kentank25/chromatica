import React, { useMemo } from 'react';
import type { Client, GamePhase, ClientExpression } from '../../types/game.types';
import { rgbToHex } from '../../utils/colorUtils';
import ProgressBar from '../common/ProgressBar';
import './ClientCard.css';

interface ClientCardProps {
  client: Client | null;
  timeRemaining: number;
  maxTime: number;
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
  timeRemaining,
  maxTime,
  phase = 'idle',
  feedback = null,
}) => {
  const timePct = maxTime > 0 ? (timeRemaining / maxTime) * 100 : 0;

  const dynamicExpression = useMemo<ClientExpression>(() => {
    if (phase === 'evaluating' && feedback) {
      if (feedback.passed) {
        return feedback.accuracy >= 90 ? 'ecstatic' : 'happy';
      } else {
        return 'enraged';
      }
    }
    if (timePct > 70) return 'neutral';
    if (timePct > 40) return 'annoyed';
    return 'enraged';
  }, [timePct, phase, feedback]);

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
      ? timePct < 10
        ? 'client-card--critical'
        : timePct < 25
          ? 'client-card--urgent'
          : ''
      : '';

  return (
    <article className={`client-card client-card--entering ${urgencyClass}`} key={client.id}>
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
        />
        <span className="client-card__target-hex">{hex}</span>
      </div>

      {/* Timer */}
      <div className="client-card__timer">
        <span className="client-card__timer-label">⏳ Patience</span>
        <ProgressBar
          value={timePct}
          color="auto"
          animated={true}
          size="thin"
          glow={timePct < 25}
        />
      </div>
    </article>
  );
};

export default React.memo(ClientCardComponent);
