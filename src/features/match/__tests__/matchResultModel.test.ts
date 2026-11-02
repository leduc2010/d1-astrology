import { Relationship } from '@/core/model';
import { FakePartnerRepository, FakeProfileRepository } from '@/core/testing';

import {
  deletePartner,
  matchResultLoadOf,
  matchResultUiState,
  partnerById,
  type MatchResultUiState,
} from '../matchResultModel';
import { OTHER, OUT_OF_RANGE, OWNER } from '../testing/matchTestData';

/** Recomputes the state from the fakes, as the Kotlin flows did on every change. */
function result(profiles: FakeProfileRepository, partners: FakePartnerRepository, id: number) {
  let deleteFailed = false;
  return {
    get state(): MatchResultUiState {
      const load = matchResultLoadOf(profiles.current(), partnerById(partners.current(), id));
      return matchResultUiState(load, deleteFailed);
    },
    async onDelete() {
      deleteFailed = false;
      await deletePartner(partners, id, () => {
        deleteFailed = true;
      });
    },
  };
}

describe('MatchResultViewModel', () => {
  let profiles: FakeProfileRepository;
  let partners: FakePartnerRepository;

  beforeEach(() => {
    profiles = new FakeProfileRepository();
    partners = new FakePartnerRepository();
  });

  test('no profile asks for birth details', async () => {
    const id = await partners.add(OTHER, Relationship.PARTNER, 0);

    expect(result(profiles, partners, id).state.kind).toBe('NoProfile');
  });

  test('a stored partner gives a report for both people', async () => {
    profiles.state.set(OWNER);
    const id = await partners.add(OTHER, Relationship.PARTNER, 0);

    const state = result(profiles, partners, id).state;
    if (state.kind !== 'Ready') throw new Error(`expected Ready, got ${state.kind}`);
    expect(state.report.first.name).toBe('Lan');
    expect(state.report.second.name).toBe('Minh');
    expect(state.report.axes.length).toBeGreaterThan(0);
  });

  test('an unknown id is gone', () => {
    profiles.state.set(OWNER);

    expect(result(profiles, partners, 42).state.kind).toBe('Gone');
  });

  test('deleting removes the person and closes the page', async () => {
    profiles.state.set(OWNER);
    const id = await partners.add(OTHER, Relationship.PARTNER, 0);
    const vm = result(profiles, partners, id);

    await vm.onDelete();

    expect(partners.current()).toHaveLength(0);
    expect(vm.state.kind).toBe('Gone');
  });

  test('a failed delete keeps the person and shows a notice', async () => {
    profiles.state.set(OWNER);
    const id = await partners.add(OTHER, Relationship.PARTNER, 0);
    partners.removeFailure = new Error('disk full');
    const vm = result(profiles, partners, id);

    await vm.onDelete();

    const state = vm.state;
    expect(state.kind === 'Ready' && state.deleteFailed).toBe(true);
    expect(partners.current()).toHaveLength(1);
  });

  test('a partner out of range shows an unavailable notice', async () => {
    profiles.state.set(OWNER);
    const id = await partners.add({ ...OTHER, date: OUT_OF_RANGE }, Relationship.FRIEND, 0);

    expect(result(profiles, partners, id).state.kind).toBe('Unavailable');
  });
});
