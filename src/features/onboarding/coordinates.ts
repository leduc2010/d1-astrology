import { parseOffsetSeconds, zoneForCoordinates } from '@/core/data';
import type { BirthPlace } from '@/core/model';

export const MAX_LATITUDE = 90;
export const MAX_LONGITUDE = 180;

/** What Kotlin's `toDoubleOrNull` reads as a finite decimal (no hex, no blank, no "NaN"). */
const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

/** Decimal degrees, comma or dot; null when it is not a number in range. */
export function parseCoordinate(text: string, limit: number): number | null {
  const normalized = text.trim().replace(/,/g, '.');
  if (!DECIMAL.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= -limit && value <= limit ? value : null;
}

const OFFSET_PATTERN = /^([+\-−]?)\s*(\d{1,2})(?::(\d{2}))?$/;
const QUARTER_HOUR = 15;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MIN_OFFSET_MINUTES = -12 * MINUTES_PER_HOUR;
const MAX_OFFSET_MINUTES = 14 * MINUTES_PER_HOUR;

const removePrefix = (text: string, prefix: string): string => (text.startsWith(prefix) ? text.slice(prefix.length) : text);

/**
 * UTC offset typed by hand, in minutes east of UTC: "+7", "-3", "+5:30", "UTC+05:45". Null when blank
 * or invalid; minutes must be a quarter hour and the offset within −12:00…+14:00.
 */
export function parseUtcOffset(text: string): number | null {
  const bare = removePrefix(removePrefix(text.trim().toUpperCase(), 'UTC'), 'GMT').trim();
  const match = OFFSET_PATTERN.exec(bare);
  if (match === null) return null;
  const [, sign, hourText, minuteText] = match;
  const hours = Number(hourText);
  const minutes = Number(minuteText ?? '0');
  if (minutes % QUARTER_HOUR !== 0 || minutes >= MINUTES_PER_HOUR) return null;
  const total = (hours * MINUTES_PER_HOUR + minutes) * (sign === '-' || sign === '−' ? -1 : 1);
  return total >= MIN_OFFSET_MINUTES && total <= MAX_OFFSET_MINUTES ? total + 0 : null;
}

const twoDigits = (value: number): string => String(value).padStart(2, '0');

/**
 * The offset the user typed for [place] earlier ("+08:00"), so reopening the sheet keeps it; blank for a
 * listed place or when the zone is just the one guessed from the coordinates.
 */
export function typedOffsetText(place: BirthPlace | null): string {
  if (place === null || place.zoneId === zoneForCoordinates(place.latitude, place.longitude)) return '';
  let seconds: number;
  try {
    seconds = parseOffsetSeconds(place.zoneId);
  } catch {
    return '';
  }
  const minutes = Math.trunc(Math.abs(seconds) / SECONDS_PER_MINUTE);
  const sign = seconds < 0 ? '-' : '+';
  return `${sign}${twoDigits(Math.trunc(minutes / MINUTES_PER_HOUR))}:${twoDigits(minutes % MINUTES_PER_HOUR)}`;
}
