import { Branch, civilDate, dayNumber, Stem, toCivil, toLunar, VIETNAM_OFFSET, type CivilDate } from '@/engine';
import { DayModel } from '../dayModel';

// Device-local 1 November 2026, 09:15 (Kotlin test: Asia/Ho_Chi_Minh).
const now = new Date(2026, 10, 1, 9, 15);

const model = (start: CivilDate | null) => new DayModel(start, () => now);

describe('DayModel', () => {
  it('today shows its pillars and the current hour', () => {
    const state = model(civilDate(2026, 11, 1)).state.current();

    expect(state.isToday).toBe(true);
    expect(state.nowHour).toBe(Branch.SI);
    expect(state.day.dayPillar.stem).toBe(Stem.JI);
    expect(state.day.dayPillar.branch).toBe(Branch.MAO);
    expect(state.yearPillar.stem).toBe(Stem.BING);
    expect(state.yearPillar.branch).toBe(Branch.WU);
    // Frost's Descent (Sương giáng) began on 23 October 2026.
    expect(state.termStart).toEqual(civilDate(2026, 10, 23));
  });

  it('stepping forward leaves today and hides the hour', () => {
    const m = model(civilDate(2026, 11, 1));

    m.onShift(1);

    const state = m.state.current();
    expect(state.day.date).toEqual(civilDate(2026, 11, 2));
    expect(state.isToday).toBe(false);
    expect(state.nowHour).toBeNull();
  });

  it('stepping crosses month and year ends', () => {
    const m = model(civilDate(2026, 12, 31));

    m.onShift(1);

    expect(m.state.current().day.date).toEqual(civilDate(2027, 1, 1));
  });

  it('the first supported day cannot step back', () => {
    const m = model(civilDate(1901, 1, 1));

    expect(m.state.current().hasPrevious).toBe(false);
    m.onShift(-1);

    expect(m.state.current().day.date).toEqual(civilDate(1901, 1, 1));
  });

  it('a date outside the supported years opens today', () => {
    expect(model(civilDate(1850, 1, 1)).state.current().day.date).toEqual(civilDate(2026, 11, 1));
  });

  it('the lunar date follows the Vietnamese calendar wherever the phone is', () => {
    const newYorkOffset = -5.0;
    // A day whose new moon falls between midnight in New York and midnight in Hanoi.
    const start = dayNumber(civilDate(2026, 1, 1));
    const date = Array.from({ length: 400 }, (_, i) => toCivil(start + i)).find(
      (d) => JSON.stringify(toLunar(d, VIETNAM_OFFSET)) !== JSON.stringify(toLunar(d, newYorkOffset)),
    );
    expect(date).toBeDefined();

    // The model never reads the device zone for the lunar date; only the clock's local date.
    const state = new DayModel(date!, () => now).state.current();

    expect(state.day.lunar).toEqual(toLunar(date!, VIETNAM_OFFSET));
  });

  // RN only: the route passes null when the link's date cannot be read.
  it('an unreadable date opens today', () => {
    expect(model(null).state.current().day.date).toEqual(civilDate(2026, 11, 1));
  });
});
