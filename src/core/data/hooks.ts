import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { BirthProfile, Partner, UserSettings } from '../model';
import type { AskUsage } from './askUsageRepository';
import type { Membership } from './billing/billing';
import type { EraseStatus } from './dataEraser';
import { useServices } from './services';
import type { ObservableRepository } from './state/repository';
import type { ReadonlyState } from './state/state';

/**
 * The repository's value, re-rendering on every change. Starts the first read on mount and is
 * undefined until it finishes (a stored "nothing" is null, not undefined).
 */
export function useRepository<T>(repository: ObservableRepository<T>): T | undefined {
  const subscribe = useCallback((onChange: () => void) => repository.subscribe(onChange), [repository]);
  const getSnapshot = useCallback(() => repository.current(), [repository]);
  useEffect(() => {
    // load() never rejects: unreadable storage decodes as empty, like the Kotlin repositories.
    void repository.load();
  }, [repository]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** A state that always has a value, re-rendering on every change. */
export function useStateValue<T>(state: ReadonlyState<T>): T {
  const subscribe = useCallback((onChange: () => void) => state.subscribe(onChange), [state]);
  const getSnapshot = useCallback(() => state.current(), [state]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const useSettings = (): UserSettings | undefined => useRepository(useServices().settings);

/** The owner's profile: undefined while loading, null before onboarding saved one. */
export const usePrimaryProfile = (): BirthProfile | null | undefined => useRepository(useServices().profile);

export const usePartners = (): readonly Partner[] | undefined => useRepository(useServices().partners);

/** Today's Ask AI usage record: undefined while loading, null before the first question. */
export const useAskUsage = (): AskUsage | null | undefined => useRepository(useServices().askUsage);

export const useMembership = (): Membership => useStateValue(useServices().billing.membership);

export const useEraseStatus = (): EraseStatus => useStateValue(useServices().eraser.status);
