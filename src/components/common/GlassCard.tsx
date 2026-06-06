import React from 'react';
import './GlassCard.css';

type GlowColor = 'success' | 'failure' | 'combo' | 'gold' | 'none';
type PaddingSize = 'sm' | 'md' | 'lg' | 'xl';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: GlowColor;
  hoverable?: boolean;
  padding?: PaddingSize;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glowColor = 'none',
  hoverable = false,
  padding = 'lg',
  style,
  onClick,
}) => {
  const classes = [
    'glass-card',
    `glass-card--pad-${padding}`,
    hoverable ? 'glass-card--hoverable' : '',
    glowColor !== 'none' ? `glass-card--glow-${glowColor}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={classes}
      style={style}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default GlassCard;
