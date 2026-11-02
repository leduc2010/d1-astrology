import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { useReducedMotion } from '../theme/DesignSystemProvider';
import { OrtusColors as c } from '../theme/colors';
import { OrtusGradients } from '../theme/gradients';
import { OrtusMotion } from '../theme/motion';
import { KotlinRandom } from './kotlinRandom';

/** How busy the sky is. Splash/onboarding use Rich; dense content screens use Calm. */
export const SkyDensity = {
  Calm: { stars: 22, glints: 2 },
  Rich: { stars: 34, glints: 4 },
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- enum-like const + type
export type SkyDensity = (typeof SkyDensity)[keyof typeof SkyDensity];

type Star = { readonly x: number; readonly y: number; readonly radius: number; readonly alpha: number; readonly phase: number };
type Cloud = { readonly x: number; readonly y: number; readonly radius: number; readonly alpha: number };

const SEED = 0x0d7a;
const GLINT_BASE = 5;
const GLINT_SPREAD = 4;
const GLINT_SKY_SPAN = 0.7;
const GLINT_MARGIN = 0.06;
const HALO_RATIO = 2.2;
const HALO_PEAK_ALPHA = 0.22;
const CLOUD_BREATH = 0.04;
const TWO_PI = 2 * Math.PI;

const CLOUDS: readonly Cloud[] = [
  { x: 0.18, y: 0.12, radius: 0.75, alpha: 0.3 },
  { x: 0.92, y: 0.42, radius: 0.65, alpha: 0.22 },
  { x: 0.3, y: 0.86, radius: 0.8, alpha: 0.18 },
];

/** Same draw order and formulas as Kotlin, so each star lands where it does on Android. */
export function skyStars(count: number, seed: number): Star[] {
  const random = new KotlinRandom(seed);
  return Array.from({ length: count }, () => ({
    x: random.nextFloat(),
    y: random.nextFloat(),
    radius: 0.6 + random.nextFloat() * 0.9,
    alpha: 0.25 + random.nextFloat() * 0.55,
    phase: random.nextFloat() * TWO_PI,
  }));
}

/** Folds 0..1 onto the outer side bands, so a bright glint never sits behind a control. */
const toMargin = (x: number) => (x < 0.5 ? x * 2 * GLINT_MARGIN : 1 - (x - 0.5) * 2 * GLINT_MARGIN);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Slow, endless phase in radians over two ambient periods; frozen at 0 under reduced motion.
 * Consumers only use integer multiples of it inside sin(), so the loop restart is seamless.
 */
function useSkyTime(): SharedValue<number> {
  const reduced = useReducedMotion();
  const time = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(time);
    time.set(0);
    if (reduced) return;
    time.set(withRepeat(withTiming(TWO_PI, { duration: OrtusMotion.AMBIENT * 2, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(time);
  }, [reduced, time]);
  return time;
}

/** A gradient id that is valid inside `url(#...)` (React ids contain colons). */
export function useSvgId(prefix: string): string {
  return `${prefix}${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
}

export type StarfieldBackgroundProps = {
  density?: SkyDensity;
  seed?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Figma BG01: night gradient, three nebula clouds, scattered star dots and a few four-point glints.
 * Stars twinkle and clouds breathe on a slow loop on the UI thread; nothing re-renders per frame.
 */
export function StarfieldBackground({ density = SkyDensity.Calm, seed = SEED, style, children }: StarfieldBackgroundProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const time = useSkyTime();
  const stars = useMemo(() => skyStars(density.stars, seed), [density, seed]);
  const glints = useMemo(() => skyStars(density.glints, seed + 1).map((g) => ({ ...g, x: toMargin(g.x) })), [density, seed]);
  const ids = { cloud: useSvgId('cloud'), halo: useSvgId('glintHalo') };
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };
  const { width, height } = size;
  const maxDimension = Math.max(width, height);
  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <View style={styles.sky} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Defs>
              {CLOUDS.map((cloud, i) => (
                <RadialGradient key={i} id={`${ids.cloud}${i}`}>
                  <Stop offset={0} stopColor={c.nebula} stopOpacity={cloud.alpha} />
                  <Stop offset={0.55} stopColor={c.nebulaDeep} stopOpacity={cloud.alpha * 0.35} />
                  <Stop offset={1} stopColor={c.nebulaDeep} stopOpacity={0} />
                </RadialGradient>
              ))}
              <RadialGradient id={ids.halo}>
                <Stop offset={0} stopColor={c.starGlint} stopOpacity={HALO_PEAK_ALPHA} />
                <Stop offset={1} stopColor={c.starGlint} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {CLOUDS.map((cloud, i) => (
              <SkyCloud
                key={i}
                time={time}
                cx={width * cloud.x}
                cy={height * cloud.y}
                radius={(maxDimension * cloud.radius) / 2}
                fill={`url(#${ids.cloud}${i})`}
              />
            ))}
            {stars.map((star, i) => (
              <SkyStar key={i} star={star} time={time} cx={star.x * width} cy={star.y * height} />
            ))}
            {glints.map((glint, i) => (
              <SkyGlint key={i} glint={glint} time={time} cx={glint.x * width} cy={glint.y * height * GLINT_SKY_SPAN} haloFill={`url(#${ids.halo})`} />
            ))}
          </Svg>
        ) : null}
      </View>
      {children}
    </View>
  );
}

type CloudProps = { time: SharedValue<number>; cx: number; cy: number; radius: number; fill: string };

function SkyCloud({ time, cx, cy, radius, fill }: CloudProps) {
  const props = useAnimatedProps(() => ({ r: radius * (1 + CLOUD_BREATH * Math.sin(time.get())) }));
  return <AnimatedCircle cx={cx} cy={cy} fill={fill} animatedProps={props} />;
}

function SkyStar({ star, time, cx, cy }: { star: Star; time: SharedValue<number>; cx: number; cy: number }) {
  const props = useAnimatedProps(() => ({ opacity: star.alpha * (0.65 + 0.35 * Math.sin(2 * time.get() + star.phase)) }));
  return <AnimatedCircle cx={cx} cy={cy} r={star.radius} fill={c.starDot} animatedProps={props} />;
}

type GlintProps = { glint: Star; time: SharedValue<number>; cx: number; cy: number; haloFill: string };

/** Four-point star of radius [s] centred on (cx, cy); waist 0.18 like Kotlin `fourPointStar()`. */
function fourPointStar(cx: number, cy: number, s: number): string {
  'worklet';
  const w = 0.18 * s;
  return (
    `M${cx} ${cy - s}Q${cx + w} ${cy - w} ${cx + s} ${cy}` +
    `Q${cx + w} ${cy + w} ${cx} ${cy + s}Q${cx - w} ${cy + w} ${cx - s} ${cy}` +
    `Q${cx - w} ${cy - w} ${cx} ${cy - s}Z`
  );
}

function SkyGlint({ glint, time, cx, cy, haloFill }: GlintProps) {
  const size = GLINT_BASE + glint.radius * GLINT_SPREAD;
  const halo = useAnimatedProps(() => ({ opacity: 0.55 + 0.45 * Math.sin(time.get() + glint.phase) }));
  const star = useAnimatedProps(() => {
    const pulse = 0.55 + 0.45 * Math.sin(time.get() + glint.phase);
    return { d: fourPointStar(cx, cy, size * (0.85 + 0.15 * pulse)), opacity: 0.55 + 0.45 * pulse };
  });
  return (
    <>
      <AnimatedCircle cx={cx} cy={cy} r={size * HALO_RATIO} fill={haloFill} animatedProps={halo} />
      <AnimatedPath fill={c.starGlint} animatedProps={star} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  sky: { ...StyleSheet.absoluteFill, backgroundImage: OrtusGradients.night },
});
