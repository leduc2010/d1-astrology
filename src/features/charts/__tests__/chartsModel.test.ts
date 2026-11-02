import { FakeProfileRepository, TestProfiles } from '@/core/testing';
import { BRANCHES, civilDate, PLANETS, type Branch } from '@/engine';

import { fullYears } from '../model/birthCharts';
import { ChartsModel, ChartsUiState } from '../model/chartsModel';
import { PillarKind } from '../model/chartViews';

// Made-up owner (TestProfiles.owner): Lan, female, 1990-05-15 12:00, Hà Nội.
const owner = TestProfiles.owner;
const today = () => civilDate(2026, 11, 1);

function setUp() {
  const profiles = new FakeProfileRepository();
  const model = new ChartsModel(profiles, today);
  model.start();
  return { profiles, model };
}

function ready(model: ChartsModel) {
  const state = model.current();
  if (state.kind !== 'ready') throw new Error(`expected ready, got ${state.kind}`);
  return state;
}

describe('ChartsModel', () => {
  it('no profile asks for birth details', () => {
    const { model } = setUp();

    expect(model.current()).toBe(ChartsUiState.NoProfile);
  });

  it('charts open on the life palace', () => {
    const { profiles, model } = setUp();

    profiles.state.set(owner);

    const state = ready(model);
    const ziWei = state.charts.ziWei;
    expect(ziWei).not.toBeNull();
    expect(state.selectedPalace).toBe(ziWei!.lifeBranch);
    expect(ziWei!.palaces).toHaveLength(12);
    expect(state.charts.baZi.columns).toHaveLength(4);
    expect(state.charts.natal.hasTime).toBe(true);
    expect(new Set(state.charts.natal.chart.planets.keys())).toEqual(new Set(PLANETS));
  });

  it('selecting a palace keeps the charts and moves the selection', () => {
    const { profiles, model } = setUp();
    profiles.state.set(owner);
    const before = ready(model);
    const other = BRANCHES.find((b) => b !== before.selectedPalace) as Branch;

    model.onSelectPalace(other);

    const after = ready(model);
    expect(after.selectedPalace).toBe(other);
    expect(after.charts).toBe(before.charts);
  });

  it('without a birth hour there is no purple star chart or rising sign', () => {
    const { profiles, model } = setUp();

    profiles.state.set({ ...owner, clock: null });

    const state = ready(model);
    expect(state.charts.ziWei).toBeNull();
    expect(state.selectedPalace).toBeNull();
    expect(state.charts.natal.hasTime).toBe(false);
    expect(state.charts.natal.chart.ascendant).toBeNull();
    expect(state.charts.baZi.columns.find((c) => c.kind === PillarKind.HOUR)?.pillar).toBeNull();
  });

  it('a new profile replaces the charts', () => {
    const { profiles, model } = setUp();
    profiles.state.set(owner);
    const first = ready(model).charts;

    profiles.state.set({ ...owner, name: 'Minh', date: { year: 1985, month: 2, day: 3 } });

    const second = ready(model).charts;
    expect(second.name).toBe('Minh');
    expect([second.baZi.dayMaster, second.solarDate]).not.toEqual([first.baZi.dayMaster, first.solarDate]);
  });

  it('a new profile resets the palace selection', () => {
    const { profiles, model } = setUp();
    profiles.state.set(owner);
    const first = ready(model);
    model.onSelectPalace(BRANCHES.find((b) => b !== first.selectedPalace) as Branch);

    profiles.state.set({ ...owner, date: { year: 1985, month: 2, day: 3 } });

    const second = ready(model);
    expect(second.selectedPalace).toBe(second.charts.ziWei?.lifeBranch);
  });

  it('a birth date outside the calendar range shows an unavailable notice', () => {
    const { profiles, model } = setUp();

    profiles.state.set({ ...owner, date: TestProfiles.outOfRange });

    expect(model.current()).toBe(ChartsUiState.Unavailable);
  });

  it('full years count the birthday only once it has passed', () => {
    const birth = civilDate(1990, 5, 15);

    expect(fullYears(birth, civilDate(2026, 5, 14))).toBe(35);
    expect(fullYears(birth, civilDate(2026, 5, 15))).toBe(36);
    expect(fullYears(birth, civilDate(2026, 11, 1))).toBe(36);
  });
});

describe('ChartsModel (RN specifics)', () => {
  it('reads a profile already loaded without a loading frame', () => {
    const profiles = new FakeProfileRepository(owner);

    const model = new ChartsModel(profiles, today);

    expect(model.current().kind).toBe('ready');
  });

  it('the same profile read again keeps the selection', () => {
    const { profiles, model } = setUp();
    profiles.state.set(owner);
    const other = BRANCHES.find((b) => b !== ready(model).selectedPalace) as Branch;
    model.onSelectPalace(other);

    model.start();

    expect(ready(model).selectedPalace).toBe(other);
  });

  it('notifies subscribers on every change', () => {
    const { profiles, model } = setUp();
    const listener = jest.fn();
    model.subscribe(listener);

    profiles.state.set(owner);
    model.onSelectPalace(BRANCHES.find((b) => b !== ready(model).selectedPalace) as Branch);

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
