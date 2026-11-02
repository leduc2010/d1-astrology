import { DEFAULT_SETTINGS, WeekStart } from '../../model';
import { createSettingsRepository } from '../settingsRepository';
import { MemoryKeyValueStore } from '../storage/keyValueStore';

// Port of DataStoreSettingsRepositoryTest; every test starts on an empty store.
const repository = () => createSettingsRepository(new MemoryKeyValueStore());

describe('DataStoreSettingsRepository', () => {
  test('fresh store emits defaults', async () => {
    expect(await repository().load()).toEqual(DEFAULT_SETTINGS);
  });

  test('writes are reflected in the settings flow', async () => {
    const repo = repository();

    await repo.setSoundEnabled(false);
    await repo.setReducedMotion(true);
    await repo.setOnboardingCompleted(true);
    await repo.setShowLunarInCalendar(false);

    const settings = await repo.load();
    expect(settings.soundEnabled).toBe(false);
    expect(settings.reducedMotion).toBe(true);
    expect(settings.onboardingCompleted).toBe(true);
    expect(settings.showLunarInCalendar).toBe(false);
  });

  test('consents are stored together', async () => {
    const repo = repository();

    await repo.setConsents(true, false);

    const settings = await repo.load();
    expect(settings.personalizedTips).toBe(true);
    expect(settings.analyticsConsent).toBe(false);
  });

  test('each consent and the week start can be changed on their own', async () => {
    const repo = repository();

    await repo.setPersonalizedTips(true);
    await repo.setAnalytics(true);
    await repo.setPersonalizedAds(true);
    await repo.setWeekStart(WeekStart.SUNDAY);
    await repo.setAnalytics(false);

    const settings = await repo.load();
    expect(settings.personalizedTips).toBe(true);
    expect(settings.analyticsConsent).toBe(false);
    expect(settings.personalizedAds).toBe(true);
    expect(settings.weekStart).toBe(WeekStart.SUNDAY);
  });

  test('clear brings back the defaults', async () => {
    const repo = repository();
    await repo.setOnboardingCompleted(true);
    await repo.setWeekStart(WeekStart.SUNDAY);

    await repo.clear();

    expect(await repo.load()).toEqual(DEFAULT_SETTINGS);
  });
});
