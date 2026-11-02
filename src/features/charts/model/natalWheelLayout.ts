import type { NatalChart, Planet } from '@/engine';

/* Pure geometry of the natal wheel, kept apart from drawing so it can be tested. */

/** Ring radii as fractions of the wheel's outer radius. */
export const WheelRings = {
  WHEEL_FILL: 0.88,
  SIGN_INNER: 0.8,
  HOUSE_INNER: 0.68,
  PLANET_TRACK: 0.57,
  PLANET_TRACK_INNER: 0.46,
  ASPECT_RING: 0.38,
  LABEL_RING: 1.07,
} as const;

export const SIGNS = 12;
export const SIGN_ARC = 30;
export const HALF_SIGN = 15;
const LEFT = 180;
const FULL_TURN = 360;
const DEGREES_TO_RADIANS = Math.PI / LEFT;

/** Planets closer than this share the outer track only by stepping one of them inward. */
export const CLUSTER_DEGREES = 9;

/** A planet's glyph placed on one of the two tracks. */
export interface PlacedPlanet {
  readonly planet: Planet;
  readonly longitude: number;
  readonly inner: boolean;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Point at [longitude] on the ring [fraction] of [radius] round ([cx], [cy]), with [anchor] at
 * nine o'clock; longitudes run counter-clockwise.
 */
export function wheelPoint(cx: number, cy: number, radius: number, anchor: number, longitude: number, fraction: number): Point {
  const angle = (LEFT + longitude - anchor) * DEGREES_TO_RADIANS;
  const r = radius * fraction;
  return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
}

/** Shortest angular distance between two longitudes, 0..180. */
export function separation(a: number, b: number): number {
  const d = Math.abs(a - b) % FULL_TURN;
  return d > LEFT ? FULL_TURN - d : d;
}

const isClear = (occupant: number | null, longitude: number): boolean =>
  occupant === null || separation(occupant, longitude) >= CLUSTER_DEGREES;

/**
 * Walks the planets round the zodiac, putting each on the outer track unless its last occupant is
 * too close, then on the inner one. The last planet also checks the first, so clusters across 0°
 * part too.
 */
export function placePlanets(chart: NatalChart): PlacedPlanet[] {
  // Stable sort, like Kotlin sortedBy.
  const sorted = [...chart.planets.entries()].sort(([, a], [, b]) => a.longitude - b.longitude);
  let outerLast: number | null = null;
  let innerLast: number | null = null;
  const placed = sorted.map(([planet, position]): PlacedPlanet => {
    const longitude = position.longitude;
    const inner = !isClear(outerLast, longitude) && isClear(innerLast, longitude);
    if (inner) innerLast = longitude;
    else outerLast = longitude;
    return { planet, longitude, inner };
  });
  const first = placed[0];
  const last = placed[placed.length - 1];
  if (first === undefined || last === undefined) return placed;
  const wrapsOntoFirst = placed.length > 1 && last.inner === first.inner && !isClear(first.longitude, last.longitude);
  const beforeLast = placed.length >= 2 ? placed[placed.length - 2] : undefined;
  const otherTrackClear =
    beforeLast === undefined || beforeLast.inner === last.inner || isClear(beforeLast.longitude, last.longitude);
  return wrapsOntoFirst && otherTrackClear ? [...placed.slice(0, -1), { ...last, inner: !last.inner }] : placed;
}
