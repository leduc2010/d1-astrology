import { Planet } from '../../../engine/astro/planets';
import { dayPillar, hourStem } from '../../../engine/bazi/bazi';
import { Branch, Stem, stemBranch } from '../../../engine/ganzhi/ganzhi';
import { lunarDate } from '../../../engine/lunar/lunarCalendar';
import { civilDate, type CivilDate } from '../../../engine/time/civilDate';
import { dayNumber } from '../../../engine/time/julianDay';
import { birthClock, birthPlace, Gender, type BirthPlace, type BirthProfile } from '../../model';
import { resolveBirth } from '../chart/resolvedBirth';
import { BirthZones } from '../place/birthZones';
import { PlaceCatalog } from '../place/placeCatalog';

// Port of ResolvedBirthTest. Made-up birth data only.
const first = (query: string): BirthPlace => {
  const place = PlaceCatalog.search(query)[0];
  if (!place) throw new Error(`nothing found for ${query}`);
  return place;
};

const haDong = first('ha dong');
const profile: BirthProfile = {
  name: 'Minh Anh',
  gender: Gender.FEMALE,
  date: { year: 1995, month: 8, day: 15 },
  clock: birthClock(11, 30),
  place: haDong,
  enteredAsLunar: false,
};
const date = (year: number, month: number, day: number) => ({ year, month, day });
const dayPillarOf = (d: CivilDate) => dayPillar(dayNumber(d));

describe('ResolvedBirth', () => {
  test('resolves lunar date, offset and true solar time', () => {
    const birth = resolveBirth(profile);
    expect(birth.lunarDate).toEqual(lunarDate(1995, 7, 20));
    expect(birth.lunarYearPillar).toEqual(stemBranch(Stem.YI, Branch.HAI));
    expect(birth.utcOffsetMinutes).toBe(7 * 60);
    expect(birth.trueSolarMinutes).not.toBeNull();
    expect(birth.trueSolarMinutes!).toBeGreaterThanOrEqual(11 * 60 + 27);
    expect(birth.trueSolarMinutes!).toBeLessThanOrEqual(11 * 60 + 30);
    expect(birth.hourBranch).toBe(Branch.WU);
  });

  test('pillars match the reference day and take the hour from true solar time', () => {
    const pillars = resolveBirth(profile).pillars();
    expect(pillars.day).toEqual(stemBranch(Stem.WU, Branch.YIN));
    expect(pillars.year).toEqual(stemBranch(Stem.YI, Branch.HAI));
    expect(pillars.hour?.branch).toBe(Branch.WU);
  });

  test('true solar time can move the hour across a branch boundary', () => {
    // Sài Gòn 1965 kept UTC+8: a 13:05 clock reading is about 12:10 by the Sun, still the Horse hour.
    const birth = resolveBirth({ ...profile, date: date(1965, 6, 1), clock: birthClock(13, 5), place: first('sai gon') });
    expect(birth.utcOffsetMinutes).toBe(8 * 60);
    expect(birth.hourBranch).toBe(Branch.WU);
  });

  test('unknown time gives three pillars and no hour', () => {
    const birth = resolveBirth({ ...profile, clock: null });
    expect(birth.trueSolarMinutes).toBeNull();
    expect(birth.hourBranch).toBeNull();
    expect(birth.pillars().hour).toBeNull();
  });

  test('sun sits in Leo in mid August', () => {
    const longitude = resolveBirth(profile).sunLongitude();
    expect(longitude).toBeGreaterThanOrEqual(120.0);
    expect(longitude).toBeLessThanOrEqual(150.0);
  });

  test('tu vi chart needs a birth time', () => {
    expect(resolveBirth({ ...profile, clock: null }).ziWei()).toBeNull();
    expect(resolveBirth(profile).pillars().hour?.branch).toBe(Branch.WU);
    expect(resolveBirth(profile).ziWei()).not.toBeNull();
  });

  test('late clock time west of the zone meridian stays on the same day', () => {
    // Sài Gòn 1970 kept UTC+8: 23:30 on the clock is about 22:40 by the Sun — still the Pig hour.
    const birth = resolveBirth({ ...profile, date: date(1970, 6, 10), clock: birthClock(23, 30), place: first('sai gon') });
    expect(birth.hourBranch).toBe(Branch.HAI);
    expect(birth.chartDayShift).toBe(0);
    expect(birth.pillars().day).toEqual(dayPillarOf(civilDate(1970, 6, 10)));
  });

  test('true solar Rat hour before midnight moves the chart to the next day', () => {
    // Tokyo in early November: 22:50 on the clock is about 23:25 by the Sun.
    const birth = resolveBirth({ ...profile, date: date(1995, 11, 3), clock: birthClock(22, 50), place: first('tokyo') });
    expect(birth.hourBranch).toBe(Branch.ZI);
    expect(birth.chartDate).toEqual(civilDate(1995, 11, 4));
    const pillars = birth.pillars();
    expect(pillars.day).toEqual(dayPillarOf(civilDate(1995, 11, 4)));
    expect(pillars.hour?.stem).toBe(hourStem(pillars.day.stem, Branch.ZI));
  });

  test('early clock time after midnight keeps the clock date', () => {
    const birth = resolveBirth({ ...profile, clock: birthClock(0, 20) });
    expect(birth.hourBranch).toBe(Branch.ZI);
    expect(birth.chartDayShift).toBe(0);
    expect(birth.pillars().day).toEqual(dayPillarOf(civilDate(1995, 8, 15)));
  });

  test('unknown time gives every Moon sign of the day, a known time just one', () => {
    expect(resolveBirth(profile).moonSigns()).toHaveLength(1);
    const days = Array.from({ length: 30 }, (_, i) => resolveBirth({ ...profile, date: date(2000, 1, 1 + i), clock: null }));
    for (const birth of days) {
      const signs = birth.moonSigns();
      expect(signs.length).toBeGreaterThanOrEqual(1);
      expect(signs.length).toBeLessThanOrEqual(2);
      expect(signs).toContain(birth.natal().planets.get(Planet.MOON)!.sign);
    }
    // The Moon changes sign every two and a half days or so, so a month has several two-sign days.
    expect(days.filter((it) => it.moonSigns().length === 2).length).toBeGreaterThanOrEqual(8);
  });

  test('Tet Mau Than 1968 counts a day later in the South', () => {
    const north = resolveBirth({ ...profile, date: date(1968, 1, 29) });
    const south = resolveBirth({ ...north.profile, place: first('sai gon') });
    expect(north.lunarDate).toEqual(lunarDate(1968, 1, 1));
    expect(south.lunarDate).toEqual(lunarDate(1967, 12, 30));
  });

  test('typed coordinates in the South with a fixed offset still use the Southern calendar', () => {
    const typed = birthPlace('10.78°N, 106.70°E', '', 10.78, 106.7, BirthZones.fixedOffsetZone(8 * 60));
    const birth = resolveBirth({ ...profile, date: date(1968, 1, 29), place: typed });
    expect(birth.lunarDate).toEqual(lunarDate(1967, 12, 30));
    expect(BirthZones.isSouthVietnam({ ...typed, latitude: 21.03, longitude: 105.85 })).toBe(false);
    // Bangkok is not Vietnam.
    expect(BirthZones.isSouthVietnam({ ...typed, latitude: 13.75, longitude: 100.5 })).toBe(false);
  });
});
