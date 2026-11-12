import { DEFAULT_SETTINGS, type UserSettings, type WeekStart } from '../model';
import type { SettingsRepository } from '../data/settingsRepository';
import { failIfSet, FakeRepository } from './fakeRepository';

export class FakeSettingsRepository extends FakeRepository<UserSettings> implements SettingsRepository {
  /** When set, every setter fails like an unwritable store. */
  writeFailure: Error | null = null;
  /** When set, [clear] fails like an unwritable store. */
  clearFailure: Error | null = null;

  constructor(initial: UserSettings = DEFAULT_SETTINGS) {
    super(initial);
  }

  setSoundEnabled(enabled: boolean): Promise<void> {
    return this.write({ soundEnabled: enabled });
  }

  setReducedMotion(enabled: boolean): Promise<void> {
    return this.write({ reducedMotion: enabled });
  }

  setOnboardingCompleted(completed: boolean): Promise<void> {
    return this.write({ onboardingCompleted: completed });
  }

  setConsents(personalizedTips: boolean, analytics: boolean): Promise<void> {
    return this.write({ personalizedTips, analyticsConsent: analytics });
  }

  setPersonalizedTips(enabled: boolean): Promise<void> {
    return this.write({ personalizedTips: enabled });
  }

  setAnalytics(enabled: boolean): Promise<void> {
    return this.write({ analyticsConsent: enabled });
  }

  setPersonalizedAds(enabled: boolean): Promise<void> {
    return this.write({ personalizedAds: enabled });
  }

  setWeekStart(weekStart: WeekStart): Promise<void> {
    return this.write({ weekStart });
  }

  setShowLunarInCalendar(enabled: boolean): Promise<void> {
    return this.write({ showLunarInCalendar: enabled });
  }

  setAiConsent(enabled: boolean): Promise<void> {
    return this.write({ aiConsent: enabled });
  }

  setLanguage(language: string | null): Promise<void> {
    return this.write({ language });
  }

  /** Back to the defaults, keeping the language like the real repository. */
  async clear(): Promise<void> {
    failIfSet(this.clearFailure);
    this.state.set(Object.freeze({ ...DEFAULT_SETTINGS, language: this.state.current().language }));
  }

  private async write(change: Partial<UserSettings>): Promise<void> {
    failIfSet(this.writeFailure);
    this.state.update((settings) => Object.freeze({ ...settings, ...change }));
  }
}
