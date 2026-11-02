import { mod } from '../util';
import { DEG, FULL_CIRCLE, sunApparentLongitude } from './sun';

/** The seven classical planets of a natal chart. */
export enum Planet {
  SUN,
  MOON,
  MERCURY,
  VENUS,
  MARS,
  JUPITER,
  SATURN,
}
export const PLANETS: readonly Planet[] = [
  Planet.SUN, Planet.MOON, Planet.MERCURY, Planet.VENUS, Planet.MARS, Planet.JUPITER, Planet.SATURN,
];

/**
 * Geocentric ecliptic longitudes (tropical, equinox of date) from Paul Schlyter's low-precision
 * orbital elements: within a few arcminutes for the Sun and Moon and well under a degree for the
 * planets between 1900 and 2100, which is plenty for sign and house placement.
 */

/** Schlyter's day zero: 1999 Dec 31, 0h UT. */
const SCHLYTER_EPOCH = 2451543.5;
const KEPLER_ITERATIONS = 6;

const SUN_W0 = 282.9404;
const SUN_W_RATE = 4.70935e-5;
const SUN_M0 = 356.047;
const SUN_M_RATE = 0.9856002585;
const MOON_N0 = 125.1228;
const MOON_N_RATE = -0.0529538083;
const MOON_W0 = 318.0634;
const MOON_W_RATE = 0.1643573223;
const MOON_M0 = 115.3654;
const MOON_M_RATE = 13.0649929509;
const JUPITER_M0 = 19.895;
const JUPITER_M_RATE = 0.0830853001;
const SATURN_M0 = 316.967;
const SATURN_M_RATE = 0.0334442282;

/** Largest lunar longitude terms: amplitude and multiples of Mm, D, Ms, F. */
const MOON_TERMS: readonly (readonly [number, number, number, number, number])[] = [
  [-1.274, 1.0, -2.0, 0.0, 0.0],
  [0.658, 0.0, 2.0, 0.0, 0.0],
  [-0.186, 0.0, 0.0, 1.0, 0.0],
  [-0.059, 2.0, -2.0, 0.0, 0.0],
  [-0.057, 1.0, -2.0, 1.0, 0.0],
  [0.053, 1.0, 2.0, 0.0, 0.0],
  [0.046, 0.0, 2.0, -1.0, 0.0],
  [0.041, 1.0, 0.0, -1.0, 0.0],
  [-0.035, 0.0, 1.0, 0.0, 0.0],
  [-0.031, 1.0, 0.0, 1.0, 0.0],
  [-0.015, 0.0, -2.0, 0.0, 2.0],
  [0.011, 1.0, -4.0, 0.0, 0.0],
];

interface Orbit {
  readonly n: number;
  readonly i: number;
  readonly w: number;
  readonly a: number;
  readonly e: number;
  readonly m: number;
}

interface Polar {
  readonly lon: number;
  readonly lat: number;
  readonly r: number;
}

/** Longitudes of all seven planets in degrees 0..360 at Julian date [jd] (UT). */
export function planetLongitudes(jd: number): ReadonlyMap<Planet, number> {
  return new Map(PLANETS.map((p) => [p, planetLongitude(p, jd)] as const));
}

export function planetLongitude(planet: Planet, jd: number): number {
  const d = jd - SCHLYTER_EPOCH;
  let lon: number;
  if (planet === Planet.SUN) lon = sunApparentLongitude(jd);
  else if (planet === Planet.MOON) lon = moon(d);
  else lon = outerLongitude(planet, d);
  return mod(lon, FULL_CIRCLE);
}

function outerLongitude(planet: Planet, d: number): number {
  const sun = sunVector(d);
  const helio = heliocentric(elements(planet, d));
  const lon = helio.lon + perturbation(planet, d);
  const x = helio.r * Math.cos(lon * DEG) * Math.cos(helio.lat * DEG) + sun[0];
  const y = helio.r * Math.sin(lon * DEG) * Math.cos(helio.lat * DEG) + sun[1];
  return Math.atan2(y, x) / DEG;
}

function moon(d: number): number {
  const geo = heliocentric(elements(Planet.MOON, d));
  const ms = SUN_M0 + SUN_M_RATE * d;
  const mm = MOON_M0 + MOON_M_RATE * d;
  const nm = MOON_N0 + MOON_N_RATE * d;
  const ws = SUN_W0 + SUN_W_RATE * d;
  const wm = MOON_W0 + MOON_W_RATE * d;
  const ls = ms + ws;
  const lm = mm + wm + nm;
  const dd = lm - ls;
  const f = lm - nm;
  let sum = 0;
  for (const [amp, a, b, c, e] of MOON_TERMS) sum += amp * Math.sin((a * mm + b * dd + c * ms + e * f) * DEG);
  return geo.lon + sum;
}

/** Jupiter and Saturn pull on each other enough to shift them by up to a degree. */
function perturbation(planet: Planet, d: number): number {
  const mj = JUPITER_M0 + JUPITER_M_RATE * d;
  const ms = SATURN_M0 + SATURN_M_RATE * d;
  const s = (x: number) => Math.sin(x * DEG);
  const c = (x: number) => Math.cos(x * DEG);
  switch (planet) {
    case Planet.JUPITER:
      return (
        -0.332 * s(2 * mj - 5 * ms - 67.6) - 0.056 * s(2 * mj - 2 * ms + 21) + 0.042 * s(3 * mj - 5 * ms + 21) -
        0.036 * s(mj - 2 * ms) + 0.022 * c(mj - ms) + 0.023 * s(2 * mj - 3 * ms + 52) - 0.016 * s(mj - 5 * ms - 69)
      );
    case Planet.SATURN:
      return (
        0.812 * s(2 * mj - 5 * ms - 67.6) - 0.229 * c(2 * mj - 4 * ms - 2) + 0.119 * s(mj - 2 * ms - 3) +
        0.046 * s(2 * mj - 6 * ms - 69) + 0.014 * s(mj - 3 * ms + 32)
      );
    default:
      return 0.0;
  }
}

function sunVector(d: number): readonly [number, number] {
  const sun = heliocentric(elements(Planet.SUN, d));
  return [sun.r * Math.cos(sun.lon * DEG), sun.r * Math.sin(sun.lon * DEG)];
}

function heliocentric(o: Orbit): Polar {
  const m = mod(o.m, FULL_CIRCLE) * DEG;
  let e = m + o.e * Math.sin(m) * (1 + o.e * Math.cos(m));
  for (let k = 0; k < KEPLER_ITERATIONS; k++) e -= (e - o.e * Math.sin(e) - m) / (1 - o.e * Math.cos(e));
  const xv = o.a * (Math.cos(e) - o.e);
  const yv = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(e);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const n = o.n * DEG;
  const vw = v + o.w * DEG;
  const i = o.i * DEG;
  const x = r * (Math.cos(n) * Math.cos(vw) - Math.sin(n) * Math.sin(vw) * Math.cos(i));
  const y = r * (Math.sin(n) * Math.cos(vw) + Math.cos(n) * Math.sin(vw) * Math.cos(i));
  const z = r * Math.sin(vw) * Math.sin(i);
  return { lon: Math.atan2(y, x) / DEG, lat: Math.atan2(z, Math.sqrt(x * x + y * y)) / DEG, r };
}

const orbit = (n: number, i: number, w: number, a: number, e: number, m: number): Orbit => ({ n, i, w, a, e, m });

/** Published orbital elements, kept exactly as tabulated. */
function elements(planet: Planet, d: number): Orbit {
  switch (planet) {
    case Planet.SUN:
      return orbit(0.0, 0.0, SUN_W0 + SUN_W_RATE * d, 1.0, 0.016709 - 1.151e-9 * d, SUN_M0 + SUN_M_RATE * d);
    case Planet.MOON:
      return orbit(MOON_N0 + MOON_N_RATE * d, 5.1454, MOON_W0 + MOON_W_RATE * d, 60.2666, 0.0549, MOON_M0 + MOON_M_RATE * d);
    case Planet.MERCURY:
      return orbit(
        48.3313 + 3.24587e-5 * d, 7.0047 + 5.0e-8 * d, 29.1241 + 1.01444e-5 * d,
        0.387098, 0.205635 + 5.59e-10 * d, 168.6562 + 4.0923344368 * d,
      );
    case Planet.VENUS:
      return orbit(
        76.6799 + 2.4659e-5 * d, 3.3946 + 2.75e-8 * d, 54.891 + 1.38374e-5 * d,
        0.72333, 0.006773 - 1.302e-9 * d, 48.0052 + 1.6021302244 * d,
      );
    case Planet.MARS:
      return orbit(
        49.5574 + 2.11081e-5 * d, 1.8497 - 1.78e-8 * d, 286.5016 + 2.92961e-5 * d,
        1.523688, 0.093405 + 2.516e-9 * d, 18.6021 + 0.5240207766 * d,
      );
    case Planet.JUPITER:
      return orbit(
        100.4542 + 2.76854e-5 * d, 1.303 - 1.557e-7 * d, 273.8777 + 1.64505e-5 * d,
        5.20256, 0.048498 + 4.469e-9 * d, JUPITER_M0 + JUPITER_M_RATE * d,
      );
    case Planet.SATURN:
      return orbit(
        113.6634 + 2.3898e-5 * d, 2.4886 - 1.081e-7 * d, 339.3939 + 2.97661e-5 * d,
        9.55475, 0.055546 - 9.499e-9 * d, SATURN_M0 + SATURN_M_RATE * d,
      );
  }
}
