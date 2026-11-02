import { require } from '../util';

/** Widest real-world UTC offsets (Baker Island to Kiribati), in hours. */
export const MIN_UTC_OFFSET = -12.0;
export const MAX_UTC_OFFSET = 14.0;

/** A proleptic Gregorian calendar date. [month] is 1..12. */
export interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function lengthOfMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

export function isValidCivilDate(year: number, month: number, day: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= lengthOfMonth(year, month)
  );
}

/** Builds a validated, frozen date (Kotlin `CivilDate(year, month, day)`). */
export function civilDate(year: number, month: number, day: number): CivilDate {
  require(month >= 1 && month <= 12, `month out of range: ${month}`);
  require(isValidCivilDate(year, month, day), `day out of range: ${year}-${month}-${day}`);
  return Object.freeze({ year, month, day });
}

export function sameDate(a: CivilDate, b: CivilDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function compareDates(a: CivilDate, b: CivilDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** ISO `yyyy-mm-dd`, for keys and logs. */
export function isoDate(d: CivilDate): string {
  return `${String(d.year).padStart(4, '0')}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

/** Parses `yyyy-mm-dd`; null when malformed or impossible. */
export function parseIsoDate(text: string): CivilDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return isValidCivilDate(y, mo, d) ? civilDate(y, mo, d) : null;
}
