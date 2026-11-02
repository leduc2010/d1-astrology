import type { BirthProfile } from '../model';
import { ProfileFields } from './profileFields';
import { PreferencesRepository, type ObservableRepository } from './state/repository';
import type { KeyValueStore } from './storage/keyValueStore';
import { PreferencesFile, type Prefs } from './storage/preferencesFile';

/**
 * The owner's birth profile: null before onboarding (or when the stored one is unreadable).
 * Kept on the device only, never sent anywhere.
 */
export interface ProfileRepository extends ObservableRepository<BirthProfile | null> {
  savePrimary(profile: BirthProfile): Promise<void>;
  clear(): Promise<void>;
}

/** Namespace standing in for the Kotlin `profile` DataStore file. */
export const PROFILE_FILE = 'profile';

const FIELDS = new ProfileFields();

class StoredProfileRepository extends PreferencesRepository<BirthProfile | null> implements ProfileRepository {
  savePrimary(profile: BirthProfile): Promise<void> {
    return this.edit((prefs) => {
      prefs.clear();
      FIELDS.write(prefs, profile);
    });
  }

  clear(): Promise<void> {
    return this.edit((prefs) => prefs.clear());
  }

  protected decode(prefs: Prefs): BirthProfile | null {
    return FIELDS.read(prefs);
  }
}

/** Builds the single profile store. Call once per process (the services container owns it). */
export function createProfileRepository(store: KeyValueStore): ProfileRepository {
  return new StoredProfileRepository(new PreferencesFile(store, PROFILE_FILE));
}
