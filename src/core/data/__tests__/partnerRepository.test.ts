import { birthClock, birthPlace, Gender, Relationship, type BirthProfile } from '../../model';
import { createPartnerRepository } from '../partnerRepository';
import { MemoryKeyValueStore } from '../storage/keyValueStore';

// Port of DataStorePartnerRepositoryTest. Made-up birth data only.
const repository = () => createPartnerRepository(new MemoryKeyValueStore());

const tuan: BirthProfile = {
  name: 'Tuấn',
  gender: Gender.MALE,
  date: { year: 1994, month: 3, day: 2 },
  clock: null,
  place: birthPlace('Huế', 'Thừa Thiên Huế', 16.46, 107.59, 'Asia/Ho_Chi_Minh'),
  enteredAsLunar: false,
};
const ha: BirthProfile = { ...tuan, name: 'Hà', gender: Gender.FEMALE, clock: birthClock(6, 15), enteredAsLunar: true };

describe('DataStorePartnerRepository', () => {
  test('fresh store has nobody', async () => {
    expect(await repository().load()).toEqual([]);
  });

  test('added people come back oldest first with what was saved', async () => {
    const repo = repository();
    const first = await repo.add(tuan, Relationship.PARTNER, 20_000);
    const second = await repo.add(ha, Relationship.COLLEAGUE, 20_001);

    expect(first).not.toBe(second);
    expect(await repo.load()).toEqual([
      { id: first, profile: tuan, relationship: Relationship.PARTNER, addedOnEpochDay: 20_000 },
      { id: second, profile: ha, relationship: Relationship.COLLEAGUE, addedOnEpochDay: 20_001 },
    ]);
  });

  test('removing someone deletes only them and ids are not reused', async () => {
    const repo = repository();
    const first = await repo.add(tuan, Relationship.PARTNER, 20_000);
    const second = await repo.add(ha, Relationship.FRIEND, 20_001);

    await repo.remove(first);
    const third = await repo.add(tuan, Relationship.SPOUSE, 20_002);

    expect((await repo.load()).map((it) => it.id)).toEqual([second, third]);
    expect(third).toBeGreaterThan(second);
  });

  test('clear removes everyone', async () => {
    const repo = repository();
    await repo.add(tuan, Relationship.PARTNER, 20_000);
    await repo.clear();
    expect(await repo.load()).toEqual([]);
  });
});
