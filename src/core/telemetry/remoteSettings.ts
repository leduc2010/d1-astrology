import { useSyncExternalStore } from 'react';

import { DEFAULT_REMOTE_VALUES, remoteValuesFrom, type RemoteValues } from './remoteValues';

/**
 * Remote-tunable values as an observable store (Kotlin `StateFlow<RemoteValues>`): read the
 * current snapshot, subscribe to changes, and ask for a refresh.
 */
export interface RemoteSettings {
  getValues(): RemoteValues;
  /** Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  refresh(): Promise<void>;
}

/**
 * The built-in defaults, served when the build has no remote config backend. They never change,
 * so `refresh` is a no-op and listeners are never called.
 */
export class DefaultRemoteSettings implements RemoteSettings {
  private readonly values: RemoteValues = remoteValuesFrom(() => '');

  getValues(): RemoteValues {
    return this.values;
  }

  // Nothing ever changes, so the listener is never kept.
  subscribe(listener: () => void): () => void {
    return () => undefined;
  }

  refresh(): Promise<void> {
    return Promise.resolve();
  }
}

/** The current remote values; the component re-renders when they change. */
export function useRemoteValues(settings: RemoteSettings): RemoteValues {
  return useSyncExternalStore(
    (listener) => settings.subscribe(listener),
    () => settings.getValues(),
    () => DEFAULT_REMOTE_VALUES,
  );
}
