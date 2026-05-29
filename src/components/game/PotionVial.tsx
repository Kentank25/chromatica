import React from 'react';
import { rgbToCssString } from '../../utils/colorUtils';
import type { RGB } from '../../types/color.types';
import './PotionVial.css';

interface PotionVialProps {
  color: RGB;
  fillLevel?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  animated?: boolean;
  className?: string;
}

const SIZE_MAP = { sm: 80, md: 120, lg: 160 };

export const PotionVial = React.memo<PotionVialProps>(({
  color,
  fillLevel = 0.7,
  size = 'md',
  label,
  animated = true,
  className = '',
}) => {
  const cssColor = rgbToCssString(color);
  const px = SIZE_MAP[size];
  const fillH = Math.round(fillLevel * 60); // percentage of the vial body

  return (
    <div className={`potion-vial potion-vial--${size} ${className}`} style={{ width: px, height: px * 1.6 }}>
      <svg viewBox="0 0 100 160" className="potion-vial__svg" xmlns="http://www.w3.org/2000/svg">
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${cssColor.replace(/[^a-z0-9]/g, '')}`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="vial-clip">
            <path d="M30,45 L30,130 Q30,150 50,150 Q70,150 70,130 L70,45 Z" />
          </clipPath>
        </defs>

        {/* Bottle neck */}
        <rect x="40" y="5" width="20" height="40" rx="3" fill="rgba(197,198,199,0.15)" stroke="rgba(197,198,199,0.3)" strokeWidth="1.5" />
        
        {/* Cork / stopper */}
        <rect x="38" y="0" width="24" height="10" rx="3" fill="rgba(139,90,43,0.6)" stroke="rgba(197,198,199,0.2)" strokeWidth="1" />

        {/* Bottle body */}
        <path d="M30,45 L30,130 Q30,150 50,150 Q70,150 70,130 L70,45 Z" fill="rgba(197,198,199,0.06)" stroke="rgba(197,198,199,0.25)" strokeWidth="1.5" />

        {/* Liquid fill */}
        <g clipPath="url(#vial-clip)">
          <rect
            x="30" y={150 - fillH * 1.75} width="40" height={fillH * 1.75}
            fill={cssColor}
            opacity="0.85"
          />
          {/* Liquid surface highlight */}
          <ellipse cx="50" cy={150 - fillH * 1.75} rx="20" ry="3" fill={cssColor} opacity="0.6" />
          
          {/* Bubbles */}
          {animated && (
            <>
              <circle className="potion-vial__bubble potion-vial__bubble--1" cx="40" cy="140" r="2" fill="rgba(255,255,255,0.3)" />
              <circle className="potion-vial__bubble potion-vial__bubble--2" cx="55" cy="135" r="1.5" fill="rgba(255,255,255,0.25)" />
              <circle className="potion-vial__bubble potion-vial__bubble--3" cx="48" cy="130" r="2.5" fill="rgba(255,255,255,0.2)" />
            </>
          )}
        </g>

        {/* Glass highlight */}
        <path d="M35,50 L35,120 Q35,135 42,140" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Glow effect */}
      <div className="potion-vial__glow" style={{ backgroundColor: cssColor, boxShadow: `0 0 30px ${cssColor}, 0 0 60px ${cssColor}` }} />

      {label && <span className="potion-vial__label">{label}</span>}
    </div>
  );
});
