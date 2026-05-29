import React from 'react';
import * as Lucide from 'lucide-react';

// Common interface for icon components supporting standard SVG properties and classNames
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
}

const createIcon = (IconComponent: React.ComponentType<any>) => {
  const WrappedIcon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ className = '', size = 18, strokeWidth = 2, ...props }, ref) => {
      // By default size is set to 18px (matching --icon-size-base),
      // but className (e.g. icon--xs, icon--lg) can override it via CSS.
      return (
        <IconComponent
          ref={ref}
          className={`lucide-icon ${className}`}
          size={size}
          strokeWidth={strokeWidth}
          {...props}
        />
      );
    }
  );
  
  WrappedIcon.displayName = `Icon(${IconComponent.displayName || IconComponent.name || 'Component'})`;
  return WrappedIcon;
};

// Client Avatars
export const WizardIcon = createIcon(Lucide.Wand2);
export const ZombieIcon = createIcon(Lucide.Skull);
export const VillagerIcon = createIcon(Lucide.User);
export const NobleIcon = createIcon(Lucide.Crown);
export const AlchemistIcon = createIcon(Lucide.FlaskConical);

// Client Expressions
export const NeutralExpression = createIcon(Lucide.Meh);
export const HappyExpression = createIcon(Lucide.Smile);
export const EcstaticExpression = createIcon(Lucide.Laugh);
export const AnnoyedExpression = createIcon(Lucide.Frown);
export const EnragedExpression = createIcon(Lucide.Angry);

// Combo Tiers
export const ComboTier1Icon = createIcon(Lucide.Sparkles);
export const ComboTier2Icon = createIcon(Lucide.Flame);
export const ComboTier3Icon = createIcon(Lucide.Zap);

// Token Types
export const SkipTokenIcon = createIcon(Lucide.SkipForward);
export const HintTokenIcon = createIcon(Lucide.Eye);
export const AutoCorrectTokenIcon = createIcon(Lucide.FlaskConical);

// UI Controls
export const PlayIcon = createIcon(Lucide.Play);
export const PauseIcon = createIcon(Lucide.Pause);
export const RestartIcon = createIcon(Lucide.RotateCcw);
export const ResetIcon = createIcon(Lucide.Undo2);
export const QuitIcon = createIcon(Lucide.LogOut);
export const BackIcon = createIcon(Lucide.ChevronLeft);
export const MoreIcon = createIcon(Lucide.ChevronUp);
export const LessIcon = createIcon(Lucide.ChevronDown);
export const SubmitPotionIcon = createIcon(Lucide.FlaskConical);

// Labels & Decorations
export const PotionIcon = createIcon(Lucide.TestTubes);
export const TimerIcon = createIcon(Lucide.Hourglass);
export const MusicIcon = createIcon(Lucide.Music);
export const VolumeIcon = createIcon(Lucide.Volume2);
export const MutedIcon = createIcon(Lucide.VolumeX);
export const SettingsIcon = createIcon(Lucide.Settings);
export const HelpIcon = createIcon(Lucide.HelpCircle);

// Content & Thematic
export const TrophyIcon = createIcon(Lucide.Trophy);
export const ApprenticeIcon = createIcon(Lucide.Sprout);
export const ColorTheoryIcon = createIcon(Lucide.Palette);
export const CheckIcon = createIcon(Lucide.CheckCircle);
export const MedalIcon = createIcon(Lucide.Medal);
export const SparkleIcon = createIcon(Lucide.Sparkles);
export const FailIcon = createIcon(Lucide.Wind);

// Tutorial Specific
export const WelcomeIcon = createIcon(Lucide.Sparkles);
export const MeetClientIcon = createIcon(Lucide.Wand2);
export const MixPotionIcon = createIcon(Lucide.FlaskConical);
export const ReputationIcon = createIcon(Lucide.TestTubes);
