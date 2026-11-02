import { type ReactNode, useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { OrtusMotion, useReducedMotion } from '../../designsystem';

/** Items past this index appear together, so long lists never feel slow. */
export const MAX_STAGGERED_ITEMS = 8;

const HIDDEN = 0;
const SHOWN = 1;

/** Start delay of item [index] in a cascade (Kotlin `STAGGER * index.coerceIn(0, 8)`). */
export const revealDelay = (index: number): number =>
  OrtusMotion.STAGGER * Math.min(Math.max(Math.trunc(index), 0), MAX_STAGGERED_ITEMS);

/**
 * Animated style that fades an item in while it rises slightly into place, delayed by its
 * [index] so siblings cascade. Runs once on mount; visible from the first frame under reduced
 * motion. Only opacity and transform change, so the animation never re-lays-out (as the Kotlin
 * placement-layer modifier).
 */
export function useReveal(index = 0) {
  const reduced = useReducedMotion();
  // Read once on mount, like the modifier node's onAttach.
  const progress = useSharedValue(reduced ? SHOWN : HIDDEN);
  useEffect(() => {
    if (progress.value === SHOWN) return;
    progress.value = withDelay(revealDelay(index), withTiming(SHOWN, OrtusMotion.emphasized()));
    // Mount-only on purpose: a later index change must not replay the reveal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (SHOWN - progress.value) * OrtusMotion.revealRise }],
  }));
}

export type RevealProps = {
  index?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Wraps [children] in [useReveal]; the RN form of Compose `Modifier.revealOnEnter(index)`. */
export function Reveal({ index = 0, style, children }: RevealProps) {
  const reveal = useReveal(index);
  return <Animated.View style={[style, reveal]}>{children}</Animated.View>;
}
