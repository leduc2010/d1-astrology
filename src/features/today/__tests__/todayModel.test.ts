import { birthClock, Gender, type BirthProfile } from '@/core/model';
import { FakeProfileRepository, TestProfiles } from '@/core/testing';
import { Branch, civilDate, Element, Stem, TenGod } from '@/engine';
import { TodayModel, type Ticks } from '../todayModel';

/** A clock the test moves by hand, standing in for the minute ticker. */
class ManualClock {
  private listener: ((now: Date) => void) | null = null;

  constructor(public now: Date) {}

  readonly ticks: Ticks = (listener) => {
    this.listener = listener;
    listener(this.now);
    return () => {
      this.listener = null;
    };
  };

  set(now: Date): void {
    this.now = now;
    this.listener?.(now);
  }
}

// Device-local 31 October 2026, 09:15 (Kotlin test: Asia/Ho_Chi_Minh).
const start = new Date(2026, 9, 31, 9, 15);

/** Born on a Mậu Dần day, so the day master is Mậu (Earth). Made-up data. */
const owner: BirthProfile = {
  name: 'Lan',
  gender: Gender.FEMALE,
  date: { year: 2026, month: 10, day: 31 },
  clock: birthClock(12, 0),
  place: TestProfiles.hanoi,
  enteredAsLunar: false,
};

describe('TodayModel', () => {
  let clock: ManualClock;
  let profiles: FakeProfileRepository;
  let stop: (() => void) | null;

  beforeEach(() => {
    clock = new ManualClock(start);
    profiles = new FakeProfileRepository();
    stop = null;
  });

  afterEach(() => stop?.());

  const model = () => new TodayModel(profiles, () => clock.now, clock.ticks);
  const started = () => {
    const m = model();
    stop = m.start();
    return m;
  };

  it('initial state shows the day and hour without a personal reading', () => {
    const state = model().state.current();

    expect(state.day.date).toEqual(civilDate(2026, 10, 31));
    expect(state.day.dayPillar.stem).toBe(Stem.WU);
    expect(state.day.dayPillar.branch).toBe(Branch.YIN);
    expect(state.nowHour).toBe(Branch.SI);
    expect(state.personal).toBeNull();
  });

  it('personal reading appears once the profile loads', () => {
    const vm = started();

    profiles.state.set(owner);

    const personal = vm.state.current().personal;
    expect(personal).not.toBeNull();
    expect(personal?.name).toBe('Lan');
    expect(personal?.tenGod).toBe(TenGod.FRIEND);
    expect(personal?.luckyElements).toEqual([Element.EARTH, Element.FIRE, Element.METAL]);
  });

  it('a new double hour updates the current hour', () => {
    const vm = started();

    clock.set(new Date(2026, 9, 31, 11, 5));

    expect(vm.state.current().nowHour).toBe(Branch.WU);
  });

  it('a new date recomputes the day', () => {
    const vm = started();

    clock.set(new Date(2026, 10, 1, 9, 15));

    expect(vm.state.current().day.date).toEqual(civilDate(2026, 11, 1));
    expect(vm.state.current().day.dayPillar.stem).toBe(Stem.JI);
  });

  // RN-only: the model unsubscribes, so a stopped screen ignores later ticks.
  it('stops following the clock once stopped', () => {
    const vm = model();
    vm.start()();

    clock.set(new Date(2026, 9, 31, 11, 5));

    expect(vm.state.current().nowHour).toBe(Branch.SI);
  });
});
