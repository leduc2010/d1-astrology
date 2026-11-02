import { civilDate, type CivilDate } from '../time/civilDate';
import { dayNumber } from '../time/julianDay';
import * as Lunar from './lunarCalendar';
import type { LunarDate } from './lunarCalendar';

/**
 * The Vietnamese lunar calendar as it was actually printed. Until the end of 1967 it was drawn for
 * Beijing time (UTC+8); the North moved to UTC+7 from 1968 (so Tết Mậu Thân fell on 29 January in
 * Hà Nội), while the South kept UTC+8 until reunification (Tết on 30 January in Sài Gòn).
 */
const NORTH_SWITCH = civilDate(1968, 1, 1);
const SOUTH_SWITCH = civilDate(1976, 1, 1);

const switchDate = (isSouth: boolean): CivilDate => (isSouth ? SOUTH_SWITCH : NORTH_SWITCH);

/** The meridian in force on [date]; [isSouth] for a place in the former South (below the 17th parallel). */
export function vietnamOffsetFor(date: CivilDate, isSouth = false): number {
  return dayNumber(date) < dayNumber(switchDate(isSouth)) ? Lunar.CHINA_OFFSET : Lunar.VIETNAM_OFFSET;
}

export function vietnamToLunar(date: CivilDate, isSouth = false): LunarDate {
  return Lunar.toLunar(date, vietnamOffsetFor(date, isSouth));
}

/** Solar date of [lunar] in the calendar of its time, or null if that lunar date did not exist. */
export function vietnamToSolar(lunar: LunarDate, isSouth = false): CivilDate | null {
  const old = Lunar.toSolar(lunar, Lunar.CHINA_OFFSET);
  if (old !== null && vietnamOffsetFor(old, isSouth) === Lunar.CHINA_OFFSET) return old;
  const modern = Lunar.toSolar(lunar, Lunar.VIETNAM_OFFSET);
  if (modern !== null && vietnamOffsetFor(modern, isSouth) === Lunar.VIETNAM_OFFSET) return modern;
  return old;
}

/** Days in the lunar month of [lunar] (29 or 30), or null if the month did not exist. */
export function vietnamMonthLength(lunar: LunarDate, isSouth = false): number | null {
  return Lunar.monthLength(lunar, offsetForLunarYear(lunar.year, isSouth));
}

export function vietnamLeapMonthOf(lunarYear: number, isSouth = false): number | null {
  return Lunar.leapMonthOf(lunarYear, offsetForLunarYear(lunarYear, isSouth));
}

/** A lunar year ends early in the next solar year, so it belongs to the old calendar if it began before the switch. */
function offsetForLunarYear(lunarYear: number, isSouth: boolean): number {
  return lunarYear < switchDate(isSouth).year ? Lunar.CHINA_OFFSET : Lunar.VIETNAM_OFFSET;
}
