import { useEffect, useRef } from 'react';

export function useFocusTrap<T extends HTMLElement>(isOpen: boolean) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        if (containerRef.current) {
          const focusables = containerRef.current.querySelectorAll<HTMLElement>(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
          );
          if (focusables.length > 0) {
            focusables[0].focus();
          } else {
            containerRef.current.focus();
          }
        }
      }, 50);

      return () => clearTimeout(timer);
    } else {
      if (previouslyFocusedRef.current) {
        // Delay focus restoration slightly to ensure DOM updates don't reset it
        const restoreTimer = setTimeout(() => {
          previouslyFocusedRef.current?.focus();
        }, 50);
        return () => clearTimeout(restoreTimer);
      }
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<T>) => {
    if (e.key !== 'Tab' || !containerRef.current) return;

    const focusables = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
      )
    );

    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  return { containerRef, handleKeyDown };
}
