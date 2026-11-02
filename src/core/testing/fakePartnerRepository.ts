import type { BirthProfile, Partner, Relationship } from '../model';
import type { PartnerRepository } from '../data/partnerRepository';
import { failIfSet, FakeRepository } from './fakeRepository';

export class FakePartnerRepository extends FakeRepository<readonly Partner[]> implements PartnerRepository {
  /** When set, [add] fails like an unwritable store. */
  addFailure: Error | null = null;
  /** When set, [remove] fails like an unwritable store. */
  removeFailure: Error | null = null;
  /** When set, [clear] fails like an unwritable store. */
  clearFailure: Error | null = null;

  private nextId = 1;

  constructor() {
    super(Object.freeze([]));
  }

  async add(profile: BirthProfile, relationship: Relationship, addedOnEpochDay: number): Promise<number> {
    failIfSet(this.addFailure);
    const id = this.nextId;
    this.nextId += 1;
    const partner: Partner = Object.freeze({ id, profile, relationship, addedOnEpochDay });
    this.state.update((list) => Object.freeze([...list, partner]));
    return id;
  }

  async remove(id: number): Promise<void> {
    failIfSet(this.removeFailure);
    this.state.update((list) => Object.freeze(list.filter((it) => it.id !== id)));
  }

  async clear(): Promise<void> {
    failIfSet(this.clearFailure);
    this.state.set(Object.freeze([]));
  }
}
