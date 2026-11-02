import { expectNear } from '../__testutils__/vietNames';
import { civilDate } from '../time/civilDate';
import { equationOfTime, trueSolarMinutes } from '../time/solarTime';
import { vietnamOffsetMinutes } from '../time/vietnamTimeZone';

const hanoi = 21.03;
const saigon = 10.78;
const off = (y: number, m: number, d: number, lat: number) => vietnamOffsetMinutes(civilDate(y, m, d), lat);

describe('BirthTime', () => {
  test('south used UTC+8 from 1960 until June 1975', () => {
    expect(off(1959, 12, 31, saigon)).toBe(7 * 60);
    expect(off(1960, 1, 1, saigon)).toBe(8 * 60);
    expect(off(1975, 6, 12, saigon)).toBe(8 * 60);
    expect(off(1975, 6, 13, saigon)).toBe(7 * 60);
    expect(off(1950, 5, 1, saigon)).toBe(8 * 60);
  });

  test('north kept UTC+7 after 1945', () => {
    expect(off(1965, 3, 1, hanoi)).toBe(7 * 60);
    expect(off(1950, 5, 1, hanoi)).toBe(7 * 60);
    expect(off(1995, 8, 15, hanoi)).toBe(7 * 60);
  });

  test('wartime offsets apply to both regions', () => {
    for (const lat of [hanoi, saigon]) {
      expect(off(1930, 1, 1, lat)).toBe(7 * 60);
      expect(off(1944, 6, 1, lat)).toBe(8 * 60);
      expect(off(1945, 5, 1, lat)).toBe(9 * 60);
      expect(off(1946, 1, 1, lat)).toBe(7 * 60);
    }
  });

  test('equation of time matches almanac extremes', () => {
    // Almanac values: about -14.2 min on 11 Feb, +16.4 min on 3 Nov, near 0 mid-April.
    expectNear(equationOfTime(civilDate(2024, 2, 11)), -14.2, 0.6);
    expectNear(equationOfTime(civilDate(2024, 11, 3)), 16.4, 0.6);
    expectNear(equationOfTime(civilDate(2024, 4, 15)), 0.0, 0.6);
  });

  test('true solar time corrects for longitude and equation of time', () => {
    // Hà Đông 105.78°E on UTC+7: +3.1 min for longitude, about -4.5 min equation of time.
    const got = trueSolarMinutes(civilDate(1995, 8, 15), 11 * 60 + 30, 7 * 60, 105.78);
    expect(got).toBeGreaterThanOrEqual(11 * 60 + 27);
    expect(got).toBeLessThanOrEqual(11 * 60 + 30);
    // Saigon in 1965 kept UTC+8: 4 × (106.7 − 120) ≈ −53 min, equation of time ≈ 0.
    const south = trueSolarMinutes(civilDate(1965, 4, 15), 12 * 60, 8 * 60, 106.7);
    expect(south).toBeGreaterThanOrEqual(11 * 60 + 5);
    expect(south).toBeLessThanOrEqual(11 * 60 + 8);
  });
});
