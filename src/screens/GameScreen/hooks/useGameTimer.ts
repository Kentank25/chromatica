import { useEffect, useRef } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { useGameLoop } from '../../../hooks/useGameLoop';
import { PERK_POOL } from '../../../engine/perksManager';
import type { Client } from '../../../types/game.types';

interface UseGameTimerProps {
  currentClient: Client | null;
  running: boolean;
  onTimeout: () => void;
}

export function useGameTimer({ currentClient, running, onTimeout }: UseGameTimerProps) {
  const setTimeRemaining = useGameStore((s) => s.setTimeRemaining);
  const localTimeRef = useRef(0);
  const lastStoreUpdate = useRef(0);

  const currentClientId = currentClient?.id;

  // Synchronize local timer reference when currentClient changes (only on client ID change)
  useEffect(() => {
    if (currentClient) {
      const activePerks = useGameStore.getState().activePerks || [];
      let patienceMult = 1.0;
      for (const perkId of activePerks) {
        const perk = PERK_POOL.find((p) => p.id === perkId);
        if (perk && perk.patienceMultiplier) {
          patienceMult *= perk.patienceMultiplier;
        }
      }
      const actualPatience = currentClient.modifiers.patience * patienceMult;
      localTimeRef.current = actualPatience;
      setTimeRemaining(actualPatience);
    }
  }, [currentClientId, currentClient, setTimeRemaining]);

  // Timer countdown with throttled store updates
  useGameLoop({
    onTick: (dt) => {
      localTimeRef.current -= dt;
      if (localTimeRef.current <= 0) {
        localTimeRef.current = 0;
        setTimeRemaining(0);
        onTimeout();
      } else {
        // Throttle store writes to 10fps
        const now = performance.now();
        if (now - lastStoreUpdate.current >= 100) {
          setTimeRemaining(localTimeRef.current);
          lastStoreUpdate.current = now;
        }
      }
    },
    running,
  });

  return localTimeRef;
}
export default useGameTimer;
