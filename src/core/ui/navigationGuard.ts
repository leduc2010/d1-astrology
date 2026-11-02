import { useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Wraps a navigation callback so it only runs while this screen is focused. A second tap during
 * the transition out (the screen already lost focus) is dropped, so it can't open a page twice or
 * pop past the previous one. Focus is read from the navigator at call time, not from the last
 * render, because both taps can land before React re-renders.
 */
export function useResumedOnly<A extends unknown[]>(block: (...args: A) => void): (...args: A) => void {
  const navigation = useNavigation();
  const current = useRef(block);
  useLayoutEffect(() => {
    current.current = block;
  });
  return useCallback(
    (...args: A) => {
      if (navigation.isFocused()) current.current(...args);
    },
    [navigation],
  );
}
