import type { ObservableRepository } from '../data/state/repository';
import { MutableState } from '../data/state/state';

/**
 * In-memory base for the fake repositories: loaded from the start, and [state] is open so a test
 * can push a value the way Kotlin tests set a MutableStateFlow.
 */
export abstract class FakeRepository<T> implements ObservableRepository<T> {
  readonly state: MutableState<T>;

  protected constructor(initial: T) {
    this.state = new MutableState(initial);
  }

  load(): Promise<T> {
    return Promise.resolve(this.state.current());
  }

  current(): T {
    return this.state.current();
  }

  subscribe(listener: (value: T) => void): () => void {
    return this.state.subscribe(listener);
  }
}

/** Throws [failure] when set, like an unwritable store. */
export function failIfSet(failure: Error | null): void {
  if (failure) throw failure;
}
