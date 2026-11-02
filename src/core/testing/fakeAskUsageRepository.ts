import type { AskUsage, AskUsageRepository } from '../data/askUsageRepository';
import { failIfSet, FakeRepository } from './fakeRepository';

export class FakeAskUsageRepository extends FakeRepository<AskUsage | null> implements AskUsageRepository {
  /** When set, [save] fails like an unwritable store. */
  writeFailure: Error | null = null;

  constructor(initial: AskUsage | null = null) {
    super(initial);
  }

  async save(usage: AskUsage): Promise<void> {
    failIfSet(this.writeFailure);
    this.state.set(usage);
  }
}
