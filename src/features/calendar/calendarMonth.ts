import { WeekStart } from '@/core/model';
import {
  almanacDay,
  CALENDAR_OFFSET,
  civilDate,
  type CivilDate,
  type DayAlmanac,
  dayNumberOf,
  sameDate,
  toCivil,
  weekday,
} from '@/engine';

const MONTHS_PER_YEAR = 12;
export const DAYS_PER_WEEK = 7;

/** Six full weeks, so every month fills the same grid and the pager never changes height. */
export const GRID_WEEKS = 6;

/** Weekdays counted from Sunday = 0, as `weekday` and `DayAlmanac.weekday` do. */
export const SUNDAY = 0;
const MONDAY = 1;

/** The device-local date of [now] (Kotlin `ZonedDateTime.civilDate`). */
export const localDate = (now: Date): CivilDate => civilDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

export type CalendarMonth = { readonly year: number; readonly month: number };

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const FIRST_YEAR = 1901;
const LAST_YEAR = 2099;

/**
 * Pager positions for every month the lunar tables cover, leaving a margin for the leading and
 * trailing days of the grid.
 */
export const MonthIndex = Object.freeze({
  FIRST_YEAR,
  LAST_YEAR,
  COUNT: (LAST_YEAR - FIRST_YEAR + 1) * MONTHS_PER_YEAR,

  of(year: number, month: number): number {
    return clamp((year - FIRST_YEAR) * MONTHS_PER_YEAR + month - 1, 0, MonthIndex.COUNT - 1);
  },

  month(index: number): CalendarMonth {
    const i = clamp(index, 0, MonthIndex.COUNT - 1);
    return { year: FIRST_YEAR + Math.floor(i / MONTHS_PER_YEAR), month: (i % MONTHS_PER_YEAR) + 1 };
  },

  contains(date: CivilDate): boolean {
    return date.year >= FIRST_YEAR && date.year <= LAST_YEAR;
  },
});

export type MonthCell = { readonly day: DayAlmanac; readonly inMonth: boolean; readonly isToday: boolean };

export const isSundayCell = (cell: MonthCell): boolean => cell.day.weekday === SUNDAY;

export type MonthPage = { readonly month: CalendarMonth; readonly cells: readonly MonthCell[] };

/** The seven weekdays in grid order, Sunday = 0. */
export function weekdayOrder(weekStart: WeekStart): number[] {
  const first = weekStart === WeekStart.SUNDAY ? SUNDAY : MONDAY;
  return Array.from({ length: DAYS_PER_WEEK }, (_, i) => (first + i) % DAYS_PER_WEEK);
}

/** The grid for the month at pager [index], opening on [weekStart], with today marked. */
export function monthPage(
  index: number,
  today: CivilDate,
  utcOffsetHours: number = CALENDAR_OFFSET,
  weekStart: WeekStart = WeekStart.MONDAY,
): MonthPage {
  const month = MonthIndex.month(index);
  const first = dayNumberOf(1, month.month, month.year);
  const sundayBased = weekday(first);
  const lead = weekStart === WeekStart.MONDAY ? (sundayBased + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK : sundayBased;
  const cells = Array.from({ length: GRID_WEEKS * DAYS_PER_WEEK }, (_, i): MonthCell => {
    const day = almanacDay(toCivil(first - lead + i), utcOffsetHours);
    return Object.freeze({ day, inMonth: day.date.month === month.month, isToday: sameDate(day.date, today) });
  });
  return Object.freeze({ month, cells: Object.freeze(cells) });
}
