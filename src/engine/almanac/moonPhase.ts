import { require } from '../util';

/** Moon phase read from the lunar day; a lunar month starts on the new moon. */
export enum MoonPhase {
  NEW_MOON,
  WAXING_CRESCENT,
  FIRST_QUARTER,
  WAXING_GIBBOUS,
  FULL_MOON,
  WANING_GIBBOUS,
  LAST_QUARTER,
  WANING_CRESCENT,
}

const LAST_LUNAR_DAY = 30;
const LAST_DAY: readonly number[] = [1, 6, 8, 13, 16, 21, 23, LAST_LUNAR_DAY];

export function moonPhaseOf(lunarDay: number): MoonPhase {
  require(lunarDay >= 1 && lunarDay <= LAST_LUNAR_DAY, `lunar day out of range: ${lunarDay}`);
  return LAST_DAY.findIndex((last) => lunarDay <= last) as MoonPhase;
}
