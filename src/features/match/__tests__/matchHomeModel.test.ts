import { Relationship } from '@/core/model';
import { FakePartnerRepository, FakeProfileRepository } from '@/core/testing';

import { matchHomeUiState, ownerLoadOf, partnerSummariesOf, type MatchHomeUiState } from '../matchHomeModel';
import { OTHER, OUT_OF_RANGE, OWNER } from '../testing/matchTestData';

/** Recomputes the state from the fakes, as the Kotlin flows did on every change. */
function home(profiles: FakeProfileRepository, partners: FakePartnerRepository) {
  let chosen: number | null = null;
  return {
    get state(): MatchHomeUiState {
      return matchHomeUiState(ownerLoadOf(profiles.current()), partnerSummariesOf(partners.current()), chosen);
    },
    onSelect(id: number) {
      chosen = id;
    },
  };
}

function ready(state: MatchHomeUiState) {
  if (state.kind !== 'Ready') throw new Error(`expected Ready, got ${state.kind}`);
  return state;
}

describe('MatchHomeViewModel', () => {
  let profiles: FakeProfileRepository;
  let partners: FakePartnerRepository;
  let vm: ReturnType<typeof home>;

  beforeEach(() => {
    profiles = new FakeProfileRepository();
    partners = new FakePartnerRepository();
    vm = home(profiles, partners);
  });

  test('no profile asks for birth details', () => {
    expect(vm.state.kind).toBe('NoProfile');
  });

  test('an owner out of range shows an unavailable notice', () => {
    profiles.state.set({ ...OWNER, date: OUT_OF_RANGE });

    expect(vm.state.kind).toBe('Unavailable');
  });

  test('with nobody added nothing is selected', () => {
    profiles.state.set(OWNER);

    const state = ready(vm.state);
    expect(state.owner.name).toBe('Lan');
    expect(state.selected).toBeNull();
  });

  test('the latest person is selected until another is chosen', async () => {
    profiles.state.set(OWNER);
    const first = await partners.add(OTHER, Relationship.FRIEND, 0);
    const second = await partners.add({ ...OTHER, name: 'Hoa' }, Relationship.PARTNER, 1);

    expect(ready(vm.state).selected?.partner.id).toBe(second);

    vm.onSelect(first);

    expect(ready(vm.state).selected?.partner.id).toBe(first);
  });

  test('a partner out of range is listed without a year', async () => {
    profiles.state.set(OWNER);
    await partners.add({ ...OTHER, date: OUT_OF_RANGE }, Relationship.COLLEAGUE, 0);
    await partners.add(OTHER, Relationship.FRIEND, 0);

    const people = ready(vm.state).partners;
    expect(people[0]!.lunarYear).toBeNull();
    expect(people[1]!.lunarYear).not.toBeNull();
  });

  test('choosing someone who was deleted falls back to the latest', async () => {
    profiles.state.set(OWNER);
    const first = await partners.add(OTHER, Relationship.FRIEND, 0);
    const second = await partners.add(OTHER, Relationship.FRIEND, 0);
    vm.onSelect(first);

    await partners.remove(first);

    expect(ready(vm.state).selected?.partner.id).toBe(second);
  });
});
