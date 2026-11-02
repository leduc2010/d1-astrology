import { idiv, mod } from '../util';
import { civilDate, type CivilDate } from './civilDate';

/** Julian day arithmetic (Fliegel–Van Flandern). All functions are pure. */
export const HOURS_PER_DAY = 24.0;
/** J2000.0 epoch (2000-01-01 12:00 TT). */
export const J2000 = 2451545.0;

/** Julian Day Number (the integer day that starts at noon UT) of a Gregorian date. */
export function dayNumberOf(day: number, month: number, year: number): number {
  const a = idiv(14 - month, 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + idiv(153 * m + 2, 5) + 365 * y + idiv(y, 4) - idiv(y, 100) + idiv(y, 400) - 32045;
}

export function dayNumber(date: CivilDate): number {
  return dayNumberOf(date.day, date.month, date.year);
}

/** Julian Date of a UT instant on a civil date, [hourUt] in fractional hours. */
export function julianDate(date: CivilDate, hourUt: number): number {
  return dayNumber(date) - 0.5 + hourUt / HOURS_PER_DAY;
}

/** Gregorian date of a Julian Day Number. */
export function toCivil(jdn: number): CivilDate {
  const a = jdn + 32044;
  const b = idiv(4 * a + 3, 146097);
  const c = a - idiv(b * 146097, 4);
  const d = idiv(4 * c + 3, 1461);
  const e = c - idiv(1461 * d, 4);
  const m = idiv(5 * e + 2, 153);
  return civilDate(b * 100 + d - 4800 + idiv(m, 10), m + 3 - 12 * idiv(m, 10), e - idiv(153 * m + 2, 5) + 1);
}

/** Day of week of a Julian Day Number: 0 = Sunday … 6 = Saturday. */
export function weekday(jdn: number): number {
  return mod(jdn + 1, 7);
}

/** The date [days] after [date] (negative goes back). */
export function plusDays(date: CivilDate, days: number): CivilDate {
  return toCivil(dayNumber(date) + days);
}
