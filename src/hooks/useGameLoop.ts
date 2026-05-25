/**
 * useGameLoop - requestAnimationFrame-based game loop hook
 * 
 * Provides a stable 60fps game loop that calls the provided callback
 * with delta time on each frame. Automatically pauses when the tab
 * is hidden and cleans up on unmount.
 */
import { useEffect, useRef, useCallback } from 'react';

interface GameLoopOptions {
  /** Called every frame with delta time in seconds */
  onTick: (deltaTime: number) => void;
  /** Whether the loop is running */
  running: boolean;
  /** Max delta time to prevent spiral of death (default: 0.1s) */
  maxDelta?: number;
}

export function useGameLoop({ onTick, running, maxDelta = 0.1 }: GameLoopOptions) {
  const rafId = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const tickRef = useRef(onTick);

  // Keep callback ref fresh without re-triggering loop restart
  useEffect(() => {
    tickRef.current = onTick;
  }, [onTick]);

  const loop = useCallback((timestamp: number) => {
    if (lastTime.current === 0) {
      lastTime.current = timestamp;
    }

    const rawDelta = (timestamp - lastTime.current) / 1000; // Convert to seconds
    const deltaTime = Math.min(rawDelta, maxDelta); // Clamp to prevent spiral of death
    lastTime.current = timestamp;

    tickRef.current(deltaTime);

    rafId.current = requestAnimationFrame(loop);
  }, [maxDelta]);

  useEffect(() => {
    if (running) {
      lastTime.current = 0; // Reset on start
      rafId.current = requestAnimationFrame(loop);
    } else {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
    }

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
    };
  }, [running, loop]);
}
