import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

import { UiCue } from '../feedback/UiFeedback';
import { OrtusPressable } from '../modifiers/OrtusPressable';
import { useAnimatedValue } from '../modifiers/useAnimatedValue';
import { OrtusColors as c } from '../theme/colors';
import { OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusGradients } from '../theme/gradients';
import { OrtusRadii } from '../theme/shapes';
import { RadioDot } from './Sheets';

export type OrtusChoiceCardProps = {
  selected: boolean;
  onPress: () => void;
  /** Read as the radio's name when the content alone is not enough. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Laid out in a row after the radio dot. */
  children?: ReactNode;
};

/**
 * A card picked from a small set, such as a subscription plan: radio dot, then the content. The
 * picked card takes the glow gradient and a gold border; the border fades rather than snaps.
 */
export function OrtusChoiceCard({ selected, onPress, accessibilityLabel, style, testID, children }: OrtusChoiceCardProps) {
  const progress = useAnimatedValue(selected ? 1 : 0);
  const border = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.get(), [0, 1], [c.cardBorder, c.accent]),
  }));
  return (
    <OrtusPressable
      onPress={onPress}
      cue={UiCue.Select}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      outerStyle={[styles.outer, style]}
      style={[styles.card, selected ? styles.selected : styles.idle]}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.border, border]} />
      <RadioDot selected={selected} />
      {children}
    </OrtusPressable>
  );
}

const styles = StyleSheet.create({
  outer: { alignSelf: 'stretch', borderRadius: OrtusRadii.card },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OrtusSpacing.sm,
    borderRadius: OrtusRadii.card,
    paddingHorizontal: OrtusSpacing.lg,
    paddingVertical: OrtusSpacing.md,
  },
  selected: { backgroundImage: OrtusGradients.glowCard },
  idle: { backgroundColor: c.surface },
  border: { borderRadius: OrtusRadii.card, borderWidth: OrtusStroke.hairline },
});
