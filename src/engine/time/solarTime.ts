import { roundToInt } from '../util';
import { isLeapYear, type CivilDate } from './civilDate';
import { dayNumber, dayNumberOf, HOURS_PER_DAY } from './julianDay';

/** Earth turns one degree of longitude in four minutes. */
const MINUTES_PER_DEGREE = 4.0;
const MINUTES_PER_HOUR = 60.0;
const MINUTES_PER_RADIAN = 229.18;
const NOON = 12.0;
const YEAR_DAYS = 365;
const LEAP_YEAR_DAYS = 366;

/**
 * Equation of time in minutes (apparent minus mean solar time) for [date] at UTC hour [hourUt].
 * NOAA/Spencer series; error under half a minute, plenty for picking a two-hour Chinese hour.
 */
export function equationOfTime(date: CivilDate, hourUt: number = NOON): number {
  const dayOfYear = dayNumber(date) - dayNumberOf(1, 1, date.year) + 1;
  const yearDays = isLeapYear(date.year) ? LEAP_YEAR_DAYS : YEAR_DAYS;
  const g = ((2 * Math.PI) / yearDays) * (dayOfYear - 1 + (hourUt - NOON) / HOURS_PER_DAY);
  return (
    MINUTES_PER_RADIAN *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  );
}

/**
 * True solar time, in minutes after local midnight (may fall outside 0..1439 near midnight,
 * meaning the previous or next day), for a clock reading of [clockMinutes] on [date] at a place
 * at [longitude] (east positive) keeping UTC+[utcOffsetMinutes].
 */
export function trueSolarMinutes(date: CivilDate, clockMinutes: number, utcOffsetMinutes: number, longitude: number): number {
  const meridianShift = MINUTES_PER_DEGREE * (longitude - utcOffsetMinutes / MINUTES_PER_DEGREE);
  const hourUt = (clockMinutes - utcOffsetMinutes) / MINUTES_PER_HOUR;
  return roundToInt(clockMinutes + meridianShift + equationOfTime(date, hourUt));
}
