import { WeekStart } from '@/core/model';
import { FakeSettingsRepository } from '@/core/testing';
import { civilDate, dayNumber } from '@/engine';
import { CalendarModel, pageIndexes } from '../calendarModel';

// Device-local 1 November 2026, 09:15 (Kotlin test: Asia/Ho_Chi_Minh).
const now = new Date(2026, 10, 1, 9, 15);

describe('CalendarModel', () => {
  let settings: FakeSettingsRepository;
  let stop: (() => void) | null;

  beforeEach(() => {
    settings = new FakeSettingsRepository();
    stop = null;
  });

  afterEach(() => stop?.());

  const started = () => {
    const m = new CalendarModel(settings, () => now);
    stop = m.start();
    return m;
  };

  it('opens on this month with its neighbours loaded', () => {
    const state = started().state.current();

    expect(state.today).toEqual(civilDate(2026, 11, 1));
    const t = state.todayIndex;
    expect(pageIndexes(state.pages)).toEqual([t - 1, t, t + 1]);
  });

  it('upcoming lists festivals and terms from today on', () => {
    const upcoming = started().state.current().upcoming;

    expect(upcoming.length).toBeGreaterThan(0);
    const today = dayNumber(civilDate(2026, 11, 1));
    expect(upcoming.every((d) => dayNumber(d.date) >= today)).toBe(true);
    expect(upcoming.every((d) => d.isTermStart || d.festivals.length > 0)).toBe(true);
  });

  it('paging away loads the new neighbourhood and drops far months', () => {
    const m = started();
    const t = m.state.current().todayIndex;

    m.onMonthShown(t + 3);

    expect(pageIndexes(m.state.current().pages)).toEqual([t + 1, t + 2, t + 3, t + 4]);
  });

  it('changing the week start redraws the loaded months', async () => {
    const m = started();
    const t = m.state.current().todayIndex;
    expect(m.state.current().pages[t]?.cells[0]?.day.date).toEqual(civilDate(2026, 10, 26));

    await settings.setWeekStart(WeekStart.SUNDAY);

    const state = m.state.current();
    expect(state.weekStart).toBe(WeekStart.SUNDAY);
    expect(pageIndexes(state.pages)).toEqual([t - 1, t, t + 1]);
    expect(state.pages[t]?.cells[0]?.day.date).toEqual(civilDate(2026, 11, 1));
  });

  it('hiding lunar dates keeps the loaded months', async () => {
    const m = started();
    const pages = m.state.current().pages;
    expect(m.state.current().showLunar).toBe(true);

    await settings.setShowLunarInCalendar(false);

    expect(m.state.current().showLunar).toBe(false);
    expect(m.state.current().pages).toBe(pages);
  });

  it('the first month loads without going out of range', () => {
    const m = started();

    m.onMonthShown(0);

    expect(pageIndexes(m.state.current().pages)).toEqual([0, 1]);
  });
});
