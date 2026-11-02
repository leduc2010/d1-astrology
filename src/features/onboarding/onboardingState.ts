import type { BirthPillars, ResolvedBirth } from '@/core/data';
import { type BirthClock, type BirthPlace, birthClock, type Gender } from '@/core/model';
import { type DateCheck, type DateInput, dateInput } from '@/core/ui';
import type { StemBranch } from '@/engine';

/** Screens of the first-launch flow, in order. Four of them are numbered input steps. */
export enum OnboardingStep {
  Welcome,
  Consent,
  Date,
  Time,
  Place,
  Name,
  Review,
  Building,
}

export const INPUT_STEPS = 4;

const STEP_NUMBERS: Partial<Record<OnboardingStep, number>> = {
  [OnboardingStep.Date]: 1,
  [OnboardingStep.Time]: 2,
  [OnboardingStep.Place]: 3,
  [OnboardingStep.Name]: 4,
};

/** The numbered input step ("Step 2/4"), or null for the screens around them. */
export const stepNumber = (step: OnboardingStep): number | null => STEP_NUMBERS[step] ?? null;

/** The four calculations shown on the building screen, in the order they finish. */
export enum BuildTask {
  Lunar,
  Pillars,
  ZiWei,
  Planets,
}

export const BUILD_TASKS: readonly BuildTask[] = [BuildTask.Lunar, BuildTask.Pillars, BuildTask.ZiWei, BuildTask.Planets];

/** What the chart calculations found; shown as each task finishes. */
export interface ChartSummary {
  readonly birth: ResolvedBirth;
  readonly pillars: BirthPillars;
  /** Life palace of the Tử Vi chart; null without a birth time. */
  readonly lifePalace: StemBranch | null;
  readonly sunLongitude: number;
}

export interface BuildState {
  readonly summary: ChartSummary | null;
  readonly completedTasks: number;
  readonly saveFailed: boolean;
}

export const EMPTY_BUILD: BuildState = Object.freeze({ summary: null, completedTasks: 0, saveFailed: false });

export const buildProgress = (build: BuildState): number => build.completedTasks / BUILD_TASKS.length;

export interface OnboardingUiState {
  readonly step: OnboardingStep;
  /** The owner correcting saved details rather than a first launch. */
  readonly isEditing: boolean;
  readonly personalizedTips: boolean;
  readonly analytics: boolean;
  readonly date: DateInput;
  readonly dateCheck: DateCheck | null;
  readonly years: readonly number[];
  readonly daysInMonth: number;
  readonly clock: BirthClock;
  readonly isTimeUnknown: boolean;
  readonly placeQuery: string;
  readonly placeResults: readonly BirthPlace[];
  readonly place: BirthPlace | null;
  readonly name: string;
  readonly gender: Gender | null;
  /** The profile as it will be saved, worked out when the review step opens. */
  readonly review: ResolvedBirth | null;
  readonly build: BuildState;
  readonly isFinished: boolean;
}

const NOON = 12;
const DAYS_IN_LONG_MONTH = 31;

export function onboardingUiState(fields: Partial<OnboardingUiState> = {}): OnboardingUiState {
  return {
    step: OnboardingStep.Welcome,
    isEditing: false,
    personalizedTips: false,
    analytics: false,
    date: dateInput(),
    dateCheck: null,
    years: [],
    daysInMonth: DAYS_IN_LONG_MONTH,
    clock: birthClock(NOON, 0),
    isTimeUnknown: false,
    placeQuery: '',
    placeResults: [],
    place: null,
    name: '',
    gender: null,
    review: null,
    build: EMPTY_BUILD,
    isFinished: false,
    ...fields,
  };
}

/** Where back stops: the welcome screen on first launch, the date when editing. */
export const firstStep = (state: OnboardingUiState): OnboardingStep =>
  state.isEditing ? OnboardingStep.Date : OnboardingStep.Welcome;

export function canContinue(state: OnboardingUiState): boolean {
  switch (state.step) {
    case OnboardingStep.Date:
      return state.dateCheck?.isFuture === false;
    case OnboardingStep.Place:
      return state.place !== null;
    case OnboardingStep.Name:
      return state.name.trim() !== '' && state.gender !== null;
    case OnboardingStep.Review:
      return state.review !== null;
    default:
      return true;
  }
}
