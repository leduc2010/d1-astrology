import { capitalized, patternDateText, standaloneMonthNames, type UiText } from '@/core/ui';
import type { CivilDate } from '@/engine';
import type { StringKey } from '@/i18n';
import type { CalendarMonth } from './calendarMonth';

/**
 * Calendar dates as text (Kotlin `DateText.kt`). Shared-layer request: `fullDateText`,
 * `weekdayText`, `weekdayHeadings` and `monthTitle` belong beside `solarDateText` in core/ui.
 */

const UTC = 'UTC';
/** 7 January 2001 was a Sunday: adding a Sunday-based weekday number gives that weekday. */
const A_SUNDAY = 7;
const ANY_YEAR = 2001;

function utcDate(date: CivilDate): Date {
  const d = new Date(0);
  d.setUTCFullYear(date.year, date.month - 1, date.day);
  return d;
}

/** [date] in the Java-style pattern held by the string [key], so each language picks its own shape. */
export const datePattern = (t: UiText, key: StringKey, date: CivilDate): string =>
  patternDateText(date, t.tf(key), t.language);

/** "Sunday, 1 November 2026" (Java `FormatStyle.FULL`). */
export const fullDateText = (date: CivilDate, language: string): string =>
  new Intl.DateTimeFormat(language, { dateStyle: 'full', timeZone: UTC }).format(utcDate(date));

/** "Sunday", first letter capitalised. */
export const weekdayText = (date: CivilDate, language: string): string =>
  capitalized(new Intl.DateTimeFormat(language, { weekday: 'long', timeZone: UTC }).format(utcDate(date)), language);

/** Short weekday headings in grid order; [order] holds weekdays as Sunday = 0. */
export function weekdayHeadings(order: readonly number[], language: string): string[] {
  const format = new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: UTC });
  return order.map((weekday) => format.format(utcDate({ year: ANY_YEAR, month: 1, day: A_SUNDAY + weekday })));
}

/** "November" / "Tháng 11". */
export const monthTitle = (month: CalendarMonth, language: string): string =>
  standaloneMonthNames(language)[month.month - 1] ?? '';
