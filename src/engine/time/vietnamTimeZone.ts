import type { CivilDate } from './civilDate';
import { dayNumber, dayNumberOf } from './julianDay';

/**
 * Civil UTC offsets used in Vietnam since 1911, which differed between North and South until 1975
 * (IANA tz Asia/Ho_Chi_Minh for the South; the North returned to UTC+7 after September 1945).
 * Changes are applied by calendar date; the exact switch hour on a transition day is ignored.
 */

/** Latitude of the 17th parallel, the 1954–1975 dividing line. */
export const PARTITION_LATITUDE = 17.0;

const MINUTES_PER_HOUR = 60;

interface Period {
  readonly fromDay: number;
  readonly minutes: number;
}

const from = (day: number, month: number, year: number, hours: number): Period => ({
  fromDay: dayNumberOf(day, month, year),
  minutes: hours * MINUTES_PER_HOUR,
});

const WARTIME: readonly Period[] = [
  { fromDay: Number.MIN_SAFE_INTEGER, minutes: 7 * MINUTES_PER_HOUR },
  from(1, 1, 1943, 8),
  from(15, 3, 1945, 9),
  from(2, 9, 1945, 7),
];

const NORTH = WARTIME;

const SOUTH: readonly Period[] = [
  ...WARTIME,
  from(1, 4, 1947, 8),
  from(1, 7, 1955, 7),
  from(1, 1, 1960, 8),
  from(13, 6, 1975, 7),
];

/** UTC offset in minutes for a birth on [date] at a place at [latitude] in Vietnam. */
export function vietnamOffsetMinutes(date: CivilDate, latitude: number): number {
  const day = dayNumber(date);
  const table = latitude < PARTITION_LATITUDE ? SOUTH : NORTH;
  let minutes = WARTIME[0]!.minutes;
  for (const p of table) if (day >= p.fromDay) minutes = p.minutes;
  return minutes;
}
