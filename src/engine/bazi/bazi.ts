import { sunApparentLongitude, sunCrossing, FULL_CIRCLE } from '../astro/sun';
import { Branch, branchOf, branchPlus, stemBranch, stemIsYang, stemOf, stemPlus, type Stem, type StemBranch } from '../ganzhi/ganzhi';
import { MAX_UTC_OFFSET, MIN_UTC_OFFSET, type CivilDate } from '../time/civilDate';
import { dayNumber, julianDate } from '../time/julianDay';
import { idiv, mod, require } from '../util';

const MINUTES_PER_HOUR = 60.0;
const LATE_ZI_HOUR = 23;
const SPRING_START_DEG = 315.0;
const AUTUMN_EQUINOX_DEG = 180.0;
const MONTH_ARC_DEG = 30.0;
const DAYS_PER_LUCK_YEAR = 3.0;

/** Local civil time of birth (clock time, not solar time) and its UTC offset in hours. */
export interface BirthMoment {
  readonly date: CivilDate;
  readonly hour: number;
  readonly minute: number;
  readonly utcOffsetHours: number;
}

export function birthMoment(date: CivilDate, hour: number, minute: number, utcOffsetHours: number): BirthMoment {
  require(Number.isInteger(hour) && hour >= 0 && hour <= 23, `hour out of range: ${hour}`);
  require(Number.isInteger(minute) && minute >= 0 && minute <= 59, `minute out of range: ${minute}`);
  require(utcOffsetHours >= MIN_UTC_OFFSET && utcOffsetHours <= MAX_UTC_OFFSET, `UTC offset out of range: ${utcOffsetHours}`);
  return Object.freeze({ date, hour, minute, utcOffsetHours });
}

export function momentJulianDate(m: BirthMoment): number {
  return julianDate(m.date, m.hour + m.minute / MINUTES_PER_HOUR - m.utcOffsetHours);
}

/** How the Zi hour (23:00–01:00) splits the day. */
export enum ZiHourMode {
  /** The new day (and its day pillar) starts at 23:00. */
  DAY_CHANGES_AT_23,
  /** "Late Zi": 23:00–24:00 keeps the current day pillar but takes the next day's hour stem. */
  SPLIT_EARLY_LATE,
}

export interface FourPillars {
  readonly year: StemBranch;
  readonly month: StemBranch;
  readonly day: StemBranch;
  readonly hour: StemBranch;
}

/** Four Pillars of Destiny (Tứ trụ / Bát tự). Years and months follow the solar terms. */
export function pillars(moment: BirthMoment, ziMode: ZiHourMode = ZiHourMode.DAY_CHANGES_AT_23): FourPillars {
  const jd = momentJulianDate(moment);
  const sunLon = sunApparentLongitude(jd);
  const year = yearPillarAt(moment.date, sunLon);
  const month = monthPillarFor(year.stem, sunLon);

  const lateZi = moment.hour >= LATE_ZI_HOUR;
  const dayShift = lateZi && ziMode === ZiHourMode.DAY_CHANGES_AT_23 ? 1 : 0;
  const day = dayPillar(dayNumber(moment.date) + dayShift);

  const hb = hourBranch(moment.hour);
  const hourStemDay = lateZi && ziMode === ZiHourMode.SPLIT_EARLY_LATE ? stemPlus(day.stem, 1) : day.stem;
  const hour = stemBranch(hourStem(hourStemDay, hb), hb);

  return Object.freeze({ year, month, day, hour });
}

/** Day pillar of a Julian Day Number (the sexagenary day count). */
export function dayPillar(jdn: number): StemBranch {
  return stemBranch(stemOf(jdn + 9), branchOf(jdn + 1));
}

/** Branch of the clock hour: Tý = 23:00–01:00, Sửu = 01:00–03:00, … */
export function hourBranch(hour: number): Branch {
  return branchOf(idiv(hour + 1, 2));
}

/** Stem of an hour, from the day stem (Ngũ thử độn). */
export function hourStem(dayStem: Stem, hb: Branch): Stem {
  return stemOf((dayStem % 5) * 2 + hb);
}

/** Solar month index 0..11 counted from Lập Xuân (315°). */
export function solarMonthIndex(sunLongitude: number): number {
  return Math.floor(mod(sunLongitude - SPRING_START_DEG, FULL_CIRCLE) / MONTH_ARC_DEG);
}

/** Branch of the solar month: Dần from Lập Xuân, Mão from Kinh Trập, … */
export function monthBranch(sunLongitude: number): Branch {
  return branchPlus(Branch.YIN, solarMonthIndex(sunLongitude));
}

/**
 * Age in years at which the first 10-year luck pillar starts: days to the next (forward) or
 * previous (backward) month-starting solar term, divided by 3.
 */
export function luckStartYears(moment: BirthMoment, isMale: boolean): number {
  const jd = momentJulianDate(moment);
  const sunLon = sunApparentLongitude(jd);
  const yangYear = stemIsYang(yearPillarAt(moment.date, sunLon).stem);
  const forward = yangYear === isMale;
  const termBefore = SPRING_START_DEG + MONTH_ARC_DEG * solarMonthIndex(sunLon);
  const target = mod(forward ? termBefore + MONTH_ARC_DEG : termBefore, FULL_CIRCLE);
  const termJd = sunCrossing(target, jd, forward);
  return Math.abs(termJd - jd) / DAYS_PER_LUCK_YEAR;
}

function yearPillarAt(date: CivilDate, sunLon: number): StemBranch {
  // Before Lập Xuân, January/February still belong to the previous year.
  const beforeSpring = date.month <= 2 && sunLon >= AUTUMN_EQUINOX_DEG && sunLon < SPRING_START_DEG;
  const year = beforeSpring ? date.year - 1 : date.year;
  return stemBranch(stemOf(year + 6), branchOf(year + 8));
}

function monthPillarFor(yearStem: Stem, sunLon: number): StemBranch {
  const index = solarMonthIndex(sunLon);
  // Ngũ hổ độn: the Dần month stem follows from the year stem.
  const stem = stemOf((yearStem % 5) * 2 + 2 + index);
  return stemBranch(stem, branchPlus(Branch.YIN, index));
}
