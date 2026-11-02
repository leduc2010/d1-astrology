import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { OrtusMotion } from '../theme/motion';
import { useReducedMotion } from '../theme/DesignSystemProvider';

/**
 * Gentle press-in (Kotlin `Modifier.pressScale`). Spread `onPressIn`/`onPressOut` on the pressable
 * and put `style` on the outer (unclipped) view so the whole shape sinks. Runs on the UI thread;
 * stays still under reduced motion or when [enabled] is false.
 */
export function usePressScale(enabled = true) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const active = enabled && !reduced;

  const onPressIn = useCallback(() => {
    if (active) scale.set(withTiming(OrtusMotion.PRESSED_SCALE, OrtusMotion.quick()));
  }, [active, scale]);

  const onPressOut = useCallback(() => {
    scale.set(withTiming(1, OrtusMotion.quick()));
  }, [scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return { style, onPressIn, onPressOut };
}
