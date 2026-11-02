import { isSouthVietnam, resolveBirth, type ResolvedBirth } from '@/core/data';
import type { BirthProfile } from '@/core/model';
import { CalendarMode, type DateInput, dateInput } from '@/core/ui';
import { civilDate, vietnamToLunar, vietnamToSolar } from '@/engine';

import type { OnboardingUiState } from './onboardingState';

/* Conversions between the onboarding answers and the saved profile. */

/** The saved date back on the wheels, in the calendar it was entered in (and of the birth place). */
export function entryOf(profile: BirthProfile): DateInput {
  const { date } = profile;
  if (!profile.enteredAsLunar) {
    return dateInput({ mode: CalendarMode.Solar, year: date.year, month: date.month, day: date.day });
  }
  const lunar = vietnamToLunar(civilDate(date.year, date.month, date.day), isSouthVietnam(profile.place));
  return dateInput({
    mode: CalendarMode.Lunar,
    year: lunar.year,
    month: lunar.month,
    day: lunar.day,
    isLeapMonth: lunar.isLeapMonth,
  });
}

/** The profile as it will be saved, or null while a field is missing. */
export function toProfile(state: OnboardingUiState): BirthProfile | null {
  const check = state.dateCheck;
  const place = state.place;
  if (check === null || place === null) return null;
  const isLunar = state.date.mode === CalendarMode.Lunar;
  // The wheels read a lunar date in the Northern calendar; a Southern birth before 1976 used
  // Beijing time, so the same lunar date can fall a day apart there.
  const solar = isLunar ? (vietnamToSolar(check.lunar, isSouthVietnam(place)) ?? check.solar) : check.solar;
  const name = state.name.trim();
  if (name === '' || state.gender === null) return null;
  return {
    name,
    gender: state.gender,
    date: { year: solar.year, month: solar.month, day: solar.day },
    clock: state.isTimeUnknown ? null : state.clock,
    place,
    enteredAsLunar: isLunar,
  };
}

export const resolveProfile = (state: OnboardingUiState): ResolvedBirth | null => {
  const profile = toProfile(state);
  return profile === null ? null : resolveBirth(profile);
};

/** "20.97°N, 105.78°E" — the name of a place entered as coordinates. */
export function coordinateText(latitude: number, longitude: number): string {
  const ns = latitude >= 0 ? 'N' : 'S';
  const ew = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(2)}°${ns}, ${Math.abs(longitude).toFixed(2)}°${ew}`;
}
