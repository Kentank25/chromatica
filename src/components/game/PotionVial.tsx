import React from 'react';
import { rgbToCssString } from '../../utils/colorUtils';
import type { RGB } from '../../types/color.types';
import type { PotionEffect } from '../../types/game.types';
import './PotionVial.css';

interface PotionVialProps {
  color: RGB;
  fillLevel?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  animated?: boolean;
  className?: string;
  isMystic?: boolean;
  effect?: PotionEffect;
}

const SIZE_MAP = { sm: 80, md: 120, lg: 160 };

export const PotionVial = React.memo<PotionVialProps>(({
  color,
  fillLevel = 0.7,
  size = 'md',
  label,
  animated = true,
  className = '',
  isMystic = false,
  effect = null,
}) => {
  const cssColor = isMystic ? 'rgba(186, 104, 200, 0.5)' : rgbToCssString(color);
  const px = SIZE_MAP[size];
  const fillH = Math.round(fillLevel * 60); // percentage of the vial body

  return (
    <div className={`potion-vial potion-vial--${size} ${className}`} style={{ width: px, height: px * 1.6 }}>
      <svg viewBox="0 0 100 160" className="potion-vial__svg" xmlns="http://www.w3.org/2000/svg">
        {/* Glow filter */}
        <defs>
          <radialGradient id="luminous-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
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
            opacity={isMystic ? "0.3" : "0.85"}
          />
          {/* Liquid surface highlight */}
          <ellipse cx="50" cy={150 - fillH * 1.75} rx="20" ry="3" fill={cssColor} opacity={isMystic ? "0.2" : "0.6"} />
          
          {/* Bubbles */}
          {animated && !effect && (
            <>
              <circle className="potion-vial__bubble potion-vial__bubble--1" cx="40" cy="140" r="2" fill="rgba(255,255,255,0.3)" />
              <circle className="potion-vial__bubble potion-vial__bubble--2" cx="55" cy="135" r="1.5" fill="rgba(255,255,255,0.25)" />
              <circle className="potion-vial__bubble potion-vial__bubble--3" cx="48" cy="130" r="2.5" fill="rgba(255,255,255,0.2)" />
            </>
          )}

          {isMystic && (
            <text
              x="50"
              y="110"
              textAnchor="middle"
              fill="rgba(186, 104, 200, 0.7)"
              fontSize="36"
              fontFamily="'Cinzel', serif"
              fontWeight="bold"
              style={{ filter: 'drop-shadow(0 0 5px rgba(186, 104, 200, 0.5))' }}
            >
              ?
            </text>
          )}

          {/* Active Potion Effect Overlays */}
          {effect === 'luminous' && (
            <>
              <circle cx="50" cy="100" r="30" fill="url(#luminous-glow)" opacity="0.15" />
              <circle className="potion-effect__lumi-particle potion-effect__lumi-particle--1" cx="45" cy="100" r="2" fill="#fff" />
              <circle className="potion-effect__lumi-particle potion-effect__lumi-particle--2" cx="55" cy="120" r="1.2" fill="#fff" />
              <circle className="potion-effect__lumi-particle potion-effect__lumi-particle--3" cx="38" cy="110" r="1.6" fill="#fff" />
              <circle className="potion-effect__lumi-particle potion-effect__lumi-particle--4" cx="62" cy="90" r="1.5" fill="#fff" />
            </>
          )}

          {effect === 'vivid' && (
            <>
              <circle cx="50" cy="100" r="25" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" className="potion-effect__vivid-ring" />
              <circle className="potion-effect__vivid-sparkle potion-effect__vivid-sparkle--1" cx="36" cy="90" r="1.5" fill="#ffd700" />
              <circle className="potion-effect__vivid-sparkle potion-effect__vivid-sparkle--2" cx="64" cy="95" r="1.5" fill="#ff007f" />
              <circle className="potion-effect__vivid-sparkle potion-effect__vivid-sparkle--3" cx="42" cy="120" r="2" fill="#00ffff" />
              <circle className="potion-effect__vivid-sparkle potion-effect__vivid-sparkle--4" cx="58" cy="80" r="1" fill="#7fff00" />
            </>
          )}

          {effect === 'muted' && (
            <>
              <circle className="potion-effect__muted-dust potion-effect__muted-dust--1" cx="45" cy="95" r="1.5" fill="#e0e0e0" opacity="0.5" />
              <circle className="potion-effect__muted-dust potion-effect__muted-dust--2" cx="56" cy="115" r="1" fill="#c0c0c0" opacity="0.4" />
              <circle className="potion-effect__muted-dust potion-effect__muted-dust--3" cx="38" cy="85" r="1.2" fill="#dcdcdc" opacity="0.4" />
              <circle className="potion-effect__muted-dust potion-effect__muted-dust--4" cx="62" cy="105" r="1" fill="#a9a9a9" opacity="0.35" />
            </>
          )}

          {effect === 'warm' && (
            <>
              <circle className="potion-effect__warm-ember potion-effect__warm-ember--1" cx="43" cy="120" r="1.5" fill="#ff4500" />
              <circle className="potion-effect__warm-ember potion-effect__warm-ember--2" cx="57" cy="105" r="1.0" fill="#ff8c00" />
              <circle className="potion-effect__warm-ember potion-effect__warm-ember--3" cx="48" cy="90" r="1.3" fill="#ffcc00" />
              <circle className="potion-effect__warm-ember potion-effect__warm-ember--4" cx="52" cy="115" r="1" fill="#ff3300" />
            </>
          )}

          {effect === 'cool' && (
            <>
              <circle className="potion-effect__cool-frost potion-effect__cool-frost--1" cx="42" cy="75" r="1.5" fill="#e0ffff" />
              <circle className="potion-effect__cool-frost potion-effect__cool-frost--2" cx="58" cy="95" r="1" fill="#87cefa" />
              <circle className="potion-effect__cool-frost potion-effect__cool-frost--3" cx="47" cy="115" r="1.6" fill="#b0e0e6" />
              <circle className="potion-effect__cool-frost potion-effect__cool-frost--4" cx="53" cy="85" r="1.2" fill="#ffffff" />
            </>
          )}
        </g>

        {/* Shadowy Wisps (rendered outside liquid clip path to allow rising out of vial) */}
        {effect === 'shadowy' && (
          <>
            <path className="potion-effect__shadow-wisp potion-effect__shadow-wisp--1" d="M45,130 Q35,90 48,50 T40,15" fill="none" stroke="#2c004d" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="30" strokeDashoffset="0" opacity="0.5" />
            <path className="potion-effect__shadow-wisp potion-effect__shadow-wisp--2" d="M55,120 Q65,80 52,45 T60,20" fill="none" stroke="#16002b" strokeWidth="2" strokeLinecap="round" strokeDasharray="25" strokeDashoffset="0" opacity="0.55" />
          </>
        )}

        {/* Glass highlight */}
        <path d="M35,50 L35,120 Q35,135 42,140" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Glow effect */}
      <div
        className="potion-vial__glow"
        style={
          isMystic
            ? {
                backgroundColor: 'rgba(186, 104, 200, 0.4)',
                boxShadow: '0 0 20px rgba(186, 104, 200, 0.2), 0 0 40px rgba(186, 104, 200, 0.1)',
              }
            : {
                backgroundColor: cssColor,
                boxShadow: effect === 'luminous'
                  ? `0 0 40px rgba(255,255,255,0.6), 0 0 80px rgba(255,255,255,0.4)`
                  : effect === 'shadowy'
                  ? `0 0 35px rgba(44,0,77,0.8), 0 0 70px rgba(44,0,77,0.5)`
                  : `0 0 30px ${cssColor}, 0 0 60px ${cssColor}`,
              }
        }
      />

      {label && <span className="potion-vial__label">{label}</span>}
    </div>
  );
});
