import React, { useEffect } from 'react';
import { useAchievementStore } from '../../store/achievementStore';
import * as Lucide from 'lucide-react';
import './AchievementToast.css';

export const DynamicLucideIcon: React.FC<{ name: string; className?: string; size?: number }> = ({
  name,
  className = '',
  size = 24,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Lucide as any)[name];
  if (!IconComponent) {
    return <Lucide.Award className={`lucide-icon ${className}`} size={size} />;
  }
  return <IconComponent className={`lucide-icon ${className}`} size={size} />;
};

interface ToastItemProps {
  id: string;
  name: string;
  description: string;
  rarity: string;
  icon: string;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ id, name, description, rarity, icon, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`achievement-toast achievement-toast--${rarity}`} id={`toast-${id}`}>
      <div className="achievement-toast__icon-container">
        <DynamicLucideIcon name={icon} className="achievement-toast__icon" size={24} />
      </div>
      <div className="achievement-toast__content">
        <span className="achievement-toast__label">Achievement Unlocked!</span>
        <h4 className="achievement-toast__name">{name}</h4>
        <p className="achievement-toast__desc">{description}</p>
      </div>
      <div className="achievement-toast__rarity-badge">
        {rarity.toUpperCase()}
      </div>
    </div>
  );
};

export const AchievementToastContainer: React.FC = () => {
  const toasts = useAchievementStore((s) => s.toasts);
  const removeToast = useAchievementStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="achievement-toast-container" id="achievement-toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          name={toast.name}
          description={toast.description}
          rarity={toast.rarity}
          icon={toast.icon}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
