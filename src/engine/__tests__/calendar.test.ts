import { vi, viBranch } from '../__testutils__/vietNames';
import {
  almanacDay,
  auspiciousHours,
  DayOfficer,
  lifeTrigram,
  Mansion,
  mansion,
  officer,
  SolarTerm,
  solarTermAt,
  Trigram,
} from '../almanac/almanac';
import { dayPillar } from '../bazi/bazi';
import { Branch, BRANCHES, branchOf, branchPlus, Element, napAm, Stem, stemBranch, stemOf } from '../ganzhi/ganzhi';
import {
  CHINA_OFFSET,
  leapMonthOf,
  lunarDate,
  monthLength,
  toLunar,
  toSolar,
  VIETNAM_OFFSET,
  yearPillar,
} from '../lunar/lunarCalendar';
import { civilDate } from '../time/civilDate';
import { dayNumber, dayNumberOf, julianDate, toCivil, weekday } from '../time/julianDay';

const day = (d: number, m: number, y: number) => dayNumberOf(d, m, y);
const sb = (stem: number, branch: number) => stemBranch(stemOf(stem), branchOf(branch));
const tet = (year: number) => [
  toSolar(lunarDate(year, 1, 1), VIETNAM_OFFSET),
  toSolar(lunarDate(year, 1, 1), CHINA_OFFSET),
];

describe('Calendar', () => {
  test('lunar year names follow the sexagenary cycle', () => {
    expect(yearPillar(1984)).toEqual(stemBranch(Stem.JIA, Branch.ZI));
    expect(yearPillar(1995)).toEqual(stemBranch(Stem.YI, Branch.HAI));
    expect(yearPillar(1900)).toEqual(stemBranch(Stem.GENG, Branch.ZI));
    expect(yearPillar(2026)).toEqual(stemBranch(Stem.BING, Branch.WU));
  });

  test('julian date of J2000 epoch', () => {
    expect(julianDate(civilDate(2000, 1, 1), 12.0)).toBe(2451545.0);
    expect(dayNumberOf(31, 10, 2026)).toBe(2461345);
  });

  test('julian day round trips over two centuries', () => {
    for (let jdn = dayNumberOf(1, 1, 1900); jdn < dayNumberOf(1, 1, 2101); jdn++) {
      if (dayNumber(toCivil(jdn)) !== jdn) throw new Error(`jdn ${jdn}`);
    }
  });

  test('day pillars match reference dates', () => {
    expect(vi(dayPillar(dayNumberOf(1, 1, 2000)))).toBe('Mậu Ngọ');
    expect(vi(dayPillar(dayNumberOf(31, 10, 2026)))).toBe('Mậu Dần');
  });

  test('lunar mansions match reference dates', () => {
    const got = [day(31, 10, 2026), day(25, 8, 2026), day(1, 1, 1995)].map(mansion);
    expect(got).toEqual([Mansion.STOMACH, Mansion.TAIL, Mansion.EMPTINESS]);
  });

  test('sun mansions Phong Hu Mao Tinh always fall on Sunday', () => {
    const sunMansions = new Set([Mansion.ROOM, Mansion.EMPTINESS, Mansion.HAIRY_HEAD, Mansion.STAR]);
    for (let jdn = day(1, 1, 1900); jdn < day(1, 1, 2101); jdn++) {
      if (sunMansions.has(mansion(jdn)) && weekday(jdn) !== 0) throw new Error(`jdn ${jdn}`);
    }
  });

  test('life trigram for reference years', () => {
    expect([lifeTrigram(1990, true), lifeTrigram(1990, false)]).toEqual([Trigram.KAN, Trigram.GEN]);
    expect([lifeTrigram(2000, true), lifeTrigram(2000, false)]).toEqual([Trigram.LI, Trigram.QIAN]);
    expect([lifeTrigram(1975, true), lifeTrigram(1975, false)]).toEqual([Trigram.DUI, Trigram.GEN]);
  });

  test('nap am elements of sample pairs', () => {
    const samples: [ReturnType<typeof sb>, Element][] = [
      [sb(0, 0), Element.METAL], [sb(2, 2), Element.FIRE], [sb(4, 4), Element.WOOD],
      [sb(6, 6), Element.EARTH], [sb(8, 8), Element.METAL], [sb(0, 10), Element.FIRE],
      [sb(2, 0), Element.WATER], [sb(8, 6), Element.WOOD], [sb(6, 4), Element.METAL],
      [sb(4, 0), Element.FIRE],
    ];
    for (const [pair, element] of samples) expect([vi(pair), napAm(pair)]).toEqual([vi(pair), element]);
  });

  test('lunar new year differs between Vietnam and China', () => {
    expect(tet(1985)).toEqual([civilDate(1985, 1, 21), civilDate(1985, 2, 20)]);
    expect(tet(2007)).toEqual([civilDate(2007, 2, 17), civilDate(2007, 2, 18)]);
    expect(tet(1968)).toEqual([civilDate(1968, 1, 29), civilDate(1968, 1, 30)]);
  });

  test('solar to lunar reference dates', () => {
    expect(toLunar(civilDate(2026, 10, 31))).toEqual(lunarDate(2026, 9, 22));
    expect(toLunar(civilDate(1974, 12, 13), VIETNAM_OFFSET)).toEqual(lunarDate(1974, 11, 1));
    expect(toLunar(civilDate(1974, 12, 13), CHINA_OFFSET)).toEqual(lunarDate(1974, 10, 30));
    expect(toLunar(civilDate(2000, 8, 16))).toEqual(lunarDate(2000, 7, 17));
    expect(toLunar(civilDate(1991, 3, 7))).toEqual(lunarDate(1991, 1, 21));
  });

  test('leap months by meridian', () => {
    expect(leapMonthOf(2025)).toBe(6);
    expect(leapMonthOf(1984, VIETNAM_OFFSET)).toBeNull();
    expect(leapMonthOf(1984, CHINA_OFFSET)).toBe(10);
    expect(leapMonthOf(2026)).toBeNull();
  });

  test('lunar to solar inverts solar to lunar for every third day 1901 to 2099', () => {
    for (const offset of [VIETNAM_OFFSET, CHINA_OFFSET]) {
      for (let jdn = day(1, 1, 1901); jdn < day(31, 12, 2099); jdn += 3) {
        const solar = toCivil(jdn);
        const lunar = toLunar(solar, offset);
        const back = toSolar(lunar, offset);
        if (back === null || dayNumber(back) !== jdn) {
          throw new Error(`${JSON.stringify(lunar)} @ ${offset}`);
        }
      }
    }
  });

  test('non existent leap month has no solar date', () => {
    expect(toSolar(lunarDate(2026, 3, 1, true))).toBeNull();
    expect(toSolar(lunarDate(2025, 6, 1, true))).toEqual(civilDate(2025, 7, 25));
  });

  test('lunar month lengths are 29 or 30 and sum to the year', () => {
    const lengths = Array.from({ length: 12 }, (_, i) => monthLength(lunarDate(2026, i + 1, 1))!);
    expect(lengths.every((l) => l === 29 || l === 30)).toBe(true);
    const newYear = toSolar(lunarDate(2026, 1, 1))!;
    const nextNewYear = toSolar(lunarDate(2027, 1, 1))!;
    expect(lengths.reduce((a, b) => a + b, 0)).toBe(dayNumber(nextNewYear) - dayNumber(newYear));
  });

  test('day 30 of a 29 day month has no solar date', () => {
    const short = Array.from({ length: 12 }, (_, i) => i + 1).find((m) => monthLength(lunarDate(2026, m, 1)) === 29)!;
    expect(toSolar(lunarDate(2026, short, 30))).toBeNull();
    expect(monthLength(lunarDate(2026, 3, 1, true))).toBeNull();
  });

  test('invalid dates and ranges are rejected', () => {
    expect(() => civilDate(2023, 2, 29)).toThrow(RangeError);
    expect(() => civilDate(2023, 4, 31)).toThrow(RangeError);
    expect(civilDate(2024, 2, 29).day).toBe(29);
    expect(() => lunarDate(2026, 13, 1)).toThrow(RangeError);
    expect(() => lunarDate(2026, 1, 31)).toThrow(RangeError);
    expect(() => toLunar(civilDate(1850, 1, 1))).toThrow(RangeError);
    expect(() => toLunar(civilDate(2000, 1, 1), 15.0)).toThrow(RangeError);
    expect(() => sb(0, 1)).toThrow(RangeError);
  });

  test('solar term lookup wraps negative longitudes', () => {
    expect(solarTermAt(-15.0)).toBe(solarTermAt(345.0));
    expect(solarTermAt(360.0)).toBe(solarTermAt(0.0));
  });

  test('day almanac for 31 October 2026', () => {
    const almanac = almanacDay(civilDate(2026, 10, 31), VIETNAM_OFFSET);
    expect(almanac.weekday).toBe(6);
    expect(vi(almanac.dayPillar)).toBe('Mậu Dần');
    // Solar month Tuất (Hàn lộ → Lập đông); a Dần day is 4 steps after Tuất = Định.
    expect(almanac.officer).toBe(DayOfficer.STABLE);
    expect(almanac.solarTerm).toBe(SolarTerm.FROST_DESCENT);
    expect(almanac.auspiciousHours.map(viBranch)).toEqual(['Tý', 'Sửu', 'Thìn', 'Tỵ', 'Mùi', 'Tuất']);
  });

  test('auspicious hours follow the six day patterns', () => {
    const expected: [Branch, string][] = [
      [Branch.ZI, 'Tý Sửu Mão Ngọ Thân Dậu'],
      [Branch.CHOU, 'Dần Mão Tỵ Thân Tuất Hợi'],
      [Branch.YIN, 'Tý Sửu Thìn Tỵ Mùi Tuất'],
      [Branch.MAO, 'Tý Dần Mão Ngọ Mùi Dậu'],
      [Branch.CHEN, 'Dần Thìn Tỵ Thân Dậu Hợi'],
      [Branch.SI, 'Sửu Thìn Ngọ Mùi Tuất Hợi'],
    ];
    for (const [d, hours] of expected) {
      expect(auspiciousHours(d).map(viBranch).join(' ')).toBe(hours);
      expect(auspiciousHours(branchPlus(d, 6)).map(viBranch).join(' ')).toBe(hours);
    }
  });

  test('day officer is Establish when day branch equals month branch', () => {
    for (const b of BRANCHES) expect(officer(b, b)).toBe(DayOfficer.ESTABLISH);
  });
});
