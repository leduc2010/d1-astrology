import { type CivilDate, toCivil } from '../../engine';
import { capitalized } from './uiText';

/**
 * Dates as text. Locale patterns in the string resources (`date_day_month_pattern`...) use Java
 * `DateTimeFormatter` letters; `patternDateText` renders the subset they use with `Intl`.
 */

/** Julian day number of 1970-01-01, the epoch of stored epoch days. */
const EPOCH_JDN = 2440588;
const UTC = 'UTC';
const TWO_DIGITS = 2;
const SHORT_TEXT = 3;
const FULL_TEXT = 4;
const MONTHS = 12;
const ANY_YEAR = 2001;

export type DateStyle = 'long' | 'medium';

/** The civil date of a stored epoch day (days since 1970-01-01). */
export const civilDateOfEpochDay = (epochDay: number): CivilDate => toCivil(epochDay + EPOCH_JDN);

/** A solar date in the language's own style: `long` for reading, `medium` where space is tight. */
export function solarDateText(date: CivilDate, language: string, style: DateStyle = 'long'): string {
  return new Intl.DateTimeFormat(language, { dateStyle: style, timeZone: UTC }).format(utcDate(date));
}

/** Month names for a wheel (Java `FULL_STANDALONE`), January first, first letter capitalised. */
export function standaloneMonthNames(language: string): string[] {
  return Array.from({ length: MONTHS }, (_, i) =>
    capitalized(monthText({ year: ANY_YEAR, month: i + 1, day: 1 }, language, 'long', true), language),
  );
}

/**
 * `date` in a Java-style pattern: quoted literals, y, M/L (1 to 4 letters), d and E. M is the
 * month as used inside a date (genitive in Slavic languages), L the standalone month.
 */
export function patternDateText(date: CivilDate, pattern: string, language: string): string {
  return tokenize(pattern)
    .map((token) => (token.kind === 'literal' ? token.text : fieldText(date, token.letter, token.count, language)))
    .join('');
}

type Token = { kind: 'literal'; text: string } | { kind: 'field'; letter: string; count: number };

function tokenize(pattern: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i]!;
    if (ch === "'") {
      const end = pattern.indexOf("'", i + 1);
      const stop = end < 0 ? pattern.length : end;
      // Two quotes in a row stand for one literal quote.
      tokens.push({ kind: 'literal', text: stop === i + 1 ? "'" : pattern.slice(i + 1, stop) });
      i = stop + 1;
    } else if (/[A-Za-z]/.test(ch)) {
      let j = i;
      while (pattern[j] === ch) j++;
      tokens.push({ kind: 'field', letter: ch, count: j - i });
      i = j;
    } else {
      tokens.push({ kind: 'literal', text: ch });
      i++;
    }
  }
  return tokens;
}

function fieldText(date: CivilDate, letter: string, count: number, language: string): string {
  switch (letter) {
    case 'y':
    case 'u':
      return count === TWO_DIGITS ? pad(date.year % 100) : String(date.year);
    case 'M':
    case 'L':
      if (count >= SHORT_TEXT) return monthText(date, language, count >= FULL_TEXT ? 'long' : 'short', letter === 'L');
      return count === TWO_DIGITS ? pad(date.month) : String(date.month);
    case 'd':
      return count === TWO_DIGITS ? pad(date.day) : String(date.day);
    case 'E':
      return partOf(date, language, { weekday: count >= FULL_TEXT ? 'long' : 'short' }, 'weekday');
    default:
      return letter.repeat(count);
  }
}

function monthText(date: CivilDate, language: string, width: 'long' | 'short', standalone: boolean): string {
  // A month formatted beside a day takes its in-date form; alone it takes the standalone one.
  const options: Intl.DateTimeFormatOptions = standalone ? { month: width } : { month: width, day: 'numeric' };
  return partOf(date, language, options, 'month');
}

function partOf(
  date: CivilDate,
  language: string,
  options: Intl.DateTimeFormatOptions,
  type: Intl.DateTimeFormatPartTypes,
): string {
  const parts = new Intl.DateTimeFormat(language, { ...options, timeZone: UTC }).formatToParts(utcDate(date));
  return parts.find((p) => p.type === type)?.value ?? '';
}

function utcDate(date: CivilDate): Date {
  const d = new Date(0);
  d.setUTCFullYear(date.year, date.month - 1, date.day);
  return d;
}

const pad = (n: number): string => String(n).padStart(TWO_DIGITS, '0');
