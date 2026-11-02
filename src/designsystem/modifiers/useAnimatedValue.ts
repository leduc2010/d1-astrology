import { useEffect } from 'react';
import { useSharedValue, withTiming, type SharedValue, type WithTimingConfig } from 'react-native-reanimated';

import { useReducedMotion } from '../theme/DesignSystemProvider';
import { OrtusMotion } from '../theme/motion';

type MotionSpec = (reduced?: boolean) => WithTimingConfig;

/**
 * A shared value that eases to [target] whenever it changes (Compose `animateFloatAsState`).
 * [spec] is one of the `OrtusMotion` spec helpers; it snaps under reduced motion. Pair it with
 * `interpolateColor` for `animateColorAsState`.
 */
export function useAnimatedValue(target: number, spec: MotionSpec = OrtusMotion.standard): SharedValue<number> {
  const reduced = useReducedMotion();
  const value = useSharedValue(target);
  useEffect(() => {
    value.set(withTiming(target, spec(reduced)));
  }, [target, reduced, spec, value]);
  return value;
}
