import { MutableState, type ReadonlyState } from '@/core/data';
import {
  almanacDay,
  type Branch,
  CALENDAR_OFFSET,
  type CivilDate,
  type DayAlmanac,
  hourBranch,
  plusDays,
  sameDate,
  type StemBranch,
  termStart,
  yearPillar,
} from '@/engine';
import { localDate, MonthIndex } from './calendarMonth';

export type DayUiState = {
  readonly day: DayAlmanac;
  readonly yearPillar: StemBranch;
  /** Date the current solar term began. */
  readonly termStart: CivilDate;
  readonly isToday: boolean;
  /** The double hour the clock is in, shown only when the page is today. */
  readonly nowHour: Branch | null;
  readonly hasPrevious: boolean;
  readonly hasNext: boolean;
};

/** One day in full; the arrows step a day at a time within the supported years (Kotlin `DayViewModel`). */
export class DayModel {
  private readonly mutable: MutableState<DayUiState>;
  private readonly today: CivilDate;
  private readonly hour: Branch;

  /** [start] outside the supported years, or null for an unreadable link, opens today. */
  constructor(
    start: CivilDate | null,
    now: () => Date,
    private readonly offset: number = CALENDAR_OFFSET,
  ) {
    const moment = now();
    this.today = localDate(moment);
    this.hour = hourBranch(moment.getHours());
    this.mutable = new MutableState(this.stateFor(start && MonthIndex.contains(start) ? start : this.today));
  }

  get state(): ReadonlyState<DayUiState> {
    return this.mutable;
  }

  onShift(days: number): void {
    const target = plusDays(this.mutable.current().day.date, days);
    if (MonthIndex.contains(target)) this.mutable.set(this.stateFor(target));
  }

  private stateFor(date: CivilDate): DayUiState {
    const day = almanacDay(date, this.offset);
    const isToday = sameDate(date, this.today);
    return Object.freeze({
      day,
      yearPillar: yearPillar(day.lunar.year),
      termStart: termStart(date, this.offset),
      isToday,
      nowHour: isToday ? this.hour : null,
      hasPrevious: MonthIndex.contains(plusDays(date, -1)),
      hasNext: MonthIndex.contains(plusDays(date, 1)),
    });
  }
}
