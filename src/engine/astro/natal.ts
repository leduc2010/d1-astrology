import { J2000 } from '../time/julianDay';
import { minByOrNull, mod } from '../util';
import { Planet, planetLongitudes, PLANETS } from './planets';
import { DEG, FULL_CIRCLE } from './sun';

const SIGNS = 12;
const SIGN_ARC = 30.0;
const HALF_CIRCLE = 180.0;
const DAYS_PER_CENTURY = 36525.0;
const GMST_AT_J2000 = 280.46061837;
const GMST_RATE = 360.98564736629;
const GMST_T2 = 0.000387933;
const OBLIQUITY_J2000 = 23.4393;
const OBLIQUITY_RATE = 3.563e-7;

/** The four classical elements of the zodiac, in sign order: Aries Fire, Taurus Earth, Gemini Air… */
export enum ZodiacElement {
  FIRE,
  EARTH,
  AIR,
  WATER,
}
export const ZODIAC_ELEMENTS: readonly ZodiacElement[] = [
  ZodiacElement.FIRE, ZodiacElement.EARTH, ZodiacElement.AIR, ZodiacElement.WATER,
];

/** A point on the ecliptic split into its sign (0 Aries … 11 Pisces) and degree within the sign. */
export interface ZodiacPosition {
  readonly longitude: number;
  readonly sign: number;
  readonly degree: number;
  readonly element: ZodiacElement;
}

export function zodiacPosition(longitude: number): ZodiacPosition {
  const lon = mod(longitude, FULL_CIRCLE);
  const sign = Math.min(Math.max(Math.trunc(lon / SIGN_ARC), 0), SIGNS - 1);
  return Object.freeze({
    longitude,
    sign,
    degree: Math.trunc(lon - sign * SIGN_ARC),
    element: (sign % ZODIAC_ELEMENTS.length) as ZodiacElement,
  });
}

export enum AspectKind {
  CONJUNCTION,
  SEXTILE,
  SQUARE,
  TRINE,
  OPPOSITION,
}
export const ASPECT_KINDS: readonly AspectKind[] = [
  AspectKind.CONJUNCTION, AspectKind.SEXTILE, AspectKind.SQUARE, AspectKind.TRINE, AspectKind.OPPOSITION,
];
const ASPECT_ANGLE: readonly number[] = [0.0, 60.0, 90.0, 120.0, 180.0];
const ASPECT_ORB: readonly number[] = [8.0, 6.0, 7.0, 8.0, 8.0];
export const aspectAngle = (k: AspectKind): number => ASPECT_ANGLE[k]!;
export const aspectMaxOrb = (k: AspectKind): number => ASPECT_ORB[k]!;

export interface Aspect {
  readonly first: Planet;
  readonly second: Planet;
  readonly kind: AspectKind;
  readonly orb: number;
}

/**
 * A Western natal chart with whole-sign houses. [ascendant] and [midheaven] are null when the birth
 * time is unknown; houses are then not drawn.
 */
export interface NatalChart {
  readonly planets: ReadonlyMap<Planet, ZodiacPosition>;
  readonly ascendant: ZodiacPosition | null;
  readonly midheaven: ZodiacPosition | null;
  readonly aspects: readonly Aspect[];
}

/** Whole-sign house 1..12 of [position], or null without an ascendant. */
export function houseOfPosition(chart: NatalChart, position: ZodiacPosition): number | null {
  return chart.ascendant ? mod(position.sign - chart.ascendant.sign, SIGNS) + 1 : null;
}

/** Whole-sign house 1..12 of [planet], or null without an ascendant. */
export function houseOf(chart: NatalChart, planet: Planet): number | null {
  const pos = chart.planets.get(planet);
  return pos ? houseOfPosition(chart, pos) : null;
}

/** How many of the seven planets fall in each element. */
export function zodiacElementBalance(chart: NatalChart): ReadonlyMap<ZodiacElement, number> {
  const counts = new Map<ZodiacElement, number>(ZODIAC_ELEMENTS.map((e) => [e, 0]));
  for (const p of chart.planets.values()) counts.set(p.element, (counts.get(p.element) ?? 0) + 1);
  return counts;
}

export interface GeoLocation {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Chart for the instant [jd] (UT). With [location] (latitude, east longitude in degrees) the
 * ascendant and midheaven are worked out too.
 */
export function natalChart(jd: number, location: GeoLocation | null): NatalChart {
  const longitudes = planetLongitudes(jd);
  const a = location ? angles(jd, location.latitude, location.longitude) : null;
  return Object.freeze({
    planets: new Map([...longitudes].map(([p, lon]) => [p, zodiacPosition(lon)] as const)),
    ascendant: a ? zodiacPosition(a.ascendant) : null,
    midheaven: a ? zodiacPosition(a.midheaven) : null,
    aspects: aspects(longitudes),
  });
}

/** Ascendant and midheaven longitudes for latitude [lat] and east longitude [lon]. */
export function angles(jd: number, lat: number, lon: number): { ascendant: number; midheaven: number } {
  const ramc = localSiderealDegrees(jd, lon) * DEG;
  const eps = obliquity(jd) * DEG;
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat * DEG) * Math.sin(eps))) / DEG;
  const mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / DEG;
  // Inside the polar circles the formula can land on the setting point; the ascendant is always
  // the eastern one, within half a circle after the midheaven.
  const eastern = mod(asc - mc, FULL_CIRCLE) > HALF_CIRCLE ? asc + HALF_CIRCLE : asc;
  return { ascendant: mod(eastern, FULL_CIRCLE), midheaven: mod(mc, FULL_CIRCLE) };
}

/** Major aspects between every pair of planets, tightest orb kept when two could apply. */
export function aspects(longitudes: ReadonlyMap<Planet, number>): Aspect[] {
  const planets = PLANETS.filter((p) => longitudes.has(p));
  const result: Aspect[] = [];
  planets.forEach((a, i) => {
    for (const b of planets.slice(i + 1)) {
      const hit = aspectBetween(longitudes.get(a)!, longitudes.get(b)!);
      if (hit) result.push(Object.freeze({ first: a, second: b, kind: hit.kind, orb: hit.orb }));
    }
  });
  return result;
}

/** The major aspect two ecliptic longitudes make, with its orb in degrees; tightest wins, null if none. */
export function aspectBetween(first: number, second: number): { kind: AspectKind; orb: number } | null {
  const separation = angularDistance(first, second);
  const candidates = ASPECT_KINDS.map((kind) => ({ kind, orb: Math.abs(separation - aspectAngle(kind)) })).filter(
    (c) => c.orb <= aspectMaxOrb(c.kind),
  );
  return minByOrNull(candidates, (c) => c.orb);
}

function angularDistance(a: number, b: number): number {
  const d = mod(a - b, FULL_CIRCLE);
  return d > HALF_CIRCLE ? FULL_CIRCLE - d : d;
}

function localSiderealDegrees(jd: number, lon: number): number {
  const d = jd - J2000;
  const t = d / DAYS_PER_CENTURY;
  const gmst = GMST_AT_J2000 + GMST_RATE * d + GMST_T2 * t * t;
  return mod(gmst + lon, FULL_CIRCLE);
}

const obliquity = (jd: number): number => OBLIQUITY_J2000 - OBLIQUITY_RATE * (jd - J2000);
