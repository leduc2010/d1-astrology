import type { LunarDate } from '../lunar/lunarCalendar';
import type { CivilDate } from '../time/civilDate';

/** Where a festival is observed; Vietnamese public days are only shown to Vietnamese readers. */
export enum FestivalScope {
  LUNAR_TRADITION,
  INTERNATIONAL,
  VIETNAM,
}

/** Fixed festivals. Lunar ones fall in the regular (non-leap) month only. */
export enum Festival {
  LUNAR_NEW_YEAR,
  LANTERN,
  HUNG_KINGS,
  BUDDHA_BIRTHDAY,
  DOUBLE_FIFTH,
  GHOST_FESTIVAL,
  MID_AUTUMN,
  KITCHEN_GODS,
  NEW_YEAR,
  WOMENS_DAY,
  REUNIFICATION_DAY,
  LABOUR_DAY,
  NATIONAL_DAY,
  VIETNAMESE_WOMENS_DAY,
  TEACHERS_DAY,
  CHRISTMAS,
}

export interface FestivalInfo {
  readonly month: number;
  readonly day: number;
  readonly isLunar: boolean;
  readonly scope: FestivalScope;
}

const info = (month: number, day: number, isLunar: boolean, scope: FestivalScope): FestivalInfo =>
  Object.freeze({ month, day, isLunar, scope });

const FESTIVAL_INFO: readonly FestivalInfo[] = [
  info(1, 1, true, FestivalScope.LUNAR_TRADITION),
  info(1, 15, true, FestivalScope.LUNAR_TRADITION),
  info(3, 10, true, FestivalScope.VIETNAM),
  info(4, 15, true, FestivalScope.LUNAR_TRADITION),
  info(5, 5, true, FestivalScope.LUNAR_TRADITION),
  info(7, 15, true, FestivalScope.LUNAR_TRADITION),
  info(8, 15, true, FestivalScope.LUNAR_TRADITION),
  info(12, 23, true, FestivalScope.LUNAR_TRADITION),
  info(1, 1, false, FestivalScope.INTERNATIONAL),
  info(3, 8, false, FestivalScope.INTERNATIONAL),
  info(4, 30, false, FestivalScope.VIETNAM),
  info(5, 1, false, FestivalScope.INTERNATIONAL),
  info(9, 2, false, FestivalScope.VIETNAM),
  info(10, 20, false, FestivalScope.VIETNAM),
  info(11, 20, false, FestivalScope.VIETNAM),
  info(12, 25, false, FestivalScope.INTERNATIONAL),
];

export const FESTIVALS: readonly Festival[] = FESTIVAL_INFO.map((_, i) => i as Festival);

export const festivalInfo = (f: Festival): FestivalInfo => FESTIVAL_INFO[f]!;

export function festivalFallsOn(f: Festival, date: CivilDate, lunar: LunarDate): boolean {
  const i = festivalInfo(f);
  return i.isLunar
    ? !lunar.isLeapMonth && lunar.month === i.month && lunar.day === i.day
    : date.month === i.month && date.day === i.day;
}

export const festivalsOn = (date: CivilDate, lunar: LunarDate): Festival[] =>
  FESTIVALS.filter((f) => festivalFallsOn(f, date, lunar));
