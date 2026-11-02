import type { BirthProfile } from '../model';
import type { ProfileRepository } from '../data/profileRepository';
import { failIfSet, FakeRepository } from './fakeRepository';

export class FakeProfileRepository extends FakeRepository<BirthProfile | null> implements ProfileRepository {
  /** When true, the next save fails once like a full disk. */
  failNextSave = false;
  /** When set, [clear] fails like an unwritable store. */
  clearFailure: Error | null = null;

  constructor(initial: BirthProfile | null = null) {
    super(initial);
  }

  get saved(): BirthProfile | null {
    return this.state.current();
  }

  async savePrimary(profile: BirthProfile): Promise<void> {
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error('disk full');
    }
    this.state.set(profile);
  }

  async clear(): Promise<void> {
    failIfSet(this.clearFailure);
    this.state.set(null);
  }
}
