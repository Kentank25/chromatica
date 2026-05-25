import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  value: number;
  maxValue?: number;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gold' | 'auto';
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
  size?: 'thin' | 'normal' | 'thick';
  glow?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  maxValue = 100,
  color = 'auto',
  label,
  showPercentage = false,
  animated = true,
  className = '',
  size = 'normal',
  glow = false,
}) => {
  const pct = Math.max(0, Math.min(100, (value / maxValue) * 100));

  const resolvedColor = color === 'auto'
    ? pct > 60 ? 'green' : pct > 30 ? 'yellow' : 'red'
    : color;

  const sizeClass = size !== 'normal' ? `progress-bar--${size}` : '';

  const fillClasses = [
    'progress-bar__fill',
    `progress-bar__fill--${resolvedColor}`,
    animated ? 'progress-bar__fill--animated' : '',
    glow ? 'progress-bar__fill--glow' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`progress-bar ${sizeClass} ${className}`}>
      {(label || showPercentage) && (
        <div className="progress-bar__header">
          {label && <span className="progress-bar__label">{label}</span>}
          {showPercentage && (
            <span className="progress-bar__percentage">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className="progress-bar__track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={maxValue}>
        <div
          className={fillClasses}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
