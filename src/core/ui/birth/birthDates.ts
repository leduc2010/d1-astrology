import {
  type CivilDate,
  civilDate,
  dayNumber,
  dayPillar,
  isValidCivilDate,
  lengthOfMonth,
  type LunarDate,
  lunarDate,
  type StemBranch,
  vietnamLeapMonthOf,
  vietnamMonthLength,
  vietnamToLunar,
  vietnamToSolar,
} from '../../../engine';

export enum CalendarMode {
  Solar = 'Solar',
  Lunar = 'Lunar',
}

/** What the date wheels show. In `Lunar` mode the fields are a lunar date. */
export interface DateInput {
  readonly mode: CalendarMode;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly isLeapMonth: boolean;
}

// The Figma sample birthday, a friendly middle of the wheels.
const DEFAULT_YEAR = 1995;
const DEFAULT_MONTH = 8;
const DEFAULT_DAY = 15;

export function dateInput(fields: Partial<DateInput> = {}): DateInput {
  return Object.freeze({
    mode: CalendarMode.Solar,
    year: DEFAULT_YEAR,
    month: DEFAULT_MONTH,
    day: DEFAULT_DAY,
    isLeapMonth: false,
    ...fields,
  });
}

/** The entered date in both calendars, ready for the cross-check card. */
export interface DateCheck {
  readonly solar: CivilDate;
  readonly lunar: LunarDate;
  readonly dayPillar: StemBranch;
  /** Leap month of the lunar year shown on the wheels, or null when that year has none. */
  readonly leapMonth: number | null;
  readonly isFuture: boolean;
}

/** Lunar 1900 starts before solar 1900, so the first full year both calendars cover is 1901. */
const FIRST_YEAR = 1901;
const MONTHS = 12;
const LONG_LUNAR_MONTH = 30;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/**
 * Pure rules of the date step, in the Vietnamese lunar calendar of the birth year (the place is
 * not known yet, so the Northern calendar): which years and days exist, keeping the wheels on a
 * real date, and converting between calendars. `today` bounds the year wheel and flags a future
 * birthday.
 */
export class BirthDates {
  readonly firstYear = FIRST_YEAR;
  readonly lastYear: number;

  constructor(private readonly today: CivilDate) {
    this.lastYear = today.year;
  }

  /** Every year on the wheel, oldest first. */
  get years(): number[] {
    return Array.from({ length: this.lastYear - this.firstYear + 1 }, (_, i) => this.firstYear + i);
  }

  /** Days in the month the wheels show (29 or 30 for a lunar month). */
  daysIn(input: DateInput): number {
    if (input.mode === CalendarMode.Solar) return lengthOfMonth(input.year, input.month);
    return vietnamMonthLength(lunarDate(input.year, input.month, 1, input.isLeapMonth)) ?? LONG_LUNAR_MONTH;
  }

  /** Leap month of `year` in the lunar calendar, if any. */
  leapMonthOf(year: number): number | null {
    return vietnamLeapMonthOf(year);
  }

  /** Pulls the wheels back onto a real date: drops a leap flag the month can't have, clamps the day. */
  normalize(input: DateInput): DateInput {
    const year = clamp(input.year, this.firstYear, this.lastYear);
    const month = clamp(input.month, 1, MONTHS);
    const leap = input.mode === CalendarMode.Lunar && input.isLeapMonth && this.leapMonthOf(year) === month;
    const base = dateInput({ ...input, year, month, isLeapMonth: leap, day: 1 });
    return dateInput({ ...base, day: clamp(input.day, 1, this.daysIn(base)) });
  }

  /** Both calendars for `input`, or null if it is not a real date (normalize first). */
  check(input: DateInput): DateCheck | null {
    const pair = this.calendarsOf(input);
    if (pair === null) return null;
    const [solar, lunar] = pair;
    return Object.freeze({
      solar,
      lunar,
      dayPillar: dayPillar(dayNumber(solar)),
      leapMonth: this.leapMonthOf(input.year),
      isFuture: dayNumber(solar) > dayNumber(this.today),
    });
  }

  /** The same day shown in the other calendar, so switching never loses the user's date. */
  switchMode(input: DateInput, mode: CalendarMode): DateInput {
    if (mode === input.mode) return input;
    const check = this.check(input);
    if (check === null) return this.normalize(dateInput({ ...input, mode }));
    const converted =
      mode === CalendarMode.Solar
        ? dateInput({ mode, year: check.solar.year, month: check.solar.month, day: check.solar.day })
        : dateInput({
            mode,
            year: check.lunar.year,
            month: check.lunar.month,
            day: check.lunar.day,
            isLeapMonth: check.lunar.isLeapMonth,
          });
    return this.normalize(converted);
  }

  private calendarsOf(input: DateInput): readonly [CivilDate, LunarDate] | null {
    if (input.mode === CalendarMode.Solar) {
      if (!isValidCivilDate(input.year, input.month, input.day)) return null;
      const solar = civilDate(input.year, input.month, input.day);
      return [solar, vietnamToLunar(solar)];
    }
    const lunar = lunarDate(input.year, input.month, input.day, input.isLeapMonth);
    const solar = vietnamToSolar(lunar);
    return solar === null ? null : [solar, lunar];
  }
}
