import { birthStrength, deepEqual, MutableState, resolveBirth, type ObservableRepository, type ReadonlyState } from '@/core/data';
import { Gender, type BirthProfile } from '@/core/model';
import {
  almanacDay,
  type Branch,
  CALENDAR_OFFSET,
  civilDate,
  type CivilDate,
  type DayAlmanac,
  type DayMasterStrength,
  type Direction,
  type Element,
  generatedBy,
  generates,
  hourBranch,
  joyDirection,
  type Stem,
  stemElement,
  type TenGod,
  tenGodOf,
  yearOutlook,
  type YearOutlook,
} from '@/engine';

export type TodayUiState = {
  readonly day: DayAlmanac;
  /** The double hour the clock is in now. */
  readonly nowHour: Branch;
  /** Direction of the Joy spirit (Hỷ thần) for the day stem. */
  readonly goodDirection: Direction;
  /** Readings tied to the owner's chart; null until the profile has loaded. */
  readonly personal: PersonalDay | null;
};

export type PersonalDay = {
  readonly name: string;
  /** How today's stem relates to the owner's day master. */
  readonly tenGod: TenGod;
  /** The owner's own element, the one that feeds it and the one it feeds. */
  readonly luckyElements: readonly Element[];
  /** The current lunar year read against the owner's birth year and chart; null before the birth year. */
  readonly year: YearOutlook | null;
};

/** The parts of "now" the screen depends on; ticks that leave it unchanged are dropped. */
export type Moment = { readonly date: CivilDate; readonly hour: Branch };

/** The device-local date and double hour of [now] (Kotlin `ZonedDateTime.toMoment()`). */
export const momentOf = (now: Date): Moment => ({
  date: civilDate(now.getFullYear(), now.getMonth() + 1, now.getDate()),
  hour: hourBranch(now.getHours()),
});

/** What the Today screen needs from the owner's chart: day stem, its strength and the birth year. */
export type Natal = {
  readonly name: string;
  readonly dayMaster: Stem;
  readonly strength: DayMasterStrength;
  /** Lunar year of birth, which folk customs count age and Thái Tuế from. */
  readonly birthLunarYear: number;
  readonly isMale: boolean;
};

export function natalOf(profile: BirthProfile): Natal {
  const birth = resolveBirth(profile);
  return {
    name: profile.name,
    dayMaster: birth.pillars().day.stem,
    strength: birthStrength(birth),
    birthLunarYear: birth.lunarDate.year,
    isMale: profile.gender === Gender.MALE,
  };
}

export function todayState(moment: Moment, natal: Natal | null): TodayUiState {
  const day = almanacDay(moment.date, CALENDAR_OFFSET);
  return Object.freeze({
    day,
    nowHour: moment.hour,
    goodDirection: joyDirection(day.dayPillar.stem),
    personal: natal ? personalDay(natal, day) : null,
  });
}

function personalDay(natal: Natal, day: DayAlmanac): PersonalDay {
  const own = stemElement(natal.dayMaster);
  return Object.freeze({
    name: natal.name,
    tenGod: tenGodOf(natal.dayMaster, day.dayPillar.stem),
    luckyElements: Object.freeze([own, generatedBy(own), generates(own)]),
    // A clock set before the birth year would give folk age 0 or less: leave the year out.
    year:
      day.lunar.year < natal.birthLunarYear
        ? null
        : yearOutlook(day.lunar.year, natal.birthLunarYear, natal.isMale, natal.dayMaster, natal.strength),
  });
}

/** Calls the listener with the time now and then on every tick; returns the stop function. */
export type Ticks = (listener: (now: Date) => void) => () => void;

/**
 * Today's almanac plus the owner's personal reading (Kotlin `TodayViewModel`). Recomputed when
 * the date or double hour changes (checked on every tick) or when the profile changes.
 */
export class TodayModel {
  private readonly mutable: MutableState<TodayUiState>;
  private moment: Moment;
  private natal: Natal | null = null;

  constructor(
    private readonly profiles: ObservableRepository<BirthProfile | null>,
    now: () => Date,
    private readonly ticks: Ticks,
  ) {
    this.moment = momentOf(now());
    this.mutable = new MutableState(todayState(this.moment, null));
  }

  get state(): ReadonlyState<TodayUiState> {
    return this.mutable;
  }

  /** Starts following the clock and the profile; returns the function that stops both. */
  start(): () => void {
    this.onProfile(this.profiles.current());
    const stopProfile = this.profiles.subscribe((profile) => this.onProfile(profile));
    // load() never rejects and resolves at once when the profile is already held.
    void this.profiles.load();
    const stopTicks = this.ticks((now) => this.onMoment(momentOf(now)));
    return () => {
      stopTicks();
      stopProfile();
    };
  }

  private onMoment(moment: Moment): void {
    if (deepEqual(moment, this.moment)) return;
    this.moment = moment;
    this.publish();
  }

  private onProfile(profile: BirthProfile | null | undefined): void {
    const natal = profile ? natalOf(profile) : null;
    if (deepEqual(natal, this.natal)) return;
    this.natal = natal;
    this.publish();
  }

  private publish(): void {
    this.mutable.set(todayState(this.moment, this.natal));
  }
}
