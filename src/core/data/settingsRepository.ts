import { DEFAULT_SETTINGS, WeekStart, type UserSettings } from '../model';
import { PreferencesRepository, type ObservableRepository } from './state/repository';
import { readBoolean, readString, writeBoolean, writeString } from './storage/codec';
import type { KeyValueStore } from './storage/keyValueStore';
import { PreferencesFile, type MutablePrefs, type Prefs } from './storage/preferencesFile';

export interface SettingsRepository extends ObservableRepository<UserSettings> {
  setSoundEnabled(enabled: boolean): Promise<void>;
  setReducedMotion(enabled: boolean): Promise<void>;
  setOnboardingCompleted(completed: boolean): Promise<void>;
  /** Records the answers of the consent step in one write. */
  setConsents(personalizedTips: boolean, analytics: boolean): Promise<void>;
  setPersonalizedTips(enabled: boolean): Promise<void>;
  setAnalytics(enabled: boolean): Promise<void>;
  setPersonalizedAds(enabled: boolean): Promise<void>;
  setWeekStart(weekStart: WeekStart): Promise<void>;
  setShowLunarInCalendar(enabled: boolean): Promise<void>;
  /** Ask AI may send the question and a chart summary to the AI proxy. RN-only. */
  setAiConsent(enabled: boolean): Promise<void>;
  /** The app language code, or null to follow the device. RN-only (Android uses per-app locales). */
  setLanguage(language: string | null): Promise<void>;
  /**
   * Forgets every setting, onboarding included. The app language is kept, as Android keeps it in
   * the system's per-app locale, which erasing the app's data does not touch.
   */
  clear(): Promise<void>;
}

/** Namespace standing in for the Kotlin `settings` DataStore file. */
export const SETTINGS_FILE = 'settings';

const Keys = Object.freeze({
  SOUND: 'sound_enabled',
  REDUCED_MOTION: 'reduced_motion',
  ONBOARDING_DONE: 'onboarding_completed',
  PERSONALIZED_TIPS: 'consent_personalized_tips',
  ANALYTICS: 'consent_analytics',
  PERSONALIZED_ADS: 'consent_personalized_ads',
  WEEK_START: 'week_start',
  SHOW_LUNAR: 'calendar_show_lunar',
  LANGUAGE: 'app_language',
  AI_CONSENT: 'consent_ai',
});

const WEEK_STARTS: readonly WeekStart[] = [WeekStart.MONDAY, WeekStart.SUNDAY];

class StoredSettingsRepository extends PreferencesRepository<UserSettings> implements SettingsRepository {
  setSoundEnabled(enabled: boolean): Promise<void> {
    return this.setFlag(Keys.SOUND, enabled);
  }

  setReducedMotion(enabled: boolean): Promise<void> {
    return this.setFlag(Keys.REDUCED_MOTION, enabled);
  }

  setOnboardingCompleted(completed: boolean): Promise<void> {
    return this.setFlag(Keys.ONBOARDING_DONE, completed);
  }

  setPersonalizedTips(enabled: boolean): Promise<void> {
    return this.setFlag(Keys.PERSONALIZED_TIPS, enabled);
  }

  setAnalytics(enabled: boolean): Promise<void> {
    return this.setFlag(Keys.ANALYTICS, enabled);
  }

  setPersonalizedAds(enabled: boolean): Promise<void> {
    return this.setFlag(Keys.PERSONALIZED_ADS, enabled);
  }

  setShowLunarInCalendar(enabled: boolean): Promise<void> {
    return this.setFlag(Keys.SHOW_LUNAR, enabled);
  }

  setAiConsent(enabled: boolean): Promise<void> {
    return this.setFlag(Keys.AI_CONSENT, enabled);
  }

  setConsents(personalizedTips: boolean, analytics: boolean): Promise<void> {
    return this.edit((prefs) => {
      writeBoolean(prefs, Keys.PERSONALIZED_TIPS, personalizedTips);
      writeBoolean(prefs, Keys.ANALYTICS, analytics);
    });
  }

  setWeekStart(weekStart: WeekStart): Promise<void> {
    return this.edit((prefs) => writeString(prefs, Keys.WEEK_START, weekStart));
  }

  setLanguage(language: string | null): Promise<void> {
    return this.edit((prefs) => {
      if (language === null) prefs.delete(Keys.LANGUAGE);
      else writeString(prefs, Keys.LANGUAGE, language);
    });
  }

  clear(): Promise<void> {
    return this.edit((prefs) => {
      const language = prefs.get(Keys.LANGUAGE);
      prefs.clear();
      if (language !== undefined) prefs.set(Keys.LANGUAGE, language);
    });
  }

  protected decode(prefs: Prefs): UserSettings {
    const d = DEFAULT_SETTINGS;
    const weekStart = readString(prefs, Keys.WEEK_START);
    return Object.freeze({
      soundEnabled: readBoolean(prefs, Keys.SOUND) ?? d.soundEnabled,
      reducedMotion: readBoolean(prefs, Keys.REDUCED_MOTION) ?? d.reducedMotion,
      onboardingCompleted: readBoolean(prefs, Keys.ONBOARDING_DONE) ?? d.onboardingCompleted,
      personalizedTips: readBoolean(prefs, Keys.PERSONALIZED_TIPS) ?? d.personalizedTips,
      analyticsConsent: readBoolean(prefs, Keys.ANALYTICS) ?? d.analyticsConsent,
      personalizedAds: readBoolean(prefs, Keys.PERSONALIZED_ADS) ?? d.personalizedAds,
      weekStart: WEEK_STARTS.find((w) => w === weekStart) ?? d.weekStart,
      showLunarInCalendar: readBoolean(prefs, Keys.SHOW_LUNAR) ?? d.showLunarInCalendar,
      aiConsent: readBoolean(prefs, Keys.AI_CONSENT) ?? d.aiConsent,
      language: readString(prefs, Keys.LANGUAGE) ?? d.language,
    });
  }

  private setFlag(key: string, value: boolean): Promise<void> {
    return this.edit((prefs: MutablePrefs) => writeBoolean(prefs, key, value));
  }
}

/** Builds the single settings store. Call once per process (the services container owns it). */
export function createSettingsRepository(store: KeyValueStore): SettingsRepository {
  return new StoredSettingsRepository(new PreferencesFile(store, SETTINGS_FILE));
}
