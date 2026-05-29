import React, { useState, useEffect, useCallback } from 'react';
import Button from '../common/Button';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './TutorialOverlay.css';

interface TutorialStep {
  title: string;
  text: string;
  selector: string | null;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '✨ Welcome to Chromatica! ✨',
    text: 'Welcome, Apprentice! In this shop, you will master the art of color alchemy. Clients will request potions of exact hues, and it is your job to brew them.',
    selector: null,
  },
  {
    title: '🧙 Meet Your Client',
    text: 'Your current customer and their color order are shown here. Pay attention to their type, patience timer, and accuracy threshold! Different client types have different demands.',
    selector: '.client-card',
  },
  {
    title: '⚗️ Mix Your Potion',
    text: 'Adjust the amounts (0-10) of the 8 base alchemical ingredients. Each addition will dynamically update your potion\'s mixed color.',
    selector: '.color-mixer',
  },
  {
    title: '🎨 Subtractive Color Theory',
    text: 'Remember: potion colors use Subtractive mixing (Kubelka-Munk physics), not digital RGB light. Just like mixing real paint, combining pigments will make the potion darker!',
    selector: null,
  },
  {
    title: '✅ Submit and Earn Points',
    text: 'Once you are satisfied with your mixture, tap "Submit Potion" to check its accuracy. Match the target color as closely as possible to earn points and combo streak bonuses!',
    selector: '#mixer-submit-btn',
  },
  {
    title: '🧪 Reputation and Satisfaction',
    text: 'Keep your customer satisfaction high! Serving wrong potions or letting the timer run out will drain your shop\'s reputation. If satisfaction hits 0%, it is game over.',
    selector: '#satisfaction-bar',
  },
];

interface TutorialOverlayProps {
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties | null>(null);
  const { containerRef, handleKeyDown } = useFocusTrap<HTMLDivElement>(true);

  const updateSpotlight = useCallback(() => {
    const step = TUTORIAL_STEPS[currentStep];
    if (!step.selector) {
      setSpotlightStyle(null);
      return;
    }

    const element = document.querySelector(step.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 10;
      setSpotlightStyle({
        top: `${rect.top + window.scrollY - padding}px`,
        left: `${rect.left + window.scrollX - padding}px`,
        width: `${rect.width + padding * 2}px`,
        height: `${rect.height + padding * 2}px`,
      });
    } else {
      setSpotlightStyle(null);
    }
  }, [currentStep]);

  useEffect(() => {
    // Initial delay to let GameScreen render first
    const timer = setTimeout(updateSpotlight, 100);
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [currentStep, updateSpotlight]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('chromatica-tutorial', 'true');
    onClose();
  };

  const stepInfo = TUTORIAL_STEPS[currentStep];

  // Determine where to place the tutorial instruction box
  // If the spotlight is active on the left side, we put the box on the right side
  let boxPositionClass = 'tutorial-overlay__box--center';
  if (stepInfo.selector) {
    if (stepInfo.selector === '.client-card') {
      boxPositionClass = 'tutorial-overlay__box--right';
    } else if (stepInfo.selector === '.color-mixer' || stepInfo.selector === '#mixer-submit-btn') {
      boxPositionClass = 'tutorial-overlay__box--left';
    } else if (stepInfo.selector === '#satisfaction-bar') {
      boxPositionClass = 'tutorial-overlay__box--top';
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      className="tutorial-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial"
    >
      {/* Background Mask */}
      <div className="tutorial-overlay__mask" />

      {/* Spotlight highlight */}
      {spotlightStyle && (
        <div className="tutorial-overlay__spotlight" style={spotlightStyle} />
      )}

      {/* Tutorial Dialog Box */}
      <div className={`tutorial-overlay__box ${boxPositionClass}`}>
        <h2 className="tutorial-overlay__title">{stepInfo.title}</h2>
        <p className="tutorial-overlay__text">{stepInfo.text}</p>

        {/* Navigation */}
        <div className="tutorial-overlay__nav">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          {/* Step Progress Dots */}
          <div className="tutorial-overlay__dots">
            {TUTORIAL_STEPS.map((_, i) => (
              <span
                key={i}
                className={`tutorial-overlay__dot ${
                  currentStep === i ? 'tutorial-overlay__dot--active' : ''
                }`}
                onClick={() => setCurrentStep(i)}
              />
            ))}
          </div>

          <Button variant="primary" size="sm" onClick={handleNext}>
            {currentStep === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>

        {/* Always visible skip button */}
        <button className="tutorial-overlay__skip" onClick={handleComplete}>
          Skip Tutorial
        </button>
      </div>
    </div>
  );
};
