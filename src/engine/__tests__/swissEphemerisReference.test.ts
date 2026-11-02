import { angles, zodiacPosition } from '../astro/natal';
import { Planet, planetLongitude } from '../astro/planets';
import { mod } from '../util';

/**
 * Checked against Swiss Ephemeris (JPL DE441) positions recorded in the Kotlin app's
 * docs/research/swisseph-reference.md: a made-up Hanoi chart and four dates spanning 1900–2100.
 * Only the reference numbers are used; no Swiss Ephemeris code or data is bundled.
 */
const separation = (a: number, b: number): number => {
  const d = mod(a - b, 360);
  return d > 180 ? 360 - d : d;
};

/** 15 June 1990, 08:30 in Hanoi (01:30 UT). */
const NATAL_JD = 2448057.5625;
const HANOI_LAT = 21.0333;
const HANOI_LON = 105.85;
const ANGLE_TOLERANCE = 0.01;

/** Degrees; measured worst cases are about two thirds of these. */
const TOLERANCE: ReadonlyMap<Planet, number> = new Map([
  [Planet.SUN, 0.01],
  [Planet.MOON, 0.05],
  [Planet.MERCURY, 0.03],
  [Planet.VENUS, 0.03],
  [Planet.MARS, 0.03],
  [Planet.JUPITER, 0.05],
  [Planet.SATURN, 0.04],
]);

const ORDER = [Planet.SUN, Planet.MOON, Planet.MERCURY, Planet.VENUS, Planet.MARS, Planet.JUPITER, Planet.SATURN];
const row = (jd: number, lons: number[]) => ({ jd, expected: ORDER.map((p, i) => [p, lons[i]!] as const) });

const REFERENCE = [
  row(NATAL_JD, [83.7116887, 339.5458391, 64.9443691, 48.263192, 10.7266638, 105.7947597, 294.0574906]),
  row(2415021.0, [280.6632882, 279.6163849, 259.6393506, 306.9961525, 284.2530356, 241.2336136, 267.7749547]),
  row(2451545.0, [280.3689187, 223.3237514, 271.889277, 241.5657884, 327.9633025, 25.2530872, 40.3956635]),
  row(2469808.0, [281.2579938, 25.3817775, 269.6006734, 281.8772782, 228.0324254, 121.6321847, 297.6321417]),
  row(2488069.0, [280.0949926, 150.4167696, 287.1951817, 319.4692497, 29.3227698, 201.1528397, 205.6024486]),
];

describe('SwissEphemerisReference', () => {
  test('planets stay within a few arcminutes of Swiss Ephemeris from 1900 to 2100', () => {
    const misses = REFERENCE.flatMap(({ jd, expected }) =>
      expected.flatMap(([planet, lon]) => {
        const off = separation(planetLongitude(planet, jd), lon);
        return off > TOLERANCE.get(planet)! ? [`${Planet[planet]} at JD ${jd} is off by ${off}°`] : [];
      }),
    );
    expect(misses).toEqual([]);
  });

  test('every planet lands in the same sign as Swiss Ephemeris', () => {
    for (const { jd, expected } of REFERENCE) {
      for (const [planet, lon] of expected) {
        expect([Planet[planet], jd, zodiacPosition(planetLongitude(planet, jd)).sign]).toEqual([
          Planet[planet],
          jd,
          zodiacPosition(lon).sign,
        ]);
      }
    }
  });

  test('ascendant and midheaven of the Hanoi chart match Swiss Ephemeris', () => {
    const { ascendant, midheaven } = angles(NATAL_JD, HANOI_LAT, HANOI_LON);
    expect(separation(ascendant, 126.5002466)).toBeLessThan(ANGLE_TOLERANCE);
    expect(separation(midheaven, 33.6678901)).toBeLessThan(ANGLE_TOLERANCE);
  });
});
