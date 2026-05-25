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

  return (
    <div className={classes} style={style} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
};

export default GlassCard;
