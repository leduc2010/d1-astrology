import { isSouthVietnam, PlaceCatalog, searchPlaces, type PartnerRepository } from '@/core/data';
import {
  birthClock,
  type BirthClock,
  type BirthPlace,
  type BirthProfile,
  type Gender,
  type Relationship,
} from '@/core/model';
import { BirthDates, CalendarMode, dateInput, type DateCheck, type DateInput } from '@/core/ui';
import { vietnamToSolar } from '@/engine';

const NOON = 12;
const SUGGESTED_PLACES = 6;
const MAX_NAME_LENGTH = 40;

export interface AddPartnerState {
  readonly name: string;
  readonly date: DateInput;
  readonly dateCheck: DateCheck | null;
  /** The year wheel's range: [BirthDates.firstYear] to this year. */
  readonly firstYear: number;
  readonly lastYear: number;
  readonly daysInMonth: number;
  readonly clock: BirthClock;
  readonly isTimeUnknown: boolean;
  readonly placeQuery: string;
  readonly placeResults: readonly BirthPlace[];
  readonly place: BirthPlace | null;
  readonly gender: Gender | null;
  readonly relationship: Relationship | null;
  /** The owner confirms the other person agreed to have their birth data stored here. */
  readonly hasConsent: boolean;
  readonly isSaving: boolean;
  readonly saveFailed: boolean;
  /** Set once the person is stored; the screen then opens their match page. */
  readonly savedId: number | null;
}

export const canSave = (s: AddPartnerState): boolean =>
  s.name.trim() !== '' &&
  s.dateCheck?.isFuture === false &&
  s.place !== null &&
  s.gender !== null &&
  s.relationship !== null &&
  s.hasConsent &&
  !s.isSaving &&
  s.savedId === null;

export type AddPartnerAction =
  | { readonly type: 'name'; readonly name: string }
  | { readonly type: 'calendarMode'; readonly mode: CalendarMode }
  | { readonly type: 'year'; readonly year: number }
  | { readonly type: 'month'; readonly month: number }
  | { readonly type: 'day'; readonly day: number }
  | { readonly type: 'leapMonth'; readonly isLeap: boolean }
  | { readonly type: 'hour'; readonly hour: number }
  | { readonly type: 'minute'; readonly minute: number }
  | { readonly type: 'timeUnknown'; readonly unknown: boolean }
  | { readonly type: 'placeQuery'; readonly query: string }
  | { readonly type: 'place'; readonly place: BirthPlace }
  | { readonly type: 'gender'; readonly gender: Gender }
  | { readonly type: 'relationship'; readonly relationship: Relationship }
  | { readonly type: 'consent'; readonly given: boolean }
  | { readonly type: 'saveStarted' }
  | { readonly type: 'saved'; readonly id: number }
  | { readonly type: 'saveFailed' };

function withDate(dates: BirthDates, state: AddPartnerState, input: DateInput): AddPartnerState {
  const normalized = dates.normalize(input);
  return { ...state, date: normalized, dateCheck: dates.check(normalized), daysInMonth: dates.daysIn(normalized) };
}

/** S07-02's empty form: today bounds the year wheel and flags a future birthday. */
export function initialAddPartnerState(dates: BirthDates): AddPartnerState {
  const blank: AddPartnerState = {
    name: '',
    date: dateInput(),
    dateCheck: null,
    firstYear: dates.firstYear,
    lastYear: dates.lastYear,
    daysInMonth: 31,
    clock: birthClock(NOON, 0),
    isTimeUnknown: true,
    placeQuery: '',
    placeResults: PlaceCatalog.places.slice(0, SUGGESTED_PLACES),
    place: null,
    gender: null,
    relationship: null,
    hasConsent: false,
    isSaving: false,
    saveFailed: false,
    savedId: null,
  };
  return Object.freeze(withDate(dates, blank, dateInput()));
}

function reduce(dates: BirthDates, s: AddPartnerState, a: AddPartnerAction): AddPartnerState {
  switch (a.type) {
    case 'name':
      return { ...s, name: a.name.slice(0, MAX_NAME_LENGTH) };
    case 'calendarMode':
      return withDate(dates, s, dates.switchMode(s.date, a.mode));
    case 'year':
      return withDate(dates, s, { ...s.date, year: a.year });
    case 'month':
      return withDate(dates, s, { ...s.date, month: a.month });
    case 'day':
      return withDate(dates, s, { ...s.date, day: a.day });
    case 'leapMonth':
      return withDate(dates, s, { ...s.date, isLeapMonth: a.isLeap });
    case 'hour':
      return { ...s, clock: birthClock(a.hour, s.clock.minute) };
    case 'minute':
      return { ...s, clock: birthClock(s.clock.hour, a.minute) };
    case 'timeUnknown':
      return { ...s, isTimeUnknown: a.unknown };
    case 'placeQuery':
      return { ...s, placeQuery: a.query, placeResults: searchPlaces(a.query) };
    case 'place':
      return { ...s, place: a.place };
    case 'gender':
      return { ...s, gender: a.gender };
    case 'relationship':
      return { ...s, relationship: a.relationship };
    case 'consent':
      return { ...s, hasConsent: a.given };
    case 'saveStarted':
      return { ...s, isSaving: true, saveFailed: false };
    case 'saved':
      return { ...s, isSaving: false, savedId: a.id };
    case 'saveFailed':
      return { ...s, isSaving: false, saveFailed: true };
  }
}

/** The form's reducer for one [dates] (one "today"). Every state it returns is frozen. */
export const addPartnerReducer =
  (dates: BirthDates) =>
  (state: AddPartnerState, action: AddPartnerAction): AddPartnerState =>
    Object.freeze(reduce(dates, state, action));

/** The person as they will be stored, or null while the form is incomplete. */
export function profileOf(s: AddPartnerState): BirthProfile | null {
  const check = s.dateCheck;
  const name = s.name.trim();
  if (check === null || name === '' || s.gender === null || s.place === null) return null;
  const isLunar = s.date.mode === CalendarMode.Lunar;
  // As in onboarding: the wheels read a lunar date in the Northern calendar, but a Southern birth
  // before 1976 used Beijing time, so the same lunar date can fall a day apart there.
  const solar = isLunar ? (vietnamToSolar(check.lunar, isSouthVietnam(s.place)) ?? check.solar) : check.solar;
  return Object.freeze({
    name,
    gender: s.gender,
    date: Object.freeze({ year: solar.year, month: solar.month, day: solar.day }),
    clock: s.isTimeUnknown ? null : s.clock,
    place: s.place,
    enteredAsLunar: isLunar,
  });
}

/**
 * Stores the person when the form allows it, reporting progress through [dispatch]. A failed
 * write keeps the form as it was and shows a notice.
 */
export async function savePartner(
  state: AddPartnerState,
  dispatch: (action: AddPartnerAction) => void,
  partners: Pick<PartnerRepository, 'add'>,
  addedOnEpochDay: number,
): Promise<void> {
  if (!canSave(state)) return;
  const profile = profileOf(state);
  const relationship = state.relationship;
  if (profile === null || relationship === null) return;
  dispatch({ type: 'saveStarted' });
  try {
    const id = await partners.add(profile, relationship, addedOnEpochDay);
    dispatch({ type: 'saved', id });
  } catch {
    dispatch({ type: 'saveFailed' });
  }
}
