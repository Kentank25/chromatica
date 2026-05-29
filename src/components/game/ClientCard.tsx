import React, { useMemo, useState, useEffect, useRef } from 'react';
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

import {
  WizardIcon,
  ZombieIcon,
  VillagerIcon,
  NobleIcon,
  MysticIcon,
  AlchemistIcon,
  NeutralExpression,
  HappyExpression,
  EcstaticExpression,
  AnnoyedExpression,
  EnragedExpression,
  TimerIcon,
  EfficiencyIcon,
} from '../../utils/icons';
import type { IconProps } from '../../utils/icons';

const CLIENT_ICONS: Record<string, React.ComponentType<IconProps>> = {
  wizard: WizardIcon,
  zombie: ZombieIcon,
  villager: VillagerIcon,
  noble: NobleIcon,
  mystic: MysticIcon,
  alchemist: AlchemistIcon,
};

const EXPRESSION_ICONS: Record<ClientExpression, React.ComponentType<IconProps>> = {
  neutral: NeutralExpression,
  happy: HappyExpression,
  ecstatic: EcstaticExpression,
  annoyed: AnnoyedExpression,
  enraged: EnragedExpression,
};

const EXPRESSION_CLASSES: Record<ClientExpression, string> = {
  neutral: 'icon--neutral',
  happy: 'icon--happy',
  ecstatic: 'icon--ecstatic',
  annoyed: 'icon--annoyed',
  enraged: 'icon--enraged',
};

interface ArchetypeDetails {
  title: string;
  desc: string;
  patience: string;
  accuracy: string;
  multiplier: string;
  penalty: string;
}

const ARCHETYPE_INFO: Record<string, ArchetypeDetails> = {
  villager: {
    title: 'Villager',
    desc: 'A common villager from the local town. Patient and straightforward.',
    patience: '45 seconds (High)',
    accuracy: '70% Minimum',
    multiplier: '1.0× Base Score',
    penalty: 'Low (5 Satisfaction)',
  },
  wizard: {
    title: 'Wizard',
    desc: 'An impatient spellcaster. Demands speed but rewards high points.',
    patience: '20 seconds (Low)',
    accuracy: '70% Minimum',
    multiplier: '2.0× Score Multiplier',
    penalty: 'Medium (10 Satisfaction)',
  },
  zombie: {
    title: 'Zombie',
    desc: 'A shambling corpse. Slow but becomes extremely angry if they lose patience.',
    patience: '30 seconds (Medium)',
    accuracy: '60% Minimum (Low)',
    multiplier: '1.5× Score Multiplier',
    penalty: 'High (15 Satisfaction)',
  },
  noble: {
    title: 'Noble',
    desc: 'High-born aristocrat. Demand premium accuracy and efficient ingredient mixtures.',
    patience: '25 seconds (Medium)',
    accuracy: '80% Minimum (High)',
    multiplier: '2.5× Score Multiplier',
    penalty: 'Very High (20 Satisfaction)',
  },
  mystic: {
    title: 'Mystic',
    desc: 'A blindfolded seer. Describes their color in words; target color swatch is hidden.',
    patience: '35 seconds (Medium)',
    accuracy: '65% Minimum',
    multiplier: '1.8× Score Multiplier',
    penalty: 'Medium (12 Satisfaction)',
  },
};

const EFFICIENCY_INFO = {
  title: 'Picky Noble Rules',
  desc: 'Picky nobles demand minimal ingredient waste! Using too many ingredients or too much total volume will penalize your score.',
  rules: [
    'Leeway: Use up to 4 ingredients (Optimal + 1) without penalty.',
    'Deduction: -8% base score per extra ingredient beyond 4.',
    'Total Volume: -5% additional deduction if total mixture exceeds 15 parts.',
    'Cap: Penalty is capped at 40% maximum deduction.'
  ]
};

const ClientCardComponent: React.FC<ClientCardProps> = ({
  client,
  timerPct,
  phase = 'idle',
  feedback = null,
}) => {
  const [showBubble, setShowBubble] = useState(false);
  const [activeInfo, setActiveInfo] = useState<'type' | 'efficiency' | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Reset local interactive UI/Popup state and set up dialogue visibility during rendering when client changes, keeping rendering pure
  const [prevClientId, setPrevClientId] = useState<string | undefined>(client?.id);
  if (client?.id !== prevClientId) {
    setPrevClientId(client?.id);
    setActiveInfo(null);
    setShowBubble(!!client?.dialogue);
  }

  // Click outside popup handler
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeInfo && popupRef.current && !popupRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.client-card__type-badge') && !target.closest('.client-card__efficiency-badge')) {
          setActiveInfo(null);
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeInfo]);

  // Effect to clear speech bubble after 3 seconds, avoiding synchronous state updates in rendering cycles
  useEffect(() => {
    if (!showBubble) return;

    const timer = setTimeout(() => {
      setShowBubble(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showBubble]);

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

  const AvatarIcon = CLIENT_ICONS[client.type] || VillagerIcon;
  const ExpressionIcon = EXPRESSION_ICONS[dynamicExpression] || NeutralExpression;
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
      {client.dialogue && (
        <div className={`client-card__bubble ${showBubble ? 'client-card__bubble--visible' : ''}`}>
          {client.dialogue}
        </div>
      )}

      {/* Expression with key to trigger CSS pop animation on change */}
      <span
        key={dynamicExpression}
        className="client-card__expression"
        title={`Feeling: ${dynamicExpression}`}
      >
        <ExpressionIcon className={`icon--xl icon--expression ${EXPRESSION_CLASSES[dynamicExpression]}`} />
      </span>

      {/* Header */}
      <div className="client-card__header">
        <div className="client-card__avatar">
          <AvatarIcon className="icon--lg" />
        </div>
        <div className="client-card__info">
          <h3 className="client-card__name">{client.name}</h3>
          <div className="client-card__badge-row">
            <span
              className={`client-card__type-badge ${typeClass}`}
              role="button"
              tabIndex={0}
              onClick={() => setActiveInfo(activeInfo === 'type' ? null : 'type')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveInfo(activeInfo === 'type' ? null : 'type');
                }
              }}
              title="Click to view client guidelines & stats"
            >
              {client.type}
            </span>
            {client.modifiers.efficiencyPenalty && (
              <span
                className="client-card__efficiency-badge"
                role="button"
                tabIndex={0}
                onClick={() => setActiveInfo(activeInfo === 'efficiency' ? null : 'efficiency')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveInfo(activeInfo === 'efficiency' ? null : 'efficiency');
                  }
                }}
                title="Click to view Picky Noble rules"
              >
                <EfficiencyIcon className="icon--xs" />
                <span>Picky Noble</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Order Progress Indicator */}
      {client.subOrders && (
        <div className="client-card__order-progress">
          <div className="client-card__order-dots">
            {client.subOrders.map((_, i) => (
              <span
                key={i}
                className={`client-card__order-dot ${
                  i < (client.currentSubOrder ?? 0) ? 'client-card__order-dot--done' :
                  i === (client.currentSubOrder ?? 0) ? 'client-card__order-dot--active' :
                  'client-card__order-dot--pending'
                }`}
              />
            ))}
          </div>
          <span className="client-card__order-label">
            Potion {(client.currentSubOrder ?? 0) + 1} of {client.subOrders.length}
          </span>
        </div>
      )}

      {/* Target Color or Word-based Description (Mystic) */}
      <div className="client-card__target">
        {client.type === 'mystic' ? (
          <>
            <span className="client-card__target-label">They describe this color</span>
            <div className="client-card__target-description">
              <p className="client-card__description-text">
                "{client.colorDescription}"
              </p>
            </div>
            <div className="client-card__mystic-placeholder">
              <span>🔮 Mystic Vision</span>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Timer */}
      <div className="client-card__timer" role="timer" aria-label="Client patience remaining" aria-valuenow={Math.round(timerPct)}>
        <span className="client-card__timer-label">
          <TimerIcon className="icon--sm" /> Patience
        </span>
        <ProgressBar
          value={timerPct}
          color="auto"
          animated={true}
          size="thin"
          glow={timerPct < 25}
        />
      </div>
      {/* Floating Info Popup */}
      {activeInfo && (
        <div className="client-card__info-popup" ref={popupRef}>
          <button
            className="client-card__popup-close"
            onClick={() => setActiveInfo(null)}
            aria-label="Close rules description"
          >
            &times;
          </button>
          
          {activeInfo === 'type' && client && (
            (() => {
              const details = ARCHETYPE_INFO[client.type];
              if (!details) return null;
              return (
                <div className="client-card__popup-content">
                  <h4 className="client-card__popup-title">{details.title} Archetype</h4>
                  <p className="client-card__popup-desc">{details.desc}</p>
                  <ul className="client-card__popup-stats">
                    <li><strong>Patience:</strong> {details.patience}</li>
                    <li><strong>Accuracy Requirement:</strong> {details.accuracy}</li>
                    <li><strong>Score Multiplier:</strong> {details.multiplier}</li>
                    <li><strong>Fail Penalty:</strong> {details.penalty}</li>
                  </ul>
                </div>
              );
            })()
          )}

          {activeInfo === 'efficiency' && (
            <div className="client-card__popup-content">
              <h4 className="client-card__popup-title">{EFFICIENCY_INFO.title}</h4>
              <p className="client-card__popup-desc">{EFFICIENCY_INFO.desc}</p>
              <ul className="client-card__popup-stats client-card__popup-stats--rules">
                {EFFICIENCY_INFO.rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default React.memo(ClientCardComponent);

