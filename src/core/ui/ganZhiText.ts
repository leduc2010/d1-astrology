import { type Branch, type LunarDate, type Stem, type StemBranch, yearPillar } from '../../engine';
import { mod } from '../../engine/util';
import { itemOf, type UiText } from './uiText';

/*
 * Display text for the engine's calendar types. Names come from resources so each language uses
 * its own tradition (Giáp Tý in Vietnamese, Jia Zi in English); Han glyphs are the same everywhere.
 */

const HAN_STEMS = '甲乙丙丁戊己庚辛壬癸';
const HAN_BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const HOURS_PER_BRANCH = 2;
const DEGREES_PER_SIGN = 30;
const FULL_CIRCLE = 360;
const SIGNS = 12;
const CLOCK_DIGITS = 2;

export const stemHan = (stem: Stem): string => HAN_STEMS[stem] ?? '';
export const branchHan = (branch: Branch): string => HAN_BRANCHES[branch] ?? '';
export const stemBranchHan = (pair: StemBranch): string => stemHan(pair.stem) + branchHan(pair.branch);

export const stemName = (t: UiText, stem: Stem): string => itemOf(t.ta('ganzhi_stems'), stem);
export const branchName = (t: UiText, branch: Branch): string => itemOf(t.ta('ganzhi_branches'), branch);
export const animalName = (t: UiText, branch: Branch): string => itemOf(t.ta('ganzhi_animals'), branch);

export const stemBranchName = (t: UiText, pair: StemBranch): string =>
  t.tf('ganzhi_pair', stemName(t, pair.stem), branchName(t, pair.branch));

/** "Horse hour (Wu)" / "Giờ Ngọ (Ngựa)". */
export const hourName = (t: UiText, branch: Branch): string =>
  t.tf('ganzhi_hour', branchName(t, branch), animalName(t, branch));

/** Clock span of a double hour: Zi runs 23:00–00:59, Chou 01:00–02:59, and so on. */
export function hourSpan(t: UiText, branch: Branch): string {
  const start = (branch * HOURS_PER_BRANCH - 1) * MINUTES_PER_HOUR;
  const end = start + HOURS_PER_BRANCH * MINUTES_PER_HOUR - 1;
  return t.tf('ganzhi_hour_span', clockText(start, t.language), clockText(end, t.language));
}

/** 24-hour "HH:mm" for minutes after midnight (wrapping), in the language's own digits. */
export function clockText(minutesOfDay: number, language?: string): string {
  const m = mod(minutesOfDay, MINUTES_PER_DAY);
  const two = new Intl.NumberFormat(language, { minimumIntegerDigits: CLOCK_DIGITS, useGrouping: false });
  return `${two.format(Math.floor(m / MINUTES_PER_HOUR))}:${two.format(m % MINUTES_PER_HOUR)}`;
}

/** "Day 20, month 7, Yi Hai year" / "20 tháng 7 năm Ất Hợi". */
export function lunarDateText(t: UiText, date: LunarDate): string {
  const year = stemBranchName(t, yearPillar(date.year));
  return t.tf(date.isLeapMonth ? 'lunar_date_leap' : 'lunar_date', date.day, date.month, year);
}

/** "20/7 · Yi Hai year". */
export function lunarDateShortText(t: UiText, date: LunarDate): string {
  const year = stemBranchName(t, yearPillar(date.year));
  return t.tf(date.isLeapMonth ? 'lunar_date_short_leap' : 'lunar_date_short', date.day, date.month, year);
}

/** Western sign for an ecliptic longitude in degrees. */
export const zodiacSignName = (t: UiText, longitude: number): string =>
  zodiacSignNameOf(t, Math.trunc(mod(longitude, FULL_CIRCLE) / DEGREES_PER_SIGN));

/** Western sign by index, 0 Aries … 11 Pisces. */
export const zodiacSignNameOf = (t: UiText, sign: number): string => itemOf(t.ta('zodiac_signs'), mod(sign, SIGNS));
