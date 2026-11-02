import { WeekStart } from '@/core/model';
import { civilDate, Festival } from '@/engine';
import {
  DAYS_PER_WEEK,
  GRID_WEEKS,
  isSundayCell,
  MonthIndex,
  monthPage,
  SUNDAY,
  weekdayOrder,
} from '../calendarMonth';

const MONDAY = 1;
const vietnam = 7.0;
const today = civilDate(2026, 11, 1);

describe('monthPage', () => {
  it('month index round-trips and clamps to the supported years', () => {
    expect(MonthIndex.of(1901, 1)).toBe(0);
    expect(MonthIndex.month(MonthIndex.of(2026, 11))).toEqual({ year: 2026, month: 11 });
    expect(MonthIndex.month(MonthIndex.COUNT - 1)).toEqual({ year: 2099, month: 12 });
    expect(MonthIndex.of(1850, 6)).toBe(0);
    expect(MonthIndex.of(2200, 1)).toBe(MonthIndex.COUNT - 1);
  });

  it('grid starts on the Monday before the first and spans six weeks', () => {
    const page = monthPage(MonthIndex.of(2026, 11), today, vietnam);

    expect(page.cells).toHaveLength(GRID_WEEKS * DAYS_PER_WEEK);
    // 1 November 2026 is a Sunday, so the grid opens on Monday 26 October.
    expect(page.cells[0]!.day.date).toEqual(civilDate(2026, 10, 26));
    expect(page.cells[0]!.inMonth).toBe(false);
    const first = page.cells[6]!;
    expect(first.day.date).toEqual(today);
    expect(first.inMonth).toBe(true);
    expect(isSundayCell(first)).toBe(true);
    expect(first.isToday).toBe(true);
    expect(page.cells.filter((c) => c.isToday)).toHaveLength(1);
  });

  it('a Sunday-first grid opens on the first when it is a Sunday', () => {
    const page = monthPage(MonthIndex.of(2026, 11), today, vietnam, WeekStart.SUNDAY);

    expect(page.cells[0]!.day.date).toEqual(today);
    expect(isSundayCell(page.cells[0]!)).toBe(true);
    expect(page.cells[0]!.isToday).toBe(true);
    expect(monthPage(0, today, vietnam, WeekStart.SUNDAY).cells[0]!.day.date).toEqual(civilDate(1900, 12, 30));
  });

  it('weekday order follows the chosen week start', () => {
    expect(weekdayOrder(WeekStart.MONDAY)[0]).toBe(MONDAY);
    expect(weekdayOrder(WeekStart.MONDAY).at(-1)).toBe(SUNDAY);
    expect(weekdayOrder(WeekStart.SUNDAY)[0]).toBe(SUNDAY);
    expect(new Set(weekdayOrder(WeekStart.SUNDAY))).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
  });

  it('lunar new year shows in February 2026', () => {
    const page = monthPage(MonthIndex.of(2026, 2), today, vietnam);

    const matches = page.cells.filter((c) => c.day.date.month === 2 && c.day.date.day === 17);
    expect(matches).toHaveLength(1);
    const tet = matches[0]!.day;
    expect(tet.lunar.day).toBe(1);
    expect(tet.lunar.month).toBe(1);
    expect(tet.festivals).toContain(Festival.LUNAR_NEW_YEAR);
  });

  it('first and last supported months build', () => {
    expect(monthPage(0, today, vietnam).cells[0]!.day.date).toEqual(civilDate(1900, 12, 31));
    expect(monthPage(MonthIndex.COUNT - 1, today, vietnam).month).toEqual({ year: 2099, month: 12 });
  });
});
