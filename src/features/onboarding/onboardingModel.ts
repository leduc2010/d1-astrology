import {
  delay,
  fixedOffsetZone,
  type ProfileRepository,
  type ResolvedBirth,
  searchPlaces,
  type SettingsRepository,
  zoneForCoordinates,
} from '@/core/data';
import { type BirthPlace, type BirthProfile, birthClock, birthPlace, type Gender } from '@/core/model';
import { BirthDates, type CalendarMode, type DateInput, dateInput } from '@/core/ui';
import { OrtusMotion } from '@/designsystem';
import type { CivilDate } from '@/engine';

import { coordinateText, entryOf, resolveProfile } from './profileDraft';
import {
  BUILD_TASKS,
  canContinue,
  EMPTY_BUILD,
  firstStep,
  OnboardingStep,
  onboardingUiState,
  type OnboardingUiState,
} from './onboardingState';

export const MAX_NAME_LENGTH = 40;
/** Each calculation lingers long enough to be read, like a slow reveal. */
export const TASK_MILLIS = OrtusMotion.CEREMONIAL / 2;

export interface OnboardingOptions {
  readonly settings: SettingsRepository;
  readonly profile: ProfileRepository;
  readonly today: CivilDate;
  /** The owner correcting saved details rather than a first launch. */
  readonly isEditing?: boolean;
  /** How the build waits between tasks; tests pass an instant one. */
  readonly wait?: (millis: number) => Promise<void>;
}

/**
 * First-launch flow: consent, birth date, time, place, name, review, then the chart build that
 * saves the profile. Everything stays on the device. With `isEditing` it is the owner's later
 * correction instead: the saved details are filled in, it opens on the date and saves only the profile.
 */
export class OnboardingController {
  private readonly dates: BirthDates;
  private readonly isEditing: boolean;
  private readonly wait: (millis: number) => Promise<void>;
  private readonly listeners = new Set<() => void>();
  private current: OnboardingUiState;
  private job: Promise<void> | null = null;
  private disposed = false;

  constructor(private readonly options: OnboardingOptions) {
    this.isEditing = options.isEditing ?? false;
    this.wait = options.wait ?? delay;
    this.dates = new BirthDates(options.today);
    const base = onboardingUiState({
      step: this.isEditing ? OnboardingStep.Date : OnboardingStep.Welcome,
      isEditing: this.isEditing,
      years: this.dates.years,
    });
    this.current = this.withDate(base, dateInput());
    if (this.isEditing) this.startPrefill();
  }

  get state(): OnboardingUiState {
    return this.current;
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly snapshot = (): OnboardingUiState => this.current;

  /** Resolves once the build or save in flight (if any) has finished. */
  async whenIdle(): Promise<void> {
    while (this.job !== null) await this.job;
  }

  /** Stops a running build when the screen goes away, like clearing the Kotlin view model. */
  dispose(): void {
    this.disposed = true;
  }

  /** Undoes `dispose` when React mounts the same screen again (Strict Mode). */
  resume(): void {
    this.disposed = false;
  }

  // region Navigation

  readonly next = (): void => {
    const state = this.current;
    if (!canContinue(state)) return;
    if (state.step === OnboardingStep.Review) this.build();
    else if (state.step !== OnboardingStep.Building) this.goTo(state.step + 1);
  };

  /** One step back; returns false on the first screen so the caller can leave (or the system close the app). */
  readonly back = (): boolean => {
    const state = this.current;
    if (state.step === firstStep(state)) return false;
    if (state.step === OnboardingStep.Building) {
      if (state.build.saveFailed) this.goTo(OnboardingStep.Review);
      return true;
    }
    this.goTo(state.step - 1);
    return true;
  };

  /** "Edit details" on the review screen starts again from the date. */
  readonly edit = (): void => this.goTo(OnboardingStep.Date);

  private goTo(step: OnboardingStep): void {
    this.update((state) => {
      const review = step === OnboardingStep.Review ? resolveProfile(state) : state.review;
      return { ...state, step, review };
    });
  }

  // endregion

  readonly setPersonalizedTips = (enabled: boolean): void => this.update((s) => ({ ...s, personalizedTips: enabled }));

  readonly setAnalytics = (enabled: boolean): void => this.update((s) => ({ ...s, analytics: enabled }));

  readonly setCalendarMode = (mode: CalendarMode): void =>
    this.update((s) => this.withDate(s, this.dates.switchMode(s.date, mode)));

  readonly setYear = (year: number): void => this.update((s) => this.withDate(s, dateInput({ ...s.date, year })));

  readonly setMonth = (month: number): void => this.update((s) => this.withDate(s, dateInput({ ...s.date, month })));

  readonly setDay = (day: number): void => this.update((s) => this.withDate(s, dateInput({ ...s.date, day })));

  readonly setLeapMonth = (isLeapMonth: boolean): void =>
    this.update((s) => this.withDate(s, dateInput({ ...s.date, isLeapMonth })));

  readonly setHour = (hour: number): void => this.update((s) => ({ ...s, clock: birthClock(hour, s.clock.minute) }));

  readonly setMinute = (minute: number): void =>
    this.update((s) => ({ ...s, clock: birthClock(s.clock.hour, minute) }));

  readonly setTimeUnknown = (unknown: boolean): void => this.update((s) => ({ ...s, isTimeUnknown: unknown }));

  readonly setPlaceQuery = (query: string): void =>
    this.update((s) => ({ ...s, placeQuery: query, placeResults: searchPlaces(query) }));

  readonly selectPlace = (place: BirthPlace): void => this.update((s) => ({ ...s, place }));

  /** A hand-typed place; `utcOffset` is the offset the user gave, else it is guessed from the spot. */
  readonly setCoordinates = (latitude: number, longitude: number, utcOffset: number | null = null): void => {
    const zoneId = utcOffset === null ? zoneForCoordinates(latitude, longitude) : fixedOffsetZone(utcOffset);
    const place = birthPlace(coordinateText(latitude, longitude), '', latitude, longitude, zoneId);
    this.update((s) => ({ ...s, place }));
  };

  readonly setName = (name: string): void => this.update((s) => ({ ...s, name: name.slice(0, MAX_NAME_LENGTH) }));

  readonly setGender = (gender: Gender): void => this.update((s) => ({ ...s, gender }));

  // region Build

  private build(): void {
    if (this.job !== null) return;
    const birth = this.current.review;
    if (birth === null) return;
    this.update((s) => ({ ...s, step: OnboardingStep.Building, build: EMPTY_BUILD }));
    this.track(this.runBuild(birth));
  }

  private async runBuild(birth: ResolvedBirth): Promise<void> {
    const summary = {
      birth,
      pillars: birth.pillars(),
      lifePalace: birth.ziWei()?.lifePalace ?? null,
      sunLongitude: birth.sunLongitude(),
    };
    this.update((s) => ({ ...s, build: { ...s.build, summary } }));
    for (const task of BUILD_TASKS) {
      await this.wait(TASK_MILLIS);
      if (this.disposed) return;
      this.update((s) => ({ ...s, build: { ...s.build, completedTasks: task + 1 } }));
    }
    await this.save(birth.profile);
  }

  /** Tries the final save again after a storage error. */
  readonly retrySave = (): void => {
    const state = this.current;
    const profile = state.review?.profile;
    if (profile === undefined || !state.build.saveFailed || this.job !== null) return;
    this.update((s) => ({ ...s, build: { ...s.build, saveFailed: false } }));
    this.track(this.save(profile));
  };

  private async save(profile: BirthProfile): Promise<void> {
    const { personalizedTips, analytics } = this.current;
    try {
      await this.options.profile.savePrimary(profile);
      // A correction leaves the consents given at first launch (and changed in Privacy since) alone.
      if (!this.isEditing) {
        await this.options.settings.setConsents(personalizedTips, analytics);
        await this.options.settings.setOnboardingCompleted(true);
      }
      this.update((s) => ({ ...s, isFinished: true }));
    } catch {
      // Storage failed (full disk, unwritable store): the building screen shows it and offers a retry.
      this.update((s) => ({ ...s, build: { ...s.build, saveFailed: true } }));
    }
  }

  private track(job: Promise<void>): void {
    const tracked = job.finally(() => {
      if (this.job === tracked) this.job = null;
    });
    this.job = tracked;
  }

  // endregion

  private startPrefill(): void {
    const known = this.options.profile.current();
    if (known !== undefined) {
      if (known !== null) this.prefill(known);
      return;
    }
    // Any change since (a wheel turned, a step taken) means the user is already typing: leave it alone.
    const untouched = this.current;
    this.track(
      this.options.profile
        .load()
        .then((profile) => {
          if (profile !== null && this.current === untouched) this.prefill(profile);
        })
        .catch(() => {
          // Storage could not be read: the editor simply opens empty, as for a first entry.
        }),
    );
  }

  /** Puts the saved profile back on the wheels and fields, in the calendar it was entered in. */
  private prefill(profile: BirthProfile): void {
    const input = entryOf(profile);
    this.update((state) => ({
      ...this.withDate(state, input),
      clock: profile.clock ?? state.clock,
      isTimeUnknown: profile.clock === null,
      place: profile.place,
      name: profile.name,
      gender: profile.gender,
    }));
  }

  private withDate(state: OnboardingUiState, input: DateInput): OnboardingUiState {
    const normalized = this.dates.normalize(input);
    return {
      ...state,
      date: normalized,
      dateCheck: this.dates.check(normalized),
      daysInMonth: this.dates.daysIn(normalized),
    };
  }

  private update(change: (state: OnboardingUiState) => OnboardingUiState): void {
    const next = change(this.current);
    if (next === this.current) return;
    this.current = next;
    for (const listener of [...this.listeners]) listener();
  }
}
