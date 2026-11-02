import { Easing, type WithTimingConfig } from 'react-native-reanimated';

/** Cubic bezier control points, kept as data so tests can compare them with Kotlin. */
export const OrtusEasingCurves = {
  /** Ease-out-quint: fast start, long graceful settle. */
  settle: [0.22, 1, 0.36, 1],
  /** Symmetric ease for loops and cross-fades. */
  glide: [0.45, 0, 0.55, 1],
  /** Exits leave quickly so the next content can take focus. */
  exit: [0.4, 0, 1, 1],
} as const;

const bezier = (c: readonly [number, number, number, number]) => Easing.bezier(c[0], c[1], c[2], c[3]);

/** Timing config that jumps straight to the target (Compose `snap()`). */
const SNAP: WithTimingConfig = { duration: 0 };

/**
 * Motion language (mirrors Kotlin `OrtusMotion`): slow, soft and settled. Things drift into
 * place, never bounce. Every animation takes its duration and easing from here; the spec
 * helpers return reanimated `withTiming` configs and snap when [reduced] is true.
 */
export const OrtusMotion = {
  /** Press feedback, toggles. */
  QUICK: 160,
  /** Most state changes, tab content fades. */
  STANDARD: 320,
  /** Screen transitions, card reveals. */
  EMPHASIZED: 520,
  /** One-off hero reveals (splash title, chart drawing). */
  CEREMONIAL: 1200,
  /** Ambient loops (star twinkle, halo breathing). */
  AMBIENT: 6000,
  /** Delay between staggered list items. */
  STAGGER: 60,
  /** Pressed components sink to this scale. */
  PRESSED_SCALE: 0.97,
  /** Incoming screens start a hair smaller and settle to full size. */
  ENTER_SCALE: 0.98,
  /** How far a revealed item drifts up while fading in (dp). */
  revealRise: 14,
  settle: bezier(OrtusEasingCurves.settle),
  glide: bezier(OrtusEasingCurves.glide),
  exit: bezier(OrtusEasingCurves.exit),

  standard(reduced = false): WithTimingConfig {
    return reduced ? SNAP : { duration: OrtusMotion.STANDARD, easing: OrtusMotion.settle };
  },
  /** Delay is applied by the caller with `withDelay(delayMillis, ...)`. */
  emphasized(reduced = false): WithTimingConfig {
    return reduced ? SNAP : { duration: OrtusMotion.EMPHASIZED, easing: OrtusMotion.settle };
  },
  /** Slow reveal for a centrepiece (a chart being drawn), never for routine changes. */
  ceremonial(reduced = false): WithTimingConfig {
    return reduced ? SNAP : { duration: OrtusMotion.CEREMONIAL, easing: OrtusMotion.settle };
  },
  quick(reduced = false): WithTimingConfig {
    return reduced ? SNAP : { duration: OrtusMotion.QUICK, easing: OrtusMotion.glide };
  },
} as const;
