import { civilOfEpochDay, deepEqual, resolveBirth, type ObservableRepository } from '@/core/data';
import { todayEpochDay, type BirthProfile } from '@/core/model';
import type { Branch, CivilDate } from '@/engine';

import { toCharts } from './birthCharts';
import type { BirthCharts } from './chartViews';

/** What a charts screen shows (Kotlin sealed `ChartsUiState`). */
export type ChartsUiState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'noProfile' }
  /** The profile could not be turned into charts (a date outside the supported range). */
  | { readonly kind: 'unavailable' }
  /** [selectedPalace] is the Tử Vi palace being read; the Life palace until the user taps another. */
  | { readonly kind: 'ready'; readonly charts: BirthCharts; readonly selectedPalace: Branch | null };

// Value + type pair, like a Kotlin sealed class with its objects.
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ChartsUiState = Object.freeze({
  Loading: Object.freeze({ kind: 'loading' }) as ChartsUiState,
  NoProfile: Object.freeze({ kind: 'noProfile' }) as ChartsUiState,
  Unavailable: Object.freeze({ kind: 'unavailable' }) as ChartsUiState,
});

/** Today's local date (Kotlin `LocalDate.now()`). */
export const localToday = (): CivilDate => civilOfEpochDay(todayEpochDay());

/** Charts for [profile] on [today], or null when the profile cannot be resolved (out of range). */
export function chartsOf(profile: BirthProfile, today: CivilDate): BirthCharts | null {
  try {
    return toCharts(resolveBirth(profile), today);
  } catch {
    // Kotlin `runCatching`: a date outside the calendar range becomes the Unavailable notice.
    return null;
  }
}

/** Not yet read: undefined; no profile: null; otherwise the charts, or null charts when unavailable. */
type ChartsResult = { readonly charts: BirthCharts | null } | null | undefined;

/**
 * The owner's charts, recomputed only when the profile changes (Kotlin `ChartsViewModel`).
 * Each chart screen holds its own model, like each Kotlin destination held its own view model.
 * Selecting a palace keeps the charts; a new profile resets the selection to its Life palace.
 */
export class ChartsModel {
  private profile: BirthProfile | null | undefined = undefined;
  private result: ChartsResult = undefined;
  private selected: Branch | null = null;
  private snapshot: ChartsUiState = ChartsUiState.Loading;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly profiles: ObservableRepository<BirthProfile | null>,
    private readonly today: () => CivilDate = localToday,
  ) {
    const known = profiles.current();
    if (known !== undefined) this.onProfile(known);
  }

  /** Follows the repository until the returned function is called. */
  start(): () => void {
    const unsubscribe = this.profiles.subscribe((profile) => this.onProfile(profile));
    const known = this.profiles.current();
    if (known !== undefined) this.onProfile(known);
    else void this.profiles.load().then((profile) => this.onProfile(profile));
    return unsubscribe;
  }

  readonly current = (): ChartsUiState => this.snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly onSelectPalace = (branch: Branch): void => {
    if (this.selected === branch) return;
    this.selected = branch;
    this.publish();
  };

  private onProfile(profile: BirthProfile | null): void {
    // distinctUntilChanged: the same profile read again keeps the charts and the selection.
    if (this.profile !== undefined && deepEqual(this.profile, profile)) return;
    this.profile = profile;
    this.result = profile === null ? null : { charts: chartsOf(profile, this.today()) };
    this.selected = null;
    this.publish();
  }

  private publish(): void {
    this.snapshot = stateOf(this.result, this.selected);
    for (const listener of [...this.listeners]) listener();
  }
}

function stateOf(result: ChartsResult, selected: Branch | null): ChartsUiState {
  if (result === undefined) return ChartsUiState.Loading;
  if (result === null) return ChartsUiState.NoProfile;
  const { charts } = result;
  if (charts === null) return ChartsUiState.Unavailable;
  return Object.freeze({ kind: 'ready', charts, selectedPalace: selected ?? charts.ziWei?.lifeBranch ?? null });
}
