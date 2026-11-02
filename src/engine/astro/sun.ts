import { J2000 } from '../time/julianDay';
import { mod } from '../util';

export const DEG = Math.PI / 180.0;
export const FULL_CIRCLE = 360.0;

const DAYS_PER_CENTURY = 36525.0;
const HALF_CIRCLE = 180.0;
const SEARCH_WINDOW_DAYS = 35.0;
const BISECTION_STEPS = 40;

/** Low-precision solar position (Meeus, Astronomical Algorithms ch. 25; error ≈ 0.01°). */

/** Apparent geocentric ecliptic longitude of the Sun in degrees, [0, 360). */
export function sunApparentLongitude(jd: number): number {
  const t = (jd - J2000) / DAYS_PER_CENTURY;
  const l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  const m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const center =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m * DEG) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * m * DEG) +
    0.000289 * Math.sin(3 * m * DEG);
  const omega = 125.04 - 1934.136 * t;
  return mod(l0 + center - 0.00569 - 0.00478 * Math.sin(omega * DEG), FULL_CIRCLE);
}

/**
 * Julian Date at which the Sun reaches [targetDeg], searching up to 35 days after ([forward]) or
 * before [nearJd]. The window covers a full 30° solar month while staying far below 180°, so the
 * signed offset changes sign exactly once. Bisection; precision well under a minute.
 */
export function sunCrossing(targetDeg: number, nearJd: number, forward: boolean): number {
  let a = forward ? nearJd : nearJd - SEARCH_WINDOW_DAYS;
  let b = forward ? nearJd + SEARCH_WINDOW_DAYS : nearJd;
  const offset = (jd: number) => mod(sunApparentLongitude(jd) - targetDeg + HALF_CIRCLE, FULL_CIRCLE) - HALF_CIRCLE;
  let offsetA = offset(a);
  if (offsetA * offset(b) > 0) {
    throw new Error(`Sun does not reach ${targetDeg}° within ${SEARCH_WINDOW_DAYS} days of ${nearJd}`);
  }
  for (let step = 0; step < BISECTION_STEPS; step++) {
    const mid = (a + b) / 2;
    const offsetMid = offset(mid);
    if (offsetA * offsetMid <= 0) {
      b = mid;
    } else {
      a = mid;
      offsetA = offsetMid;
    }
  }
  return (a + b) / 2;
}
