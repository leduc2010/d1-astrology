import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useReducedMotion } from '../theme/DesignSystemProvider';
import { OrtusAlpha } from '../theme/alpha';
import { OrtusColors as c } from '../theme/colors';
import { OrtusSizes, OrtusStroke } from '../theme/dimens';
import { OrtusMotion } from '../theme/motion';
import { Palette, withAlpha } from '../theme/palette';

const ARC_SWEEP = 100;
const FULL_TURN = 360;

/** SVG arc from 0 deg (3 o'clock) clockwise by [sweep] degrees on a circle of radius [r]. */
function arcPath(center: number, r: number, sweep: number): string {
  const end = (sweep * Math.PI) / 180;
  const x = center + r * Math.cos(end);
  const y = center + r * Math.sin(end);
  return `M ${center + r} ${center} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x} ${y}`;
}

/** Small gold arc turning on a faint track ("running" step). Holds still under reduced motion. */
export function OrtusSpinner({ size = OrtusSizes.spinner, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const turn = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(turn);
      turn.set(0);
      return;
    }
    turn.set(0);
    turn.set(withRepeat(withTiming(FULL_TURN, { duration: OrtusMotion.CEREMONIAL, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(turn);
  }, [reduced, turn]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get()}deg` }] }));

  const stroke = OrtusStroke.spinner;
  const center = size / 2;
  const r = (size - stroke) / 2;
  return (
    <Animated.View
      style={[{ width: size, height: size }, spin, style]}
      accessibilityRole="progressbar"
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={center} cy={center} r={r} stroke={withAlpha(Palette.Gold, OrtusAlpha.SPINNER_TRACK)} strokeWidth={stroke} fill="none" />
        <Path d={arcPath(center, r, ARC_SWEEP)} stroke={c.accent} strokeWidth={stroke} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ svg: { overflow: 'visible' } });
