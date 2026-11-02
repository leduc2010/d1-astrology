import { MutableState, type ObservableRepository, type ReadonlyState } from '@/core/data';
import { WeekStart, type UserSettings } from '@/core/model';
import { CALENDAR_OFFSET, type CivilDate, type DayAlmanac, notableDays } from '@/engine';
import { localDate, MonthIndex, monthPage, type MonthPage } from './calendarMonth';

/** Months loaded on each side of the one shown, and how far away a loaded month is kept. */
const PRELOAD = 1;
const KEEP = 2;

/** How far ahead the "coming up" list looks. */
const UPCOMING_DAYS = 60;

/**
 * Month grids by pager index. A plain record rather than a Map so the state's structural
 * equality check sees the pages.
 */
export type MonthPages = Readonly<Record<number, MonthPage>>;

export type CalendarUiState = {
  readonly today: CivilDate;
  readonly todayIndex: number;
  /** Only the neighbourhood of the visible month is held. */
  readonly pages: MonthPages;
  /** Festivals and solar terms from today on. */
  readonly upcoming: readonly DayAlmanac[];
  readonly weekStart: WeekStart;
  readonly showLunar: boolean;
};

/** The pager indexes that have a grid loaded, in order. */
export const pageIndexes = (pages: MonthPages): number[] =>
  Object.keys(pages)
    .map(Number)
    .sort((a, b) => a - b);

/**
 * The month pager with its legend settings and the "coming up" list (Kotlin `CalendarViewModel`).
 * Grids are built on the JS thread when [start] runs and as the pager moves, rather than on a
 * background dispatcher; the screen draws an empty grid of the same height until they arrive.
 */
export class CalendarModel {
  private readonly mutable: MutableState<CalendarUiState>;
  private readonly today: CivilDate;
  private shown: number;

  constructor(
    private readonly settings: ObservableRepository<UserSettings>,
    now: () => Date,
    private readonly offset: number = CALENDAR_OFFSET,
  ) {
    this.today = localDate(now());
    const todayIndex = MonthIndex.of(this.today.year, this.today.month);
    this.shown = todayIndex;
    this.mutable = new MutableState<CalendarUiState>(
      Object.freeze({
        today: this.today,
        todayIndex,
        pages: Object.freeze({}),
        upcoming: Object.freeze([]),
        weekStart: WeekStart.MONDAY,
        showLunar: true,
      }),
    );
  }

  get state(): ReadonlyState<CalendarUiState> {
    return this.mutable;
  }

  /** Loads the grids around the shown month and follows the settings; returns the stop function. */
  start(): () => void {
    const stop = this.settings.subscribe((settings) => this.onSettings(settings));
    // load() never rejects and resolves at once when the settings are already held.
    void this.settings.load();
    const settings = this.settings.current();
    if (settings) this.onSettings(settings);
    else this.onMonthShown(this.shown);
    this.update({ upcoming: Object.freeze(notableDays(this.today, UPCOMING_DAYS, this.offset)) });
    return stop;
  }

  onMonthShown(index: number): void {
    this.shown = index;
    const state = this.mutable.current();
    const kept: Record<number, MonthPage> = {};
    for (const key of pageIndexes(state.pages)) {
      if (Math.abs(key - index) <= KEEP) kept[key] = state.pages[key]!;
    }
    for (let i = index - PRELOAD; i <= index + PRELOAD; i++) {
      if (i >= 0 && i < MonthIndex.COUNT && kept[i] === undefined) {
        kept[i] = monthPage(i, this.today, this.offset, state.weekStart);
      }
    }
    this.update({ pages: Object.freeze(kept) });
  }

  private onSettings(settings: UserSettings): void {
    const state = this.mutable.current();
    // Only the labels change, so the loaded grids stay.
    if (settings.showLunarInCalendar !== state.showLunar) this.update({ showLunar: settings.showLunarInCalendar });
    // A week-start change redraws the grids around the shown month; the same value only fills gaps.
    if (settings.weekStart !== state.weekStart) this.update({ weekStart: settings.weekStart, pages: Object.freeze({}) });
    this.onMonthShown(this.shown);
  }

  private update(change: Partial<CalendarUiState>): void {
    this.mutable.update((state) => Object.freeze({ ...state, ...change }));
  }
}
