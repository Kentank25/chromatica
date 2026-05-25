/**
 * useInput - Unified mouse/touch/keyboard input hook
 * 
 * Provides consistent input handling across devices by normalizing
 * touch and mouse events into a single interface.
 */
import { useEffect, useCallback, useRef } from 'react';

interface InputHandlers {
  onKeyDown?: (key: string, event: KeyboardEvent) => void;
  onKeyUp?: (key: string, event: KeyboardEvent) => void;
}

export function useInput({ onKeyDown, onKeyUp }: InputHandlers) {
  const handlersRef = useRef({ onKeyDown, onKeyUp });

  useEffect(() => {
    handlersRef.current = { onKeyDown, onKeyUp };
  }, [onKeyDown, onKeyUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handlersRef.current.onKeyDown?.(e.key, e);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      handlersRef.current.onKeyUp?.(e.key, e);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  /** Pause/unpause on Escape key */
  const useEscapeKey = useCallback((callback: () => void) => {
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          callback();
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [callback]);
  }, []);

  return { useEscapeKey };
}

/**
 * useEscapeKey - Simple hook to handle Escape key press
 */
export function useEscapeKey(callback: () => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        callbackRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
