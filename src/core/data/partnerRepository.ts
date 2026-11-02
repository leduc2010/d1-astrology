import { RELATIONSHIPS, type BirthProfile, type Partner, type Relationship } from '../model';
import { ProfileFields } from './profileFields';
import { PreferencesRepository, type ObservableRepository } from './state/repository';
import { readInteger, readString, readStringSet, writeInteger, writeString, writeStringSet } from './storage/codec';
import type { KeyValueStore } from './storage/keyValueStore';
import { PreferencesFile, type Prefs } from './storage/preferencesFile';

/**
 * People the owner compares charts with: everyone added, oldest first, unreadable entries
 * skipped. Like the owner's profile this stays on the device and is never sent anywhere.
 */
export interface PartnerRepository extends ObservableRepository<readonly Partner[]> {
  /** Saves a new person and returns their id. */
  add(profile: BirthProfile, relationship: Relationship, addedOnEpochDay: number): Promise<number>;
  /** Deletes the person and everything stored about them. */
  remove(id: number): Promise<void>;
  clear(): Promise<void>;
}

/** Namespace standing in for the Kotlin `partners` DataStore file. */
export const PARTNERS_FILE = 'partners';

const IDS = 'partner_ids';
const NEXT_ID = 'next_partner_id';
const FIRST_ID = 1;
const LONG = /^[+-]?\d+$/;

const prefix = (id: number) => `p${id}_`;
const fieldsOf = (id: number) => new ProfileFields(prefix(id));
const relationshipKey = (id: number) => `${prefix(id)}relationship`;
const addedOnKey = (id: number) => `${prefix(id)}added_on`;

/** Stored ids that parse as whole numbers, like Kotlin `mapNotNull(String::toLongOrNull)`. */
function idsOf(prefs: Prefs): number[] {
  return (readStringSet(prefs, IDS) ?? [])
    .filter((text) => LONG.test(text))
    .map(Number)
    .filter(Number.isSafeInteger);
}

function partnerOf(prefs: Prefs, id: number): Partner | null {
  const profile = fieldsOf(id).read(prefs);
  const stored = readString(prefs, relationshipKey(id));
  const relationship = RELATIONSHIPS.find((r) => r === stored);
  const addedOnEpochDay = readInteger(prefs, addedOnKey(id));
  if (profile === null || relationship === undefined || addedOnEpochDay === null) return null;
  return Object.freeze({ id, profile, relationship, addedOnEpochDay });
}

class StoredPartnerRepository extends PreferencesRepository<readonly Partner[]> implements PartnerRepository {
  async add(profile: BirthProfile, relationship: Relationship, addedOnEpochDay: number): Promise<number> {
    let id = 0;
    await this.edit((prefs) => {
      id = readInteger(prefs, NEXT_ID) ?? FIRST_ID;
      writeInteger(prefs, NEXT_ID, id + 1);
      writeStringSet(prefs, IDS, [...idsOf(prefs).map(String), String(id)]);
      fieldsOf(id).write(prefs, profile);
      writeString(prefs, relationshipKey(id), relationship);
      writeInteger(prefs, addedOnKey(id), addedOnEpochDay);
    });
    return id;
  }

  remove(id: number): Promise<void> {
    return this.edit((prefs) => {
      writeStringSet(prefs, IDS, idsOf(prefs).filter((it) => it !== id).map(String));
      fieldsOf(id).remove(prefs);
      prefs.delete(relationshipKey(id));
      prefs.delete(addedOnKey(id));
    });
  }

  clear(): Promise<void> {
    return this.edit((prefs) => prefs.clear());
  }

  protected decode(prefs: Prefs): readonly Partner[] {
    const ids = idsOf(prefs).sort((a, b) => a - b);
    return Object.freeze(ids.map((id) => partnerOf(prefs, id)).filter((p): p is Partner => p !== null));
  }
}

/** Builds the single partner store. Call once per process (the services container owns it). */
export function createPartnerRepository(store: KeyValueStore): PartnerRepository {
  return new StoredPartnerRepository(new PreferencesFile(store, PARTNERS_FILE));
}
