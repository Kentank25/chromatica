import React, { useMemo } from 'react';
import type { Client } from '../../types/game.types';
import type { RGB } from '../../types/color.types';
import ProgressBar from '../common/ProgressBar';
import './ClientCard.css';

interface ClientCardProps {
  client: Client | null;
  timeRemaining: number;
  maxTime: number;
}

const CLIENT_EMOJIS: Record<string, string> = {
  wizard: '🧙',
  zombie: '🧟',
  villager: '👤',
  noble: '👑',
  alchemist: '⚗️',
};

const EXPRESSION_EMOJIS: Record<string, string> = {
  neutral: '😐',
  happy: '😊',
  excited: '🤩',
  impatient: '😤',
  angry: '😡',
  sad: '😢',
};

function rgbToHex(c: RGB): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, timeRemaining, maxTime }) => {
  const timePct = maxTime > 0 ? (timeRemaining / maxTime) * 100 : 0;

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
  const expression = EXPRESSION_EMOJIS[client.expression] || '😐';
  const hex = rgbToHex(client.targetColor);

  return (
    <article className="client-card client-card--entering" key={client.id}>
      {/* Expression */}
      <span className="client-card__expression" title={`Feeling: ${client.expression}`}>
        {expression}
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

export default ClientCard;
