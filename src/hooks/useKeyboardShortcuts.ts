import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  enabled: boolean;
  onPause: () => void;
  onSkipFeedback: () => void;
}

export function useKeyboardShortcuts({
  enabled,
  onPause,
  onSkipFeedback,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Keys 1-8: focus/select ingredient by index
      if (e.key >= '1' && e.key <= '8') {
        const index = parseInt(e.key, 10) - 1;
        const ingredients = document.querySelectorAll<HTMLElement>('.color-mixer__ingredient');
        if (ingredients[index]) {
          e.preventDefault();
          ingredients[index].focus();
        }
      }

      // ArrowUp / ArrowDown: adjust selected ingredient
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const active = document.activeElement;
        if (active && active.classList.contains('color-mixer__ingredient')) {
          e.preventDefault();
          const selector = e.key === 'ArrowUp' ? 'button[aria-label^="Increase"]' : 'button[aria-label^="Decrease"]';
          const btn = active.querySelector(selector) as HTMLButtonElement | null;
          if (btn && !btn.disabled) {
            btn.click();
          }
        }
      }

      // Enter: submit potion
      if (e.key === 'Enter') {
        e.preventDefault();
        const btn = document.getElementById('mixer-submit-btn') as HTMLButtonElement | null;
        if (btn && !btn.disabled) {
          btn.click();
        }
      }

      // r / R: reset mixer
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        const btn = document.getElementById('mixer-reset-btn') as HTMLButtonElement | null;
        if (btn && !btn.disabled) {
          btn.click();
        }
      }

      // Escape: pause game
      if (e.key === 'Escape') {
        e.preventDefault();
        onPause();
      }

      // Space: skip feedback animation
      if (e.key === ' ') {
        e.preventDefault();
        onSkipFeedback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onPause, onSkipFeedback]);
}
