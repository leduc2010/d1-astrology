import { AspectKind, aspectBetween, aspectMaxOrb, type NatalChart } from '../astro/natal';
import { Planet } from '../astro/planets';

type PlanetPair = readonly [Planet, Planet];

/** The four relationship axes read from cross-chart aspects. */
export enum SynastryAxis {
  AFFECTION,
  COMMUNICATION,
  PASSION,
  STABILITY,
}
export const SYNASTRY_AXES: readonly SynastryAxis[] = [
  SynastryAxis.AFFECTION,
  SynastryAxis.COMMUNICATION,
  SynastryAxis.PASSION,
  SynastryAxis.STABILITY,
];

const AXIS_PAIRS: readonly (readonly PlanetPair[])[] = [
  [
    [Planet.SUN, Planet.MOON],
    [Planet.MOON, Planet.MOON],
    [Planet.VENUS, Planet.MOON],
    [Planet.VENUS, Planet.VENUS],
    [Planet.VENUS, Planet.SUN],
  ],
  [
    [Planet.MERCURY, Planet.MERCURY],
    [Planet.MERCURY, Planet.SUN],
    [Planet.MERCURY, Planet.MOON],
  ],
  [
    [Planet.MARS, Planet.VENUS],
    [Planet.MARS, Planet.MARS],
    [Planet.MARS, Planet.SUN],
  ],
  [
    [Planet.SATURN, Planet.SUN],
    [Planet.SATURN, Planet.MOON],
    [Planet.SATURN, Planet.VENUS],
    [Planet.JUPITER, Planet.SUN],
  ],
];

/** A qualitative reading of one axis; never summed into an overall score. */
export enum AxisLevel {
  QUIET,
  NEEDS_CARE,
  MODERATE,
  WARM,
  STRONG,
}
const AXIS_FRACTION: readonly number[] = [0.15, 0.35, 0.5, 0.72, 0.9];
/** How full the axis bar is drawn for [level]. */
export const axisFraction = (level: AxisLevel): number => AXIS_FRACTION[level]!;

/** One cross aspect: [first] from the first chart, [second] from the other. */
export interface CrossAspect {
  readonly first: Planet;
  readonly second: Planet;
  readonly kind: AspectKind;
  readonly orb: number;
}

export const isHarmonious = (a: CrossAspect): boolean => a.kind !== AspectKind.SQUARE && a.kind !== AspectKind.OPPOSITION;

/** 1 at an exact aspect, falling to 0 at the edge of its orb. */
export const aspectWeight = (a: CrossAspect): number => 1 - a.orb / aspectMaxOrb(a.kind);

export interface AxisReading {
  readonly axis: SynastryAxis;
  readonly level: AxisLevel;
  readonly aspects: readonly CrossAspect[];
}

const QUIET_BELOW = 0.3;
const STRONG_FROM = 1.5;
const WARM_FROM = 0.8;

export const synastryAxes = (a: NatalChart, b: NatalChart): AxisReading[] => SYNASTRY_AXES.map((axis) => synastryAxis(axis, a, b));

export function synastryAxis(axis: SynastryAxis, a: NatalChart, b: NatalChart): AxisReading {
  // Each pair is read both ways: A's Venus to B's Mars and B's Venus to A's Mars.
  const directed: PlanetPair[] = [];
  for (const [p, q] of AXIS_PAIRS[axis]!) {
    for (const pair of [[p, q], [q, p]] as const) {
      if (!directed.some(([x, y]) => x === pair[0] && y === pair[1])) directed.push(pair);
    }
  }
  const aspects = directed.map(([p, q]) => cross(a, b, p, q)).filter((c): c is CrossAspect => c !== null);
  return Object.freeze({ axis, level: axisLevel(aspects), aspects });
}

/** Harmony H and tension T from weighted aspects decide the level; see AxisLevel. */
export function axisLevel(aspects: readonly CrossAspect[]): AxisLevel {
  let harmony = 0;
  let tension = 0;
  for (const a of aspects) {
    if (isHarmonious(a)) harmony += aspectWeight(a);
    else tension += aspectWeight(a);
  }
  const net = harmony - tension / 2;
  if (harmony + tension < QUIET_BELOW) return AxisLevel.QUIET;
  if (tension > harmony) return AxisLevel.NEEDS_CARE;
  if (net >= STRONG_FROM) return AxisLevel.STRONG;
  if (net >= WARM_FROM) return AxisLevel.WARM;
  return AxisLevel.MODERATE;
}

function cross(a: NatalChart, b: NatalChart, p: Planet, q: Planet): CrossAspect | null {
  const first = a.planets.get(p);
  const second = b.planets.get(q);
  if (!first || !second) return null;
  const hit = aspectBetween(first.longitude, second.longitude);
  return hit ? Object.freeze({ first: p, second: q, kind: hit.kind, orb: hit.orb }) : null;
}
