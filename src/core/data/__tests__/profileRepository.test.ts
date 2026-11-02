import { birthClock, birthPlace, Gender, type BirthProfile } from '../../model';
import { createProfileRepository } from '../profileRepository';
import { MemoryKeyValueStore } from '../storage/keyValueStore';

// Port of DataStoreProfileRepositoryTest. Made-up birth data only.
const repository = () => createProfileRepository(new MemoryKeyValueStore());

const profile: BirthProfile = {
  name: 'Minh Anh',
  gender: Gender.FEMALE,
  date: { year: 1995, month: 8, day: 15 },
  clock: birthClock(11, 30),
  place: birthPlace('Hà Đông', 'Hà Nội', 20.97, 105.78, 'Asia/Ho_Chi_Minh'),
  enteredAsLunar: false,
};

describe('DataStoreProfileRepository', () => {
  test('fresh store has no profile', async () => {
    expect(await repository().load()).toBeNull();
  });

  test('saved profile round trips', async () => {
    const repo = repository();
    await repo.savePrimary(profile);
    expect(await repo.load()).toEqual(profile);
  });

  test('unknown birth time is dropped when saving over a known one', async () => {
    const repo = repository();
    await repo.savePrimary(profile);
    const unknownTime = { ...profile, clock: null, enteredAsLunar: true };
    await repo.savePrimary(unknownTime);
    expect(await repo.load()).toEqual(unknownTime);
  });

  test('clear removes the profile', async () => {
    const repo = repository();
    await repo.savePrimary(profile);
    await repo.clear();
    expect(await repo.load()).toBeNull();
  });
});
