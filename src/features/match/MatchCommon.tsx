import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PlaceholderSection } from '@/core/ui';
import { OrtusColors, OrtusGradients, OrtusMotion, OrtusRadii, OrtusSizes, useReducedMotion } from '@/designsystem';
import { axisFraction, type AxisLevel } from '@/engine';
import { useT } from '@/i18n';

/** Missing owner profile or a date outside the supported range. */
export function MatchNotice({ isMissingProfile, style }: { isMissingProfile: boolean; style?: StyleProp<ViewStyle> }) {
  const { tf } = useT();
  return isMissingProfile ? (
    <PlaceholderSection
      label={tf('match_no_profile_label')}
      title={tf('match_no_profile_title')}
      body={tf('match_no_profile_body')}
      style={style}
    />
  ) : (
    <PlaceholderSection
      label={tf('match_unavailable_label')}
      title={tf('match_unavailable_title')}
      body={tf('match_unavailable_body')}
      style={style}
    />
  );
}

/**
 * How present a synastry axis is, as a violet bar with no number on it: a level to read, not a
 * score. Fills slowly on first show unless motion is reduced.
 */
export function AxisBar({ level, style }: { level: AxisLevel; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const fraction = useSharedValue(0);
  const target = axisFraction(level);
  useEffect(() => {
    fraction.set(withTiming(target, OrtusMotion.ceremonial(reduced)));
  }, [fraction, target, reduced]);
  const fill = useAnimatedStyle(() => ({ width: `${fraction.get() * 100}%` }));
  return (
    <View style={[styles.track, style]}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: OrtusSizes.progressHeight,
    borderRadius: OrtusRadii.pill,
    overflow: 'hidden',
    backgroundColor: OrtusColors.surfaceRaised,
  },
  fill: {
    height: '100%',
    borderRadius: OrtusRadii.pill,
    backgroundImage: OrtusGradients.mysticBar,
  },
});
