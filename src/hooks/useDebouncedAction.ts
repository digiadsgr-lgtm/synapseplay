import { useCallback, useRef } from 'react';

export const ANTI_FRUSTRATION_DEBOUNCE_MS = 400;

/**
 * Anti-Frustration Input Hook:
 * Prevents accidental rapid double-taps within 400ms without locking or freezing the screen.
 * Tracks absorbed rapid taps so activities can log them without penalizing the child.
 */
export function useDebouncedAction(debounceMs: number = ANTI_FRUSTRATION_DEBOUNCE_MS) {
  const lastActionRef = useRef<number>(0);
  const absorbedCountRef = useRef<number>(0);

  const runDebounced = useCallback(
    (action: () => void): boolean => {
      const now = Date.now();
      if (now - lastActionRef.current < debounceMs) {
        absorbedCountRef.current += 1;
        return false;
      }
      lastActionRef.current = now;
      action();
      return true;
    },
    [debounceMs]
  );

  const resetDebounce = useCallback(() => {
    lastActionRef.current = 0;
  }, []);

  const getAbsorbedCount = useCallback(() => absorbedCountRef.current, []);

  return {
    runDebounced,
    resetDebounce,
    getAbsorbedCount,
  };
}
