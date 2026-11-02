/**
 * Java-like zone handling without java.time: fixed offsets are parsed like `ZoneOffset.of`, region
 * ids are looked up through Intl, and a local date-time resolves to one offset the way
 * `ZoneRules.getOffset(LocalDateTime)` does (the earlier offset in an overlap, the one before a gap).
 * Every failure is a [ZoneError], the counterpart of Java's DateTimeException.
 */

export class ZoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZoneError';
  }
}

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const MAX_OFFSET_HOURS = 18;
const MAX_OFFSET_SECONDS = MAX_OFFSET_HOURS * SECONDS_PER_HOUR;
const MAX_MINUTE_OR_SECOND = 59;
const MS_PER_SECOND = 1_000;
const MS_PER_DAY = 86_400_000;
const UTC_PREFIXES: readonly string[] = ['UTC', 'GMT', 'UT'];
// Java's own pattern for region ids; anything else is rejected before a lookup.
const REGION_ID = /^[A-Za-z][A-Za-z0-9~/._+-]+$/;
const DIGITS = /^\d+$/;

/** A wall-clock time with no zone, like `LocalDateTime` (month 1..12). */
export interface LocalDateTime {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

/** Offset rules of a zone: seconds east of UTC at an instant (ms since the epoch). */
type ZoneRules = (epochMs: number) => number;

function twoDigits(text: string, from: number): number {
  const part = text.slice(from, from + 2);
  if (!DIGITS.test(part)) throw new ZoneError(`invalid offset: ${text}`);
  return Number(part);
}

function requireColon(text: string, at: number): void {
  if (text[at] !== ':') throw new ZoneError(`invalid offset: ${text}`);
}

/** `ZoneOffset.of`: "Z", ±h, ±hh, ±hh:mm, ±hhmm, ±hh:mm:ss or ±hhmmss, within ±18:00. Seconds east of UTC. */
export function parseOffsetSeconds(text: string): number {
  if (text === 'Z') return 0;
  const sign = text[0] === '+' ? 1 : text[0] === '-' ? -1 : 0;
  if (sign === 0) throw new ZoneError(`invalid offset: ${text}`);
  const id = text.length === 2 ? `${text[0]}0${text[1]}` : text;
  let hours: number;
  let minutes = 0;
  let seconds = 0;
  switch (id.length) {
    case 3:
      hours = twoDigits(id, 1);
      break;
    case 5:
      hours = twoDigits(id, 1);
      minutes = twoDigits(id, 3);
      break;
    case 6:
      hours = twoDigits(id, 1);
      requireColon(id, 3);
      minutes = twoDigits(id, 4);
      break;
    case 7:
      hours = twoDigits(id, 1);
      minutes = twoDigits(id, 3);
      seconds = twoDigits(id, 5);
      break;
    case 9:
      hours = twoDigits(id, 1);
      requireColon(id, 3);
      minutes = twoDigits(id, 4);
      requireColon(id, 6);
      seconds = twoDigits(id, 7);
      break;
    default:
      throw new ZoneError(`invalid offset: ${text}`);
  }
  if (hours > MAX_OFFSET_HOURS || minutes > MAX_MINUTE_OR_SECOND || seconds > MAX_MINUTE_OR_SECOND) {
    throw new ZoneError(`offset out of range: ${text}`);
  }
  const total = hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds;
  if (total > MAX_OFFSET_SECONDS) throw new ZoneError(`offset out of range: ${text}`);
  return sign * total;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** `ZoneOffset.ofTotalSeconds(...).id`: "Z" for zero, else "+hh:mm" (with ":ss" when needed). */
export function offsetId(totalSeconds: number): string {
  if (!Number.isInteger(totalSeconds) || Math.abs(totalSeconds) > MAX_OFFSET_SECONDS) {
    throw new ZoneError(`offset out of range: ${totalSeconds}`);
  }
  if (totalSeconds === 0) return 'Z';
  const abs = Math.abs(totalSeconds);
  const hours = Math.floor(abs / SECONDS_PER_HOUR);
  const minutes = Math.floor((abs % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = abs % SECONDS_PER_MINUTE;
  const base = `${totalSeconds < 0 ? '-' : '+'}${pad2(hours)}:${pad2(minutes)}`;
  return seconds === 0 ? base : `${base}:${pad2(seconds)}`;
}

/** Wall time read as if it were UTC; avoids Date.UTC's 0..99 → 19xx year mapping. */
function wallAsUtcMs(t: LocalDateTime): number {
  const date = new Date(0);
  date.setUTCFullYear(t.year, t.month - 1, t.day);
  date.setUTCHours(t.hour, t.minute, t.second, 0);
  return date.getTime();
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(zoneId: string): Intl.DateTimeFormat {
  const cached = formatters.get(zoneId);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: zoneId,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
  formatters.set(zoneId, formatter);
  return formatter;
}

function partNumber(parts: readonly Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = Number(parts.find((p) => p.type === type)?.value);
  if (!Number.isFinite(value)) throw new ZoneError(`no ${type} from Intl`);
  return value;
}

function intlRules(zoneId: string): ZoneRules {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = formatterFor(zoneId);
  } catch {
    throw new ZoneError(`unknown zone: ${zoneId}`);
  }
  return (epochMs) => {
    const parts = formatter.formatToParts(new Date(epochMs));
    const hour = partNumber(parts, 'hour');
    const wall = wallAsUtcMs({
      year: partNumber(parts, 'year'),
      month: partNumber(parts, 'month'),
      day: partNumber(parts, 'day'),
      // Some engines print midnight as 24 even with h23.
      hour: hour === 24 ? 0 : hour,
      minute: partNumber(parts, 'minute'),
      second: partNumber(parts, 'second'),
    });
    return Math.round((wall - epochMs) / MS_PER_SECOND);
  };
}

const fixedRules = (seconds: number): ZoneRules => () => seconds;

/** `ZoneId.of(id).rules`, as far as Intl allows. */
function rulesOf(zoneId: string): ZoneRules {
  if (zoneId.length <= 1 || zoneId.startsWith('+') || zoneId.startsWith('-')) {
    return fixedRules(parseOffsetSeconds(zoneId));
  }
  const prefix = UTC_PREFIXES.find((p) => zoneId.startsWith(p));
  if (prefix !== undefined) {
    if (zoneId.length === prefix.length) return fixedRules(0);
    const sign = zoneId[prefix.length];
    if (sign === '+' || sign === '-') return fixedRules(parseOffsetSeconds(zoneId.slice(prefix.length)));
  }
  if (!REGION_ID.test(zoneId)) throw new ZoneError(`invalid zone id: ${zoneId}`);
  return intlRules(zoneId);
}

/**
 * Seconds east of UTC in [zoneId] at the local [time], like `ZoneRules.getOffset(LocalDateTime)`:
 * the one valid offset, the earlier one in an overlap, the one in force before a gap.
 */
export function offsetSecondsAt(zoneId: string, time: LocalDateTime): number {
  const rules = rulesOf(zoneId);
  const wall = wallAsUtcMs(time);
  const before = rules(wall - MS_PER_DAY);
  const after = rules(wall + MS_PER_DAY);
  const isValid = (offset: number) => rules(wall - offset * MS_PER_SECOND) === offset;
  if (isValid(before)) return before;
  if (after !== before && isValid(after)) return after;
  return before;
}
