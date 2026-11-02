import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import {
  OrtusColors as c,
  OrtusMotion,
  OrtusRadii,
  OrtusSizes,
  OrtusSpacing,
  OrtusText,
  useReducedMotion,
} from '@/designsystem';
import { useT } from '@/i18n';

const NAME_WEIGHT = 0.28;
const PERCENT = 100;

export type CountBarProps = {
  name: string;
  count: number;
  /** The largest count on the card, which fills the bar. */
  most: number;
  index: number;
  color: string;
};

/** One element's share as "name — bar — count", the bar growing in on first show, staggered by [index]. */
export function CountBar({ name, count, most, index, color }: CountBarProps) {
  const { tf } = useT();
  const reduced = useReducedMotion();
  const fraction = count / Math.max(most, 1);
  const progress = useSharedValue(0);
  useEffect(() => {
    const spec = OrtusMotion.emphasized(reduced);
    progress.set(reduced ? fraction : withDelay(index * OrtusMotion.STAGGER, withTiming(fraction, spec)));
  }, [fraction, index, progress, reduced]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.get() * PERCENT}%` }));

  return (
    <View style={styles.row} accessible accessibilityLabel={tf('charts_count', name, count)}>
      <OrtusText variant="caption" color={c.textBody} style={styles.name}>
        {name}
      </OrtusText>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, fill]} />
      </View>
      <OrtusText variant="captionStrong" color={c.textPrimary}>
        {String(count)}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.sm },
  name: { flex: NAME_WEIGHT },
  track: {
    flex: 1,
    height: OrtusSizes.balanceBar,
    borderRadius: OrtusRadii.pill,
    overflow: 'hidden',
    backgroundColor: c.insetContainer,
  },
  fill: { height: '100%', borderRadius: OrtusRadii.pill },
});
