import { birthClock, birthPlace, Gender, Relationship, WeekStart, type BirthProfile } from '../../model';
import { createPartnerRepository } from '../partnerRepository';
import { createProfileRepository } from '../profileRepository';
import { createSettingsRepository } from '../settingsRepository';
import { createAsyncStorageStore } from '../storage/asyncStorageStore';
import { MemoryKeyValueStore } from '../storage/keyValueStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// RN-only behaviour around the ported repositories: storage across restarts, unreadable data
// and the AsyncStorage adapter. Made-up birth data only.
const profile: BirthProfile = {
  name: 'Minh Anh',
  gender: Gender.FEMALE,
  date: { year: 1995, month: 8, day: 15 },
  clock: birthClock(11, 30),
  place: birthPlace('Hà Đông', 'Hà Nội', 20.97, 105.78, 'Asia/Ho_Chi_Minh'),
  enteredAsLunar: false,
};

describe('stored repositories', () => {
  test('a new repository on the same store reads what the last one saved', async () => {
    const store = new MemoryKeyValueStore();
    await createProfileRepository(store).savePrimary(profile);
    await createSettingsRepository(store).setWeekStart(WeekStart.SUNDAY);

    expect(await createProfileRepository(store).load()).toEqual(profile);
    expect((await createSettingsRepository(store).load()).weekStart).toBe(WeekStart.SUNDAY);
  });

  test('keys live under their file namespace', async () => {
    const store = new MemoryKeyValueStore();
    await createProfileRepository(store).savePrimary(profile);

    const keys = [...store.snapshot().keys()];
    expect(keys).toContain('profile.name');
    expect(keys.every((key) => key.startsWith('profile.'))).toBe(true);
  });

  test('an unreadable profile reads as no profile', async () => {
    const badGender = new MemoryKeyValueStore();
    await createProfileRepository(badGender).savePrimary(profile);
    await badGender.setMany([['profile.gender', 'NOT_A_GENDER']]);

    const badYear = new MemoryKeyValueStore();
    await createProfileRepository(badYear).savePrimary(profile);
    await badYear.setMany([['profile.birth_year', 'nineteen']]);

    expect(await createProfileRepository(badGender).load()).toBeNull();
    expect(await createProfileRepository(badYear).load()).toBeNull();
  });

  test('unreadable partner entries are skipped, the rest still load', async () => {
    const store = new MemoryKeyValueStore();
    const repo = createPartnerRepository(store);
    await repo.add(profile, Relationship.FRIEND, 20_000);
    const second = await repo.add({ ...profile, name: 'Bảo' }, Relationship.SPOUSE, 20_001);
    await store.setMany([['partners.p1_relationship', 'NOT_A_RELATIONSHIP']]);

    const loaded = await createPartnerRepository(store).load();
    expect(loaded.map((it) => it.id)).toEqual([second]);
  });

  test('clearing settings keeps the chosen language', async () => {
    const repo = createSettingsRepository(new MemoryKeyValueStore());
    await repo.setLanguage('vi');
    await repo.setSoundEnabled(false);

    await repo.clear();

    const settings = await repo.load();
    expect(settings.language).toBe('vi');
    expect(settings.onboardingCompleted).toBe(false);
  });

  test('subscribers hear each saved change once', async () => {
    const repo = createProfileRepository(new MemoryKeyValueStore());
    await repo.load();
    const heard: (BirthProfile | null)[] = [];
    const stop = repo.subscribe((value) => heard.push(value));

    await repo.savePrimary(profile);
    await repo.savePrimary(profile);
    await repo.clear();
    stop();

    expect(heard).toEqual([profile, null]);
  });
});

describe('AsyncStorage store', () => {
  test('round trips values through AsyncStorage', async () => {
    const store = createAsyncStorageStore();
    await store.setMany([
      ['a', '1'],
      ['b', '2'],
    ]);
    await store.removeMany(['a']);

    expect(await store.getMany(['a', 'b'])).toEqual([
      ['a', null],
      ['b', '2'],
    ]);
    expect(await store.getAllKeys()).toContain('b');
  });

  test('profile repository works on top of it', async () => {
    const store = createAsyncStorageStore();
    await createProfileRepository(store).savePrimary(profile);
    expect(await createProfileRepository(store).load()).toEqual(profile);
  });
});
