import { civilDate } from '../../../engine/time/civilDate';
import { askUsage, createAskUsageRepository } from '../askUsageRepository';
import { MemoryKeyValueStore } from '../storage/keyValueStore';
import { epochDayOf } from '../time/epochDay';

// Port of DataStoreAskUsageRepositoryTest; days are epoch days instead of LocalDate.
const repository = () => createAskUsageRepository(new MemoryKeyValueStore());

describe('DataStoreAskUsageRepository', () => {
  test('nothing is saved before the first question', async () => {
    expect(await repository().load()).toBeNull();
  });

  test('the last saved day is read back whole', async () => {
    const repo = repository();
    const usage = askUsage(epochDayOf(civilDate(2026, 11, 1)), 3, 2, 1);

    await repo.save(askUsage(epochDayOf(civilDate(2026, 10, 31)), 1));
    await repo.save(usage);

    expect(await repo.load()).toEqual(usage);
  });
});
