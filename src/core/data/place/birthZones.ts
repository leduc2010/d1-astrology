import { isValidCivilDate } from '../../../engine/time/civilDate';
import { PARTITION_LATITUDE, vietnamOffsetMinutes } from '../../../engine/time/vietnamTimeZone';
import type { BirthClock, BirthDate, BirthPlace } from '../../model';
import { offsetId, offsetSecondsAt, ZoneError } from './zoneOffset';

/** Zone id used for every place in Vietnam; the North/South history is applied by latitude. */
export const VIETNAM_ZONE = 'Asia/Ho_Chi_Minh';

const NOON = 12;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const DEGREES_PER_HOUR = 15.0;
const MIN_OFFSET_HOURS = -12;
const MAX_OFFSET_HOURS = 14;
const VN_MIN_LATITUDE = 8.0;
const VN_MAX_LATITUDE = 23.5;
const VN_MIN_LONGITUDE = 102.0;
const VN_MAX_LONGITUDE = 110.0;
const CHINA_CORNER_LATITUDE = 18.0;
const CHINA_CORNER_LONGITUDE = 108.0;

function meridianOffsetMinutes(longitude: number): number {
  const hours = Math.min(Math.max(Math.round(longitude / DEGREES_PER_HOUR), MIN_OFFSET_HOURS), MAX_OFFSET_HOURS);
  // `+ 0` turns the -0 of a small negative longitude into 0.
  return hours * MINUTES_PER_HOUR + 0;
}

/** A rough box around Vietnam, minus its north-east corner, which is Guangxi and Hainan (UTC+8). */
export function isInVietnam(latitude: number, longitude: number): boolean {
  return (
    latitude >= VN_MIN_LATITUDE &&
    latitude <= VN_MAX_LATITUDE &&
    longitude >= VN_MIN_LONGITUDE &&
    longitude <= VN_MAX_LONGITUDE &&
    !(latitude > CHINA_CORNER_LATITUDE && longitude > CHINA_CORNER_LONGITUDE)
  );
}

/**
 * Civil offset in minutes east of UTC in force at a birth. An unknown [clock] is read at noon, away
 * from DST switches. A zone that cannot be resolved (or an impossible date) falls back to the
 * nominal meridian offset of [longitude].
 */
export function utcOffsetMinutes(
  zoneId: string,
  latitude: number,
  longitude: number,
  date: BirthDate,
  clock: BirthClock | null,
): number {
  if (zoneId === VIETNAM_ZONE) return vietnamOffsetMinutes(date, latitude);
  if (!isValidCivilDate(date.year, date.month, date.day)) return meridianOffsetMinutes(longitude);
  try {
    const seconds = offsetSecondsAt(zoneId, {
      year: date.year,
      month: date.month,
      day: date.day,
      hour: clock?.hour ?? NOON,
      minute: clock?.minute ?? 0,
      second: 0,
    });
    // Truncates toward zero like Kotlin's Int division (LMT offsets carry seconds).
    return Math.trunc(seconds / SECONDS_PER_MINUTE) + 0;
  } catch (e) {
    if (e instanceof ZoneError || e instanceof RangeError) return meridianOffsetMinutes(longitude);
    throw e;
  }
}

/** A fixed-offset zone id ("+05:30", or "Z" for UTC) for an offset the user typed. */
export function fixedOffsetZone(offsetMinutes: number): string {
  try {
    return offsetId(offsetMinutes * SECONDS_PER_MINUTE + 0);
  } catch (e) {
    throw e instanceof ZoneError ? new RangeError(e.message) : e;
  }
}

/** Zone for coordinates typed by hand: Vietnam's own zone inside its bounds, else the nominal meridian offset. */
export function zoneForCoordinates(latitude: number, longitude: number): string {
  return isInVietnam(latitude, longitude) ? VIETNAM_ZONE : fixedOffsetZone(meridianOffsetMinutes(longitude));
}

/**
 * In the former South (below the 17th parallel), whose lunar calendar kept Beijing time until 1976.
 * Judged by position, so coordinates typed with a fixed offset such as "+08:00" still count.
 */
export function isSouthVietnam(place: BirthPlace): boolean {
  return (
    place.latitude < PARTITION_LATITUDE &&
    (place.zoneId === VIETNAM_ZONE || isInVietnam(place.latitude, place.longitude))
  );
}

/** Same functions grouped like the Kotlin `BirthZones` object. */
export const BirthZones = Object.freeze({
  VIETNAM: VIETNAM_ZONE,
  utcOffsetMinutes,
  zoneForCoordinates,
  isSouthVietnam,
  fixedOffsetZone,
  isInVietnam,
});
