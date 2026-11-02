import { PreferencesRepository, type ObservableRepository } from './state/repository';
import { readInteger, writeInteger } from './storage/codec';
import type { KeyValueStore } from './storage/keyValueStore';
import { PreferencesFile, type Prefs } from './storage/preferencesFile';

/**
 * How much of one day's Ask AI allowance has been used. Counts only: questions and answers are
 * never stored. [epochDay] is the local date in days since 1970-01-01.
 */
export interface AskUsage {
  readonly epochDay: number;
  readonly freeUsed: number;
  readonly adsWatched: number;
  readonly adCredits: number;
}

export function askUsage(epochDay: number, freeUsed = 0, adsWatched = 0, adCredits = 0): AskUsage {
  return Object.freeze({ epochDay, freeUsed, adsWatched, adCredits });
}

/**
 * Keeps today's Ask AI allowance across restarts, so closing the app does not refill it.
 * The value is the last day saved, or null before the first question (or when unreadable).
 */
export interface AskUsageRepository extends ObservableRepository<AskUsage | null> {
  save(usage: AskUsage): Promise<void>;
}

/** Namespace standing in for the Kotlin `ask_usage` DataStore file. */
export const ASK_USAGE_FILE = 'ask_usage';

const Keys = Object.freeze({
  DAY: 'day',
  FREE_USED: 'free_used',
  ADS_WATCHED: 'ads_watched',
  AD_CREDITS: 'ad_credits',
});

const count = (prefs: Prefs, key: string): number => Math.max(readInteger(prefs, key) ?? 0, 0);

class StoredAskUsageRepository extends PreferencesRepository<AskUsage | null> implements AskUsageRepository {
  save(usage: AskUsage): Promise<void> {
    return this.edit((prefs) => {
      writeInteger(prefs, Keys.DAY, usage.epochDay);
      writeInteger(prefs, Keys.FREE_USED, usage.freeUsed);
      writeInteger(prefs, Keys.ADS_WATCHED, usage.adsWatched);
      writeInteger(prefs, Keys.AD_CREDITS, usage.adCredits);
    });
  }

  protected decode(prefs: Prefs): AskUsage | null {
    const day = readInteger(prefs, Keys.DAY);
    if (day === null) return null;
    return askUsage(day, count(prefs, Keys.FREE_USED), count(prefs, Keys.ADS_WATCHED), count(prefs, Keys.AD_CREDITS));
  }
}

/** Builds the single usage store. Call once per process (the services container owns it). */
export function createAskUsageRepository(store: KeyValueStore): AskUsageRepository {
  return new StoredAskUsageRepository(new PreferencesFile(store, ASK_USAGE_FILE));
}
