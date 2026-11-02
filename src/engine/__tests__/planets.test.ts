import { expectNear } from '../__testutils__/vietNames';
import {
  angles,
  AspectKind,
  aspectMaxOrb,
  aspects,
  zodiacElementBalance,
  houseOf,
  houseOfPosition,
  natalChart,
  ZodiacElement,
  zodiacPosition,
} from '../astro/natal';
import { Planet, planetLongitude, PLANETS } from '../astro/planets';
import { civilDate } from '../time/civilDate';
import { julianDate } from '../time/julianDay';
import { mod } from '../util';

/** Checked against conjunctions and oppositions whose instants are well known. */
const jd = (y: number, m: number, d: number, hourUt: number) => julianDate(civilDate(y, m, d), hourUt);
const lon = planetLongitude;

function separation(a: number, b: number): number {
  const d = mod(a - b, 360);
  return d > 180 ? 360 - d : d;
}

describe('Planets', () => {
  test('moon meets the sun at the 2017 total eclipse', () => {
    const t = jd(2017, 8, 21, 18.43);
    expect(separation(lon(Planet.MOON, t), lon(Planet.SUN, t))).toBeLessThan(0.3);
    expectNear(lon(Planet.SUN, t), 148.9, 0.3);
  });

  test('venus and mercury cross the sun on their transits', () => {
    const venus = jd(2012, 6, 6, 1.5);
    expect(separation(lon(Planet.VENUS, venus), lon(Planet.SUN, venus))).toBeLessThan(0.5);
    const mercury = jd(2019, 11, 11, 15.3);
    expect(separation(lon(Planet.MERCURY, mercury), lon(Planet.SUN, mercury))).toBeLessThan(0.5);
  });

  test('mars opposes the sun in July 2018', () => {
    const t = jd(2018, 7, 27, 5.1);
    expectNear(separation(lon(Planet.MARS, t), lon(Planet.SUN, t)), 180.0, 0.5);
  });

  test('jupiter and saturn meet at the start of Aquarius in December 2020', () => {
    const t = jd(2020, 12, 21, 18.0);
    const jupiter = lon(Planet.JUPITER, t);
    expect(separation(jupiter, lon(Planet.SATURN, t))).toBeLessThan(0.5);
    expectNear(jupiter, 300.3, 0.5);
  });

  test('ascendant leads the midheaven by less than half a turn', () => {
    for (let step = 0; step < 48; step++) {
      const { ascendant, midheaven } = angles(jd(1995, 5, 20, step * 0.5), 21.03, 105.85);
      const lead = mod(ascendant - midheaven, 360);
      if (!(lead > 0 && lead < 180)) throw new Error(`asc ${ascendant} mc ${midheaven}`);
    }
  });

  test('ascendant stays eastern inside the arctic circle', () => {
    for (let step = 0; step < 96; step++) {
      const { ascendant, midheaven } = angles(jd(1995, 12, 20, step * 0.25), 69.65, 18.96);
      const lead = mod(ascendant - midheaven, 360);
      if (!(lead > 0 && lead < 180)) throw new Error(`asc ${ascendant} mc ${midheaven}`);
    }
  });

  test('whole sign houses count from the rising sign', () => {
    const chart = natalChart(jd(1995, 5, 20, 23.17), { latitude: 21.03, longitude: 105.85 });
    const asc = chart.ascendant!;
    expect(asc).not.toBeNull();
    expect(houseOfPosition(chart, asc)).toBe(1);
    for (const planet of PLANETS) {
      expect(houseOf(chart, planet)).toBe(mod(chart.planets.get(planet)!.sign - asc.sign, 12) + 1);
    }
    expect([...zodiacElementBalance(chart).values()].reduce((a, b) => a + b, 0)).toBe(7);
  });

  test('no birth place means no angles or houses', () => {
    const chart = natalChart(jd(1995, 5, 20, 5.0), null);
    expect(chart.ascendant).toBeNull();
    expect(houseOf(chart, Planet.SUN)).toBeNull();
  });

  test('aspects pick the closest major angle within orb', () => {
    const found = aspects(new Map([[Planet.SUN, 10.0], [Planet.MOON, 128.0], [Planet.MARS, 192.0]]));
    const kind = (a: Planet, b: Planet) => found.find((x) => x.first === a && x.second === b)?.kind;
    expect(kind(Planet.SUN, Planet.MOON)).toBe(AspectKind.TRINE);
    expect(kind(Planet.SUN, Planet.MARS)).toBe(AspectKind.OPPOSITION);
    expect(kind(Planet.MOON, Planet.MARS)).toBe(AspectKind.SEXTILE);
    expect(aspects(new Map([[Planet.SUN, 10.0], [Planet.VENUS, 52.0]]))).toEqual([]);
    expect(found.every((a) => Math.abs(a.orb) <= aspectMaxOrb(a.kind))).toBe(true);
  });

  test('zodiac position splits sign and degree', () => {
    const leo22 = zodiacPosition(142.4);
    expect(leo22.sign).toBe(4);
    expect(leo22.degree).toBe(22);
    expect(leo22.element).toBe(ZodiacElement.FIRE);
    expect(zodiacPosition(359.99).sign).toBe(11);
  });
});
