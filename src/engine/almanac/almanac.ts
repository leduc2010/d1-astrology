import { sunApparentLongitude, sunCrossing } from '../astro/sun';
import { dayPillar, monthBranch } from '../bazi/bazi';
import { BRANCHES, branchMinus, branchPlus, Branch, type StemBranch } from '../ganzhi/ganzhi';
import { monthPillar, toLunar, VIETNAM_OFFSET, type LunarDate } from '../lunar/lunarCalendar';
import type { CivilDate } from '../time/civilDate';
import { dayNumber, toCivil, weekday } from '../time/julianDay';
import { mod } from '../util';
import { festivalsOn, type Festival } from './festival';
import { moonPhaseOf, type MoonPhase } from './moonPhase';

/** The 28 lunar mansions (Nhị thập bát tú), Giác … Chẩn. */
export enum Mansion {
  HORN, NECK, ROOT, ROOM, HEART, TAIL, WINNOWING_BASKET,
  DIPPER, OX, GIRL, EMPTINESS, ROOFTOP, ENCAMPMENT, WALL,
  LEGS, BOND, STOMACH, HAIRY_HEAD, NET, TURTLE_BEAK, THREE_STARS,
  WELL, GHOST, WILLOW, STAR, EXTENDED_NET, WINGS, CHARIOT,
}
const MANSION_COUNT = 28;

/** The 12 day officers (Thập nhị trực), Kiến … Bế. */
export enum DayOfficer {
  ESTABLISH, REMOVE, FULL, BALANCE, STABLE, INITIATE,
  DESTRUCTION, DANGER, SUCCESS, RECEIVE, OPEN, CLOSE,
}

/** The 12 hour spirits; six are auspicious (Hoàng đạo), six inauspicious (Hắc đạo). */
export enum HourSpirit {
  AZURE_DRAGON, BRIGHT_HALL, HEAVENLY_PUNISHMENT, VERMILION_BIRD,
  GOLDEN_COFFER, PRECIOUS_LIGHT, WHITE_TIGER, JADE_HALL,
  HEAVENLY_PRISON, BLACK_TORTOISE, LIFE_CONTROLLER, HOOK_ARRAY,
}
const SPIRIT_AUSPICIOUS: readonly boolean[] = [true, true, false, false, true, true, false, true, false, false, true, false];
export const isAuspiciousSpirit = (s: HourSpirit): boolean => SPIRIT_AUSPICIOUS[s]!;

/** The 24 solar terms (Tiết khí), ordered by ecliptic longitude from 0° (Xuân phân). */
export enum SolarTerm {
  SPRING_EQUINOX, CLEAR_AND_BRIGHT, GRAIN_RAIN, START_OF_SUMMER, GRAIN_BUDS, GRAIN_IN_EAR,
  SUMMER_SOLSTICE, MINOR_HEAT, MAJOR_HEAT, START_OF_AUTUMN, END_OF_HEAT, WHITE_DEW,
  AUTUMN_EQUINOX, COLD_DEW, FROST_DESCENT, START_OF_WINTER, MINOR_SNOW, MAJOR_SNOW,
  WINTER_SOLSTICE, MINOR_COLD, MAJOR_COLD, START_OF_SPRING, RAIN_WATER, AWAKENING_OF_INSECTS,
}
export const SOLAR_TERM_ARC_DEG = 15.0;
const SOLAR_TERM_COUNT = 24;
export const solarTermLongitude = (t: SolarTerm): number => t * SOLAR_TERM_ARC_DEG;
export const solarTermAt = (sunLongitude: number): SolarTerm =>
  mod(Math.floor(sunLongitude / SOLAR_TERM_ARC_DEG), SOLAR_TERM_COUNT);

/** The eight trigrams used for the life trigram (Cung phi / Kua). */
export enum Trigram { KAN, KUN, ZHEN, XUN, QIAN, DUI, GEN, LI }
export const TRIGRAMS: readonly Trigram[] = Array.from({ length: 8 }, (_, i) => i as Trigram);

/**
 * Everything the calendar shows for one civil day. Pure function of the date and zone.
 * [isTermStart] is true on the day a new solar term begins; [daySpirit] rules the whole day and
 * decides whether it is a Hoàng đạo day.
 */
export interface DayAlmanac {
  readonly date: CivilDate;
  readonly weekday: number;
  readonly lunar: LunarDate;
  readonly dayPillar: StemBranch;
  readonly monthPillar: StemBranch;
  readonly mansion: Mansion;
  readonly officer: DayOfficer;
  readonly daySpirit: HourSpirit;
  readonly solarTerm: SolarTerm;
  readonly isTermStart: boolean;
  readonly moonPhase: MoonPhase;
  readonly festivals: readonly Festival[];
  readonly auspiciousHours: readonly Branch[];
  readonly isAuspiciousDay: boolean;
}

/**
 * The meridian the app's lunar calendar is drawn for: the Vietnamese calendar (UTC+7), wherever
 * the phone is. Using the device offset would move new moons, Tết and solar terms by a day for
 * owners abroad and disagree with every printed Vietnamese calendar.
 */
export const CALENDAR_OFFSET = VIETNAM_OFFSET;

const HOURS = 24.0;
const MANSION_OFFSET = 11;
const HALF_CYCLE = 6;
const CENTER = 5;
const TRIGRAM_BY_NUMBER: Readonly<Record<number, Trigram>> = {
  1: Trigram.KAN, 2: Trigram.KUN, 3: Trigram.ZHEN, 4: Trigram.XUN,
  6: Trigram.QIAN, 7: Trigram.DUI, 8: Trigram.GEN, 9: Trigram.LI,
};

export function almanacDay(date: CivilDate, utcOffsetHours: number): DayAlmanac {
  const jdn = dayNumber(date);
  const pillar = dayPillar(jdn);
  const lunar = toLunar(date, utcOffsetHours);
  const mp = monthPillar(lunar);
  const sunLon = sunAtEndOfDay(jdn, utcOffsetHours);
  const term = solarTermAt(sunLon);
  const spirit = daySpirit(mp.branch, pillar.branch);
  return Object.freeze({
    date,
    weekday: weekday(jdn),
    lunar,
    dayPillar: pillar,
    monthPillar: mp,
    mansion: mansion(jdn),
    officer: officer(pillar.branch, monthBranch(sunLon)),
    daySpirit: spirit,
    solarTerm: term,
    isTermStart: solarTermAt(sunAtEndOfDay(jdn - 1, utcOffsetHours)) !== term,
    moonPhase: moonPhaseOf(lunar.day),
    festivals: festivalsOn(date, lunar),
    auspiciousHours: auspiciousHours(pillar.branch),
    isAuspiciousDay: isAuspiciousSpirit(spirit),
  });
}

/** Solar values are taken at the end of the local day, so a term that begins during the day counts. */
function sunAtEndOfDay(jdn: number, utcOffsetHours: number): number {
  return sunApparentLongitude(jdn + 0.5 - utcOffsetHours / HOURS);
}

/** Days from [from] (inclusive) over the next [days] that open a solar term or hold a festival. */
export function notableDays(from: CivilDate, days: number, utcOffsetHours: number): DayAlmanac[] {
  const start = dayNumber(from);
  const result: DayAlmanac[] = [];
  for (let d = start; d < start + days; d++) {
    const a = almanacDay(toCivil(d), utcOffsetHours);
    if (a.isTermStart || a.festivals.length > 0) result.push(a);
  }
  return result;
}

/** Local civil date on which the solar term in force at the end of [date] began. */
export function termStart(date: CivilDate, utcOffsetHours: number): CivilDate {
  const jdn = dayNumber(date);
  const term = solarTermAt(sunAtEndOfDay(jdn, utcOffsetHours));
  const crossing = sunCrossing(solarTermLongitude(term), jdn + 0.5 - utcOffsetHours / HOURS, false);
  return toCivil(Math.floor(crossing + 0.5 + utcOffsetHours / HOURS));
}

export const mansion = (jdn: number): Mansion => mod(jdn + MANSION_OFFSET, MANSION_COUNT);

/** Kiến falls on the day whose branch equals the solar month's branch. */
export const officer = (dayBranch: Branch, mb: Branch): DayOfficer => branchMinus(dayBranch, mb);

/**
 * Spirit ruling the day with branch [dayBranch] inside the lunar month with branch [monthBranch];
 * the day cycle runs like the hour cycle, with the month in the role of the day.
 */
export const daySpirit = (mb: Branch, dayBranch: Branch): HourSpirit => hourSpirit(mb, dayBranch);

/** Spirit ruling [hour] on a day with branch [dayBranch]; Thanh Long starts at Thân on Tý/Ngọ days. */
export function hourSpirit(dayBranch: Branch, hour: Branch): HourSpirit {
  const azureDragon = branchPlus(Branch.SHEN, 2 * (dayBranch % HALF_CYCLE));
  return branchMinus(hour, azureDragon);
}

export const auspiciousHours = (dayBranch: Branch): Branch[] =>
  BRANCHES.filter((b) => isAuspiciousSpirit(hourSpirit(dayBranch, b)));

/** Life trigram from the Gregorian birth year (callers adjust for births before Lập Xuân). */
export function lifeTrigram(year: number, isMale: boolean): Trigram {
  const raw = isMale ? mod(11 - (year % 9), 9) : mod((year % 9) + 4, 9);
  const n = raw === 0 ? 9 : raw;
  if (n === CENTER) return isMale ? Trigram.KUN : Trigram.GEN;
  return TRIGRAM_BY_NUMBER[n]!;
}
