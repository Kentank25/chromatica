import React, { useState, useCallback } from 'react';
import { audioManager } from '../../audio/AudioManager';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  id?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  id,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  icon,
  children,
  className = '',
  type = 'button',
}) => {
  const [springActive, setSpringActive] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      audioManager.playSFX('uiClick');
      setSpringActive(true);
      setTimeout(() => setSpringActive(false), 400);
      onClick?.(e);
    },
    [disabled, onClick],
  );

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      audioManager.playSFX('uiHover');
    }
  }, [disabled]);

  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    springActive ? 'btn--spring' : '',
    disabled ? 'btn--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      id={id}
      type={type}
      className={classes}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;

