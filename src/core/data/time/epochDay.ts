import { civilDate, lengthOfMonth, type CivilDate } from '../../../engine/time/civilDate';
import { dayNumber, toCivil } from '../../../engine/time/julianDay';
import { mod } from '../../../engine/util';

/** Julian Day Number of 1970-01-01, epoch day 0. */
const UNIX_EPOCH_JDN = 2440588;
const MONTHS_PER_YEAR = 12;

/** Days since 1970-01-01, like `LocalDate.toEpochDay()`. */
export const epochDayOf = (date: CivilDate): number => dayNumber(date) - UNIX_EPOCH_JDN;

/** Like `LocalDate.ofEpochDay()`. */
export const civilOfEpochDay = (epochDay: number): CivilDate => toCivil(epochDay + UNIX_EPOCH_JDN);

/** Like `LocalDate.plusMonths()`: the day is clamped to the end of a shorter month. */
export function plusMonths(epochDay: number, months: number): number {
  const date = civilOfEpochDay(epochDay);
  const total = date.year * MONTHS_PER_YEAR + (date.month - 1) + months;
  const year = Math.floor(total / MONTHS_PER_YEAR);
  const month = mod(total, MONTHS_PER_YEAR) + 1;
  return epochDayOf(civilDate(year, month, Math.min(date.day, lengthOfMonth(year, month))));
}

/** Like `LocalDate.plusYears()`: 29 February becomes 28 February in a common year. */
export const plusYears = (epochDay: number, years: number): number => plusMonths(epochDay, years * MONTHS_PER_YEAR);
