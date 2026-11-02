import type { MutablePrefs, Prefs, PreferencesFile } from '../storage/preferencesFile';
import { MutableState } from './state';

/**
 * What the Kotlin repositories expose as a Flow: a value read from storage and kept current.
 * [current] is undefined until the first [load] (or write) has finished.
 */
export interface ObservableRepository<T> {
  /** Reads the stored value once; later calls resolve to the value already held. */
  load(): Promise<T>;
  current(): T | undefined;
  /** Called after every change with the new value. Returns the unsubscribe function. */
  subscribe(listener: (value: T) => void): () => void;
}

/** Shared plumbing for the repositories backed by one [PreferencesFile]. */
export abstract class PreferencesRepository<T> implements ObservableRepository<T> {
  private readonly state = new MutableState<T | undefined>(undefined);
  private loading: Promise<T> | null = null;

  constructor(private readonly file: PreferencesFile) {}

  /** Turns the stored preferences into the value; never throws on bad data. */
  protected abstract decode(prefs: Prefs): T;

  load(): Promise<T> {
    const known = this.state.current();
    if (known !== undefined) return Promise.resolve(known);
    this.loading ??= this.file.data().then((prefs) => {
      // A write that finished first already holds the newer value.
      if (this.state.current() === undefined) this.state.set(this.decode(prefs));
      return this.state.current() as T;
    });
    return this.loading;
  }

  current(): T | undefined {
    return this.state.current();
  }

  subscribe(listener: (value: T) => void): () => void {
    return this.state.subscribe((value) => {
      if (value !== undefined) listener(value);
    });
  }

  /** Writes through the file, then publishes the value decoded from what was written. */
  protected async edit(transform: (prefs: MutablePrefs) => void): Promise<void> {
    const prefs = await this.file.edit(transform);
    this.state.set(this.decode(prefs));
  }
}
