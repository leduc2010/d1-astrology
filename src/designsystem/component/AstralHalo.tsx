import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type EasingFunction,
  type EasingFunctionFactory,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { useReducedMotion } from '../theme/DesignSystemProvider';
import { OrtusColors as c } from '../theme/colors';
import { OrtusSizes } from '../theme/dimens';
import { OrtusMotion } from '../theme/motion';
import { useSvgId } from './StarfieldBackground';

/** One concentric ring: diameter and stroke as fractions of the halo, plus its alpha. */
type Ring = { readonly diameter: number; readonly stroke: number; readonly alpha: number; readonly light?: boolean };

// Geometry from Figma S01-01/S01-08, as fractions of the halo size.
const RINGS: readonly Ring[] = [
  { diameter: 0.762, stroke: 0.0034, alpha: 0.3 },
  { diameter: 0.708, stroke: 0.0167, alpha: 0.28 },
  { diameter: 0.712, stroke: 0.0333, alpha: 0.75 },
  { diameter: 0.654, stroke: 0.0034, alpha: 0.35 },
  { diameter: 0.519, stroke: 0.0034, alpha: 0.18, light: true },
  { diameter: 0.362, stroke: 0.0034, alpha: 0.4 },
];
const MAIN_RING = RINGS[2];
const CORE_RADIUS = 0.13;
const NEBULA_PEAK = 0.6;
const GLINT_ORBIT = 0.44;
const GLINT_RADIUS = 0.009;
const GLINT_ANGLES = [18, 96, 161, 232, 301] as const;
const GLINT_ALPHAS = [1, 0.8, 0.9, 0.7, 1] as const;

/** Breathing amplitude of the nebula and core. */
const BREATH = 0.06;
const ORBIT_PERIOD = OrtusMotion.AMBIENT * 4;
const SWEEP_PERIOD = OrtusMotion.CEREMONIAL * 2;
const SWEEP_ANGLE = 70;
const FULL_TURN = 360;
const DEG = Math.PI / 180;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** An endless loop from 0 to [to]; stays at 0 when [running] is false. */
function useLoop(running: boolean, to: number, duration: number, easing: EasingFunction | EasingFunctionFactory, reverse: boolean) {
  const value = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(value);
    value.set(0);
    if (!running) return;
    value.set(withRepeat(withTiming(to, { duration, easing }), -1, reverse));
    return () => cancelAnimation(value);
  }, [running, to, duration, easing, reverse, value]);
  return value;
}

export type AstralHaloProps = {
  /** Square size in dp; defaults to `OrtusSizes.halo`. */
  size?: number;
  /** Adds a bright arc sweeping the main ring (work in progress). */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The astral mark: nebula glow, concentric gold rings and a soft star core, with glints drifting
 * slowly around it. Purely decorative (hidden from screen readers); motion stops under reduced motion.
 */
export function AstralHalo({ size = OrtusSizes.halo, active = false, style }: AstralHaloProps) {
  const reduced = useReducedMotion();
  const breath = useLoop(!reduced, 1, OrtusMotion.AMBIENT / 2, OrtusMotion.glide, true);
  const orbit = useLoop(!reduced, FULL_TURN, ORBIT_PERIOD, Easing.linear, false);
  const sweep = useLoop(!reduced && active, FULL_TURN, SWEEP_PERIOD, OrtusMotion.glide, false);
  const ids = { nebula: useSvgId('nebula'), core: useSvgId('core') };

  const d = size;
  // The nebula breathes past the square, as Compose draws without clipping; pad the canvas for it.
  const pad = (d * BREATH) / 2;
  const canvas = d + 2 * pad;
  const center = canvas / 2;

  const nebula = useAnimatedProps(() => ({ r: (d / 2) * (1 + BREATH * breath.get()) }));
  const core = useAnimatedProps(() => ({ r: d * CORE_RADIUS * (1 + BREATH * breath.get()) }));

  return (
    <View
      style={[{ width: d, height: d }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={canvas} height={canvas} style={[styles.canvas, { top: -pad, start: -pad }]}>
        <Defs>
          <RadialGradient id={ids.nebula}>
            <Stop offset={0} stopColor={c.nebula} stopOpacity={NEBULA_PEAK} />
            <Stop offset={1} stopColor={c.nebula} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={ids.core}>
            <Stop offset={0} stopColor={c.accentLight} stopOpacity={1} />
            <Stop offset={1} stopColor={c.accentLight} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <AnimatedCircle cx={center} cy={center} fill={`url(#${ids.nebula})`} animatedProps={nebula} />
        {RINGS.map((ring, i) => (
          <Circle
            key={i}
            cx={center}
            cy={center}
            r={(d * ring.diameter) / 2}
            fill="none"
            stroke={ring.light ? c.accentLight : c.accent}
            strokeOpacity={ring.alpha}
            strokeWidth={d * ring.stroke}
          />
        ))}
        {active ? <Sweep angle={sweep} d={d} center={center} /> : null}
        <AnimatedCircle cx={center} cy={center} fill={`url(#${ids.core})`} animatedProps={core} />
        {GLINT_ANGLES.map((base, i) => (
          <HaloGlint key={i} index={i} base={base} orbit={orbit} d={d} center={center} />
        ))}
      </Svg>
    </View>
  );
}

function Sweep({ angle, d, center }: { angle: SharedValue<number>; d: number; center: number }) {
  const radius = (d * MAIN_RING.diameter) / 2;
  const props = useAnimatedProps(() => {
    const from = angle.get() * DEG;
    const to = (angle.get() + SWEEP_ANGLE) * DEG;
    const x0 = center + radius * Math.cos(from);
    const y0 = center + radius * Math.sin(from);
    const x1 = center + radius * Math.cos(to);
    const y1 = center + radius * Math.sin(to);
    return { d: `M${x0} ${y0}A${radius} ${radius} 0 0 1 ${x1} ${y1}` };
  });
  return (
    <AnimatedPath
      fill="none"
      stroke={c.accentLight}
      strokeWidth={d * MAIN_RING.stroke}
      strokeLinecap="round"
      animatedProps={props}
    />
  );
}

type HaloGlintProps = { index: number; base: number; orbit: SharedValue<number>; d: number; center: number };

function HaloGlint({ index, base, orbit, d, center }: HaloGlintProps) {
  const orbitRadius = d * GLINT_ORBIT;
  const props = useAnimatedProps(() => {
    const rad = (base + orbit.get()) * DEG;
    return { cx: center + orbitRadius * Math.cos(rad), cy: center + orbitRadius * Math.sin(rad) };
  });
  return (
    <AnimatedCircle
      r={d * GLINT_RADIUS * (1 + (index % 2))}
      fill={c.starGlint}
      fillOpacity={GLINT_ALPHAS[index]}
      animatedProps={props}
    />
  );
}

const styles = StyleSheet.create({
  canvas: { position: 'absolute' },
});
