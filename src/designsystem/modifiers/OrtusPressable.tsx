import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { UiCue } from '../feedback/UiFeedback';
import { Palette, withAlpha } from '../theme/palette';
import { usePressScale } from './usePressScale';
import { useCuePress } from './useCuePress';

/** Ripple tinted with the accent (Kotlin theme ripple = accentLight). */
export const ORTUS_RIPPLE = { color: withAlpha(Palette.GoldLight, 0.1), borderless: false } as const;

export type OrtusPressableProps = Omit<PressableProps, 'style' | 'onPress' | 'children' | 'android_ripple'> & {
  onPress?: () => void;
  /** Cue played before [onPress]; null for none (Kotlin `ortusClickable(cue = ...)`). */
  cue?: UiCue | null;
  /** Sink slightly while pressed (Kotlin `pressScale`). */
  pressScale?: boolean;
  /** Unclipped outer box: size, margins, glow and the press scale live here. */
  outerStyle?: StyleProp<ViewStyle>;
  /** Clipped inner box: shape, background, border and padding live here. */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * The one way to make something tappable (Kotlin `ortusClickable` + `pressScale`): ripple,
 * one UI cue, optional press-in. The outer view never clips so glows stay visible.
 */
export function OrtusPressable({
  onPress,
  cue = UiCue.Tap,
  pressScale = false,
  outerStyle,
  style,
  disabled,
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  children,
  ...rest
}: OrtusPressableProps) {
  const press = usePressScale(pressScale && !disabled);
  const handlePress = useCuePress(onPress, cue);
  return (
    <Animated.View style={[outerStyle, pressScale && press.style]}>
      <Pressable
        accessibilityRole={accessibilityRole}
        {...rest}
        disabled={disabled}
        android_ripple={ORTUS_RIPPLE}
        onPress={handlePress}
        onPressIn={(e) => {
          press.onPressIn();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          press.onPressOut();
          onPressOut?.(e);
        }}
        style={[styles.clip, style]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', flexGrow: 1 },
});
