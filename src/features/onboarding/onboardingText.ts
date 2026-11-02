import { utcOffsetMinutes } from '@/core/data';
import { type BirthPlace, Gender } from '@/core/model';
import { placeName, type UiText } from '@/core/ui';
import type { CivilDate } from '@/engine';

/* Display text shared by the onboarding steps. Numbers follow the current language's digits. */

const MINUTES_PER_HOUR = 60;
const COORDINATE_DIGITS = 2;
const DEFAULT_YEAR = 2000;

/** "+7", "+5:30", "−3" — the part after "UTC". */
export function utcOffsetText(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? '−' : '+';
  const hours = Math.trunc(Math.abs(offsetMinutes) / MINUTES_PER_HOUR);
  const minutes = Math.abs(offsetMinutes) % MINUTES_PER_HOUR;
  return minutes === 0 ? `${sign}${hours}` : `${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

/** "20,97°B, 105,78°Đ" in Vietnamese, "20.97°N, 105.78°E" in English. */
export function coordinatesText(t: UiText, latitude: number, longitude: number): string {
  const format = new Intl.NumberFormat(t.language, {
    minimumFractionDigits: COORDINATE_DIGITS,
    maximumFractionDigits: COORDINATE_DIGITS,
    useGrouping: false,
  });
  const lat = format.format(Math.abs(latitude));
  const lon = format.format(Math.abs(longitude));
  return t.tf(
    'onboarding_coordinates',
    t.tf(latitude >= 0 ? 'onboarding_coord_north' : 'onboarding_coord_south', lat),
    t.tf(longitude >= 0 ? 'onboarding_coord_east' : 'onboarding_coord_west', lon),
  );
}

/** "Hà Đông, Hà Nội", or the localized coordinates for a place typed by hand (no region). */
export const placeTitle = (t: UiText, place: BirthPlace): string =>
  place.region.trim() === '' ? coordinatesText(t, place.latitude, place.longitude) : placeName(t, place);

/** "UTC+7 · 20,97°B, 105,78°Đ" — the offset in force on the birth date at that place. */
export function placeDetail(t: UiText, place: BirthPlace, date: CivilDate | null | undefined): string {
  const birthDate = date ? { year: date.year, month: date.month, day: date.day } : { year: DEFAULT_YEAR, month: 1, day: 1 };
  const offset = utcOffsetMinutes(place.zoneId, place.latitude, place.longitude, birthDate, null);
  return t.tf(
    'onboarding_place_detail',
    t.tf('onboarding_utc_offset', utcOffsetText(offset)),
    coordinatesText(t, place.latitude, place.longitude),
  );
}

export const genderText = (t: UiText, gender: Gender): string =>
  t.tf(gender === Gender.MALE ? 'onboarding_gender_male' : 'onboarding_gender_female');
