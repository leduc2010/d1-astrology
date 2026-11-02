import { Planet, zodiacPosition, type NatalChart } from '@/engine';

import { placePlanets, separation, wheelPoint } from '../model/natalWheelLayout';

/** A made-up chart: only planet longitudes matter to the layout. */
const chartOf = (longitudes: readonly (readonly [Planet, number])[]): NatalChart => ({
  planets: new Map(longitudes.map(([p, lon]) => [p, zodiacPosition(lon)])),
  ascendant: null,
  midheaven: null,
  aspects: [],
});

describe('natal wheel layout', () => {
  test('separation is the shorter way round the zodiac', () => {
    expect(separation(10, 350)).toBe(20);
    expect(separation(350, 10)).toBe(20);
    expect(separation(0, 180)).toBe(180);
  });

  test('the anchor longitude sits at nine o clock', () => {
    const p = wheelPoint(50, 50, 10, 120, 120, 1);
    expect(p.x).toBeCloseTo(40);
    expect(p.y).toBeCloseTo(50);
  });

  test('planets spread apart all stay on the outer track', () => {
    const placed = placePlanets(chartOf([[Planet.SUN, 10], [Planet.MOON, 100], [Planet.MARS, 200]]));
    expect(placed.every((p) => !p.inner)).toBe(true);
  });

  test('a planet crowding the one before it steps inward', () => {
    const placed = placePlanets(chartOf([[Planet.SUN, 10], [Planet.MERCURY, 14], [Planet.MARS, 200]]));
    expect(placed.map((p) => [p.planet, p.inner])).toEqual([
      [Planet.SUN, false],
      [Planet.MERCURY, true],
      [Planet.MARS, false],
    ]);
  });

  test('a cluster across 0 degrees parts too', () => {
    const placed = placePlanets(chartOf([[Planet.SUN, 2], [Planet.MARS, 180], [Planet.VENUS, 357]]));
    const venus = placed.find((p) => p.planet === Planet.VENUS);
    expect(venus?.inner).toBe(true);
  });
});
