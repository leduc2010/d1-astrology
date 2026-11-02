import { DEG } from '../astro/sun';
import { branchPlus, Branch, stemBranch, stemOf, type StemBranch } from '../ganzhi/ganzhi';
import { MAX_UTC_OFFSET, MIN_UTC_OFFSET, type CivilDate } from '../time/civilDate';
import { dayNumber, dayNumberOf, J2000, toCivil } from '../time/julianDay';
import { mod, require } from '../util';

/** A date in the Vietnamese / Chinese lunisolar calendar. [month] 1..12, [day] 1..30. */
export interface LunarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly isLeapMonth: boolean;
}

export function lunarDate(year: number, month: number, day: number, isLeapMonth = false): LunarDate {
  require(Number.isInteger(month) && month >= 1 && month <= 12, `lunar month out of range: ${month}`);
  require(Number.isInteger(day) && day >= 1 && day <= 30, `lunar day out of range: ${day}`);
  return Object.freeze({ year, month, day, isLeapMonth });
}

export const sameLunarDate = (a: LunarDate, b: LunarDate): boolean =>
  a.year === b.year && a.month === b.month && a.day === b.day && a.isLeapMonth === b.isLeapMonth;

/**
 * Lunisolar calendar after Hồ Ngọc Đức's algorithm (simplified Meeus new moons). The calendar
 * depends on the meridian: pass the zone offset in hours — 7.0 for Vietnam, 8.0 for China.
 */
export const VIETNAM_OFFSET = 7.0;
export const CHINA_OFFSET = 8.0;

/** Years the new-moon and solar-term series are trusted for. */
export const SUPPORTED_YEARS = { first: 1900, last: 2100 } as const;

/** A Giáp Tý year, where the sexagenary cycle restarts. */
const CYCLE_EPOCH = 1984;
const STEM_PAIRS = 5;
const FIRST_MONTH_STEM = 2;
const NEW_MOON_EPOCH = 2415021.076998695;
const SYNODIC_MONTH = 29.530588853;
const HOURS = 24.0;
const TWO_PI = Math.PI * 2;
const MONTHS = 12;
const DAYS_PER_YEAR = 365;
const MIN_MONTH_DAYS = 29;
const WINTER_SECTOR = 9;
const MAX_LEAP_SEARCH = 14;

export function toLunar(date: CivilDate, utcOffsetHours: number = VIETNAM_OFFSET): LunarDate {
  requireSupported(date.year, utcOffsetHours);
  const tz = utcOffsetHours;
  const dn = dayNumber(date);
  // The estimate can sit one lunation late near the series' rounding edges, so step back until
  // the new moon is on or before the date.
  let k = Math.floor((dn - NEW_MOON_EPOCH) / SYNODIC_MONTH) + 1;
  let monthStart = newMoonDay(k, tz);
  while (monthStart > dn) {
    k -= 1;
    monthStart = newMoonDay(k, tz);
  }
  let a11 = lunarMonth11(date.year, tz);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = date.year;
    a11 = lunarMonth11(date.year - 1, tz);
  } else {
    lunarYear = date.year + 1;
    b11 = lunarMonth11(date.year + 1, tz);
  }
  const lunarDay = dn - monthStart + 1;
  const diff = Math.trunc((monthStart - a11) / MIN_MONTH_DAYS);
  let isLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > DAYS_PER_YEAR) {
    const leapDiff = leapMonthOffset(a11, tz);
    if (diff >= leapDiff) {
      lunarMonth = diff + 10;
      isLeap = diff === leapDiff;
    }
  }
  if (lunarMonth > MONTHS) lunarMonth -= MONTHS;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return lunarDate(lunarYear, lunarMonth, lunarDay, isLeap);
}

/**
 * Solar date of a lunar date, or null if that lunar date does not exist (a non-leap year's
 * "leap" month, or day 30 of a 29-day month).
 */
export function toSolar(lunar: LunarDate, utcOffsetHours: number = VIETNAM_OFFSET): CivilDate | null {
  const start = monthStartDay(lunar, utcOffsetHours);
  if (start === null) return null;
  const length = newMoonAfter(start, utcOffsetHours) - start;
  if (lunar.day > length) return null;
  return toCivil(start + lunar.day - 1);
}

/** Number of days (29 or 30) in the lunar month that contains [lunar], or null if that month does not exist. */
export function monthLength(lunar: LunarDate, utcOffsetHours: number = VIETNAM_OFFSET): number | null {
  const start = monthStartDay(lunar, utcOffsetHours);
  if (start === null) return null;
  return newMoonAfter(start, utcOffsetHours) - start;
}

/** Day number of day 1 of [lunar]'s month, or null if the month does not exist. */
function monthStartDay(lunar: LunarDate, utcOffsetHours: number): number | null {
  requireSupported(lunar.year, utcOffsetHours);
  const tz = utcOffsetHours;
  const [a11, b11] =
    lunar.month < 11
      ? [lunarMonth11(lunar.year - 1, tz), lunarMonth11(lunar.year, tz)]
      : [lunarMonth11(lunar.year, tz), lunarMonth11(lunar.year + 1, tz)];
  const k = Math.floor(0.5 + (a11 - NEW_MOON_EPOCH) / SYNODIC_MONTH);
  let offset = mod(lunar.month - 11, MONTHS);
  if (b11 - a11 > DAYS_PER_YEAR) {
    const leapOffset = leapMonthOffset(a11, tz);
    if (lunar.isLeapMonth && lunar.month !== monthOfOffset(leapOffset)) return null;
    if (lunar.isLeapMonth || offset >= leapOffset) offset += 1;
  } else if (lunar.isLeapMonth) {
    return null;
  }
  return newMoonDay(k + offset, tz);
}

/** Day number of the first new moon strictly after month start [dn]. */
function newMoonAfter(dn: number, tz: number): number {
  let k = Math.floor((dn - NEW_MOON_EPOCH) / SYNODIC_MONTH + 0.5);
  let day = newMoonDay(k, tz);
  while (day <= dn) {
    k += 1;
    day = newMoonDay(k, tz);
  }
  return day;
}

function requireSupported(year: number, utcOffsetHours: number): void {
  require(
    year >= SUPPORTED_YEARS.first && year <= SUPPORTED_YEARS.last,
    `year ${year} outside supported range ${SUPPORTED_YEARS.first}..${SUPPORTED_YEARS.last}`,
  );
  require(utcOffsetHours >= MIN_UTC_OFFSET && utcOffsetHours <= MAX_UTC_OFFSET, `UTC offset out of range: ${utcOffsetHours}`);
}

/** Name of a lunar year in the sexagenary cycle: 1984 is Giáp Tý, 1995 is Ất Hợi. */
export function yearPillar(lunarYear: number): StemBranch {
  return stemBranch(stemOf(lunarYear - CYCLE_EPOCH), mod(lunarYear - CYCLE_EPOCH, 12) as Branch);
}

/**
 * Pillar of a lunar month: month 1 is always a Dần month, and its stem follows the year stem
 * (Giáp/Kỷ years open with Bính Dần). A leap month shares the pillar of the month it repeats.
 */
export function monthPillar(lunar: LunarDate): StemBranch {
  const yearStem = yearPillar(lunar.year).stem;
  const index = lunar.month - 1;
  return stemBranch(stemOf((yearStem % STEM_PAIRS) * 2 + FIRST_MONTH_STEM + index), branchPlus(Branch.YIN, index));
}

/** The leap month (1..12) of [lunarYear], or null when the year has none. */
export function leapMonthOf(lunarYear: number, utcOffsetHours: number = VIETNAM_OFFSET): number | null {
  const tz = utcOffsetHours;
  // Window 1 holds months 11, 12 of the previous year and 1..10 of this one.
  const first = leapIn(lunarMonth11(lunarYear - 1, tz), lunarMonth11(lunarYear, tz), tz);
  if (first !== null && first >= 1 && first <= 10) return first;
  // Window 2 holds months 11, 12 of this year.
  const second = leapIn(lunarMonth11(lunarYear, tz), lunarMonth11(lunarYear + 1, tz), tz);
  return second !== null && second >= 11 ? second : null;
}

function leapIn(a11: number, b11: number, tz: number): number | null {
  if (b11 - a11 <= DAYS_PER_YEAR) return null;
  return monthOfOffset(leapMonthOffset(a11, tz));
}

/** Month number (1..12) of a leap month [leapOffset] months after month 11 (it repeats the month before it). */
function monthOfOffset(leapOffset: number): number {
  const month = mod(leapOffset + 10, MONTHS);
  return month === 0 ? MONTHS : month;
}

/** Julian Date of the k-th new moon after 1900-01-01. */
export function newMoon(k: number): number {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const sin = Math.sin;
  let jd = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
  jd += 0.00033 * sin((166.56 + 132.87 * t - 0.009173 * t2) * DEG);
  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const mPrime = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
  const c1 =
    (0.1734 - 0.000393 * t) * sin(m * DEG) + 0.0021 * sin(2 * DEG * m) -
    0.4068 * sin(mPrime * DEG) + 0.0161 * sin(DEG * 2 * mPrime) -
    0.0004 * sin(DEG * 3 * mPrime) +
    0.0104 * sin(DEG * 2 * f) - 0.0051 * sin(DEG * (m + mPrime)) -
    0.0074 * sin(DEG * (m - mPrime)) + 0.0004 * sin(DEG * (2 * f + m)) -
    0.0004 * sin(DEG * (2 * f - m)) - 0.0006 * sin(DEG * (2 * f + mPrime)) +
    0.001 * sin(DEG * (2 * f - mPrime)) + 0.0005 * sin(DEG * (2 * mPrime + m));
  const deltaT =
    t < -11
      ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
      : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return jd + c1 - deltaT;
}

const newMoonDay = (k: number, tz: number): number => Math.floor(newMoon(k) + 0.5 + tz / HOURS);

/** Sun longitude at Julian date [jdn], in radians [0, 2π). */
function sunLongitudeRad(jdn: number): number {
  const t = (jdn - J2000) / 36525;
  const t2 = t * t;
  const m = 357.5291 + 35999.0503 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
  const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  const dl =
    (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(DEG * m) +
    (0.019993 - 0.000101 * t) * Math.sin(DEG * 2 * m) + 0.00029 * Math.sin(DEG * 3 * m);
  const l = (l0 + dl) * DEG;
  return l - TWO_PI * Math.floor(l / TWO_PI);
}

/** Which 30° sector (0..11) the Sun is in at the local midnight starting [dn]. */
const sunSector = (dn: number, tz: number): number => Math.floor((sunLongitudeRad(dn - 0.5 - tz / HOURS) / Math.PI) * 6);

/** Day number of the start of lunar month 11 (the one containing the winter solstice) of [year]. */
function lunarMonth11(year: number, tz: number): number {
  const off = dayNumberOf(31, 12, year) - 2415021;
  const k = Math.floor(off / SYNODIC_MONTH);
  const nm = newMoonDay(k, tz);
  return sunSector(nm, tz) >= WINTER_SECTOR ? newMoonDay(k - 1, tz) : nm;
}

function leapMonthOffset(a11: number, tz: number): number {
  const k = Math.floor((a11 - NEW_MOON_EPOCH) / SYNODIC_MONTH + 0.5);
  let i = 1;
  let arc = sunSector(newMoonDay(k + i, tz), tz);
  let last: number;
  do {
    last = arc;
    i++;
    arc = sunSector(newMoonDay(k + i, tz), tz);
  } while (arc !== last && i < MAX_LEAP_SEARCH);
  return i - 1;
}
