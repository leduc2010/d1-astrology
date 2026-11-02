/**
 * The device key-value store the repositories persist to. String values only; each repository
 * keeps its keys under its own prefix, standing in for the separate DataStore files on Android.
 */
export interface KeyValueStore {
  getAllKeys(): Promise<readonly string[]>;
  /** Values in the order of [keys]; null for a key that is not stored. */
  getMany(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]>;
  setMany(entries: readonly (readonly [string, string])[]): Promise<void>;
  removeMany(keys: readonly string[]): Promise<void>;
}

/** In-memory store for tests, fakes and previews. Nothing leaves the process. */
export class MemoryKeyValueStore implements KeyValueStore {
  private readonly entries: Map<string, string>;

  constructor(initial: Iterable<readonly [string, string]> = []) {
    this.entries = new Map(initial);
  }

  async getAllKeys(): Promise<readonly string[]> {
    return [...this.entries.keys()];
  }

  async getMany(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]> {
    return keys.map((key) => [key, this.entries.get(key) ?? null] as const);
  }

  async setMany(entries: readonly (readonly [string, string])[]): Promise<void> {
    for (const [key, value] of entries) this.entries.set(key, value);
  }

  async removeMany(keys: readonly string[]): Promise<void> {
    for (const key of keys) this.entries.delete(key);
  }

  /** A copy of everything stored, for assertions. */
  snapshot(): ReadonlyMap<string, string> {
    return new Map(this.entries);
  }
}
