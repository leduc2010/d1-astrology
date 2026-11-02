import { civilDate } from '../../../engine';
import { BirthDates, CalendarMode, dateInput } from '../birth/birthDates';

// Ported from Kotlin BirthDatesTest.
const dates = new BirthDates(civilDate(2026, 11, 1));
const solar = (year: number, month: number, day: number) => dateInput({ mode: CalendarMode.Solar, year, month, day });
const lunar = (year: number, month: number, day: number, isLeapMonth = false) =>
  dateInput({ mode: CalendarMode.Lunar, year, month, day, isLeapMonth });

describe('BirthDates', () => {
  it('clamps a day past the end of the month', () => {
    expect(dates.normalize(solar(2023, 2, 30)).day).toBe(28);
  });

  it('drops the leap flag when the month has no leap', () => {
    expect(dates.normalize(lunar(1995, 7, 1, true)).isLeapMonth).toBe(false);
  });

  it("keeps the leap flag on the year's leap month", () => {
    expect(dates.normalize(lunar(1995, 8, 1, true)).isLeapMonth).toBe(true);
  });

  it('cross-checks a solar date in the lunar calendar', () => {
    const check = dates.check(solar(1995, 8, 15));
    expect(check).not.toBeNull();
    expect(check?.lunar.year).toBe(1995);
    expect(check?.lunar.month).toBe(7);
    expect(check?.lunar.day).toBe(20);
    expect(check?.leapMonth).toBe(8);
    expect(check?.isFuture).toBe(false);
  });

  it('keeps the same day when switching calendars', () => {
    const asLunar = dates.switchMode(solar(1995, 8, 15), CalendarMode.Lunar);
    expect(asLunar).toEqual(lunar(1995, 7, 20));
    expect(dates.switchMode(asLunar, CalendarMode.Solar)).toEqual(solar(1995, 8, 15));
  });

  it('flags a day after today as future', () => {
    expect(dates.check(solar(2026, 11, 2))?.isFuture).toBe(true);
  });

  it('ends the year wheel at this year', () => {
    expect(dates.years.at(-1)).toBe(2026);
    expect(dates.normalize(dateInput({ year: 2100 })).year).toBe(2026);
  });

  it('gives no check for a solar date that does not exist', () => {
    expect(dates.check(solar(2023, 2, 30))).toBeNull();
  });
});
