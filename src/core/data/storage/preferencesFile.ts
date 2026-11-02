import type { KeyValueStore } from './keyValueStore';

/** One namespace's keys and string values, like a DataStore `Preferences` snapshot. */
export type Prefs = ReadonlyMap<string, string>;
export type MutablePrefs = Map<string, string>;

const EMPTY: Prefs = new Map();

/**
 * A DataStore preferences file on top of a shared [KeyValueStore]: every key lives under
 * `namespace.`, edits run one at a time and see the result of the previous one, and the last
 * written snapshot is kept in memory. Create one per namespace per process (the services
 * container owns them), as two instances would not see each other's edits.
 */
export class PreferencesFile {
  private snapshot: Prefs | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private readonly prefix: string;

  constructor(
    private readonly store: KeyValueStore,
    namespace: string,
  ) {
    this.prefix = `${namespace}.`;
  }

  /**
   * The current contents. An unreadable store reads as empty, like the IOException fallback of
   * the Kotlin repositories, so the app shows defaults instead of failing to start.
   */
  async data(): Promise<Prefs> {
    try {
      return await this.read();
    } catch {
      return EMPTY;
    }
  }

  /**
   * Applies [transform] to a copy of the contents and writes the difference. Rejects when the
   * store cannot be read or written; the in-memory snapshot then keeps the last good state.
   */
  edit(transform: (prefs: MutablePrefs) => void): Promise<Prefs> {
    const run = async (): Promise<Prefs> => {
      const before = await this.read();
      const next: MutablePrefs = new Map(before);
      transform(next);
      const changed = [...next].filter(([key, value]) => before.get(key) !== value);
      const removed = [...before.keys()].filter((key) => !next.has(key));
      await this.store.setMany(changed.map(([key, value]) => [this.prefix + key, value] as const));
      await this.store.removeMany(removed.map((key) => this.prefix + key));
      this.snapshot = next;
      return next;
    };
    const result = this.queue.then(run, run);
    // The queue only orders edits; each caller still gets its own failure.
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async read(): Promise<Prefs> {
    if (this.snapshot) return this.snapshot;
    const keys = (await this.store.getAllKeys()).filter((key) => key.startsWith(this.prefix));
    const entries = await this.store.getMany(keys);
    const prefs: MutablePrefs = new Map();
    for (const [key, value] of entries) {
      if (value !== null) prefs.set(key.slice(this.prefix.length), value);
    }
    this.snapshot = prefs;
    return prefs;
  }
}
