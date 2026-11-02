import type { DayMasterStrength } from '../bazi/strength';
import { Branch, branchClash, branchMinus, stemElement, type Stem, type StemBranch } from '../ganzhi/ganzhi';
import { tenGodOf, type TenGod } from '../ganzhi/tenGod';
import { yearPillar } from '../lunar/lunarCalendar';
import { trineGroup } from '../match/folk';
import { hoangOcOf, kimLauOf, nineStarOf, type HoangOc, type KimLau, type NineStar } from './folkYear';

/** How the year's branch meets the birth-year branch (Thái Tuế, by folk custom). */
export enum TaiSuiBond {
  SAME,
  CLASH,
  PUNISHMENT,
  HARM,
  BREAK,
  NONE,
}

/** Where the year's element sits for this chart's useful element. */
export enum YearElementRole {
  USEFUL,
  FAVORABLE,
  UNFAVORABLE,
  NEUTRAL,
}

/**
 * One lunar year read against a birth: the year pillar, the age counted the folk way (tuổi mụ),
 * Thái Tuế and Tam Tai from the birth-year branch, the folk-age customs (Cửu Diệu, Kim Lâu,
 * Hoang Ốc), and the year stem's Ten God for the day master.
 */
export interface YearOutlook {
  readonly lunarYear: number;
  readonly pillar: StemBranch;
  /** Age counted from 1 in the birth year (tuổi mụ). */
  readonly folkAge: number;
  readonly taiSui: TaiSuiBond;
  /** 1, 2 or 3 inside a Tam Tai run, else null. */
  readonly tamTaiYear: number | null;
  /** The year stem's relation to the day master, or null without a day master. */
  readonly theme: TenGod | null;
  readonly elementRole: YearElementRole;
  readonly nineStar: NineStar;
  /** Kim Lâu and Hoang Ốc are consulted for weddings and building, so only from adulthood. */
  readonly customsApply: boolean;
  /** Null when the year is clear, or when customsApply is false. */
  readonly kimLau: KimLau | null;
  /** Null when customsApply is false. */
  readonly hoangOc: HoangOc | null;
}

const TAM_TAI_YEARS = 3;
const ADULT_FOLK_AGE = 18;
const HARM_SUM = 7;
const BRANCH_COUNT = 12;

/** Tam hình pairs that are not a branch with itself: Dần Tỵ Thân, Sửu Tuất Mùi, Tý Mão. */
const PUNISHMENTS: readonly (readonly Branch[])[] = [
  [Branch.YIN, Branch.SI, Branch.SHEN],
  [Branch.CHOU, Branch.XU, Branch.WEI],
  [Branch.ZI, Branch.MAO],
];

/** Lục phá: Tý Dậu, Mão Ngọ, Sửu Thìn, Mùi Tuất, Dần Hợi, Tỵ Thân. */
const BREAKS: readonly (readonly Branch[])[] = [
  [Branch.ZI, Branch.YOU],
  [Branch.MAO, Branch.WU],
  [Branch.CHOU, Branch.CHEN],
  [Branch.WEI, Branch.XU],
  [Branch.YIN, Branch.HAI],
  [Branch.SI, Branch.SHEN],
];

export function yearOutlook(
  lunarYear: number,
  birthLunarYear: number,
  isMale: boolean,
  dayMaster: Stem | null,
  strength: DayMasterStrength | null,
): YearOutlook {
  const pillar = yearPillar(lunarYear);
  const birthBranch = yearPillar(birthLunarYear).branch;
  const folkAge = lunarYear - birthLunarYear + 1;
  const customsApply = folkAge >= ADULT_FOLK_AGE;
  return Object.freeze({
    lunarYear,
    pillar,
    folkAge,
    taiSui: taiSui(birthBranch, pillar.branch),
    tamTaiYear: tamTaiYear(birthBranch, pillar.branch),
    theme: dayMaster === null ? null : tenGodOf(dayMaster, pillar.stem),
    elementRole: elementRole(pillar, strength),
    nineStar: nineStarOf(folkAge, isMale),
    customsApply,
    kimLau: customsApply ? kimLauOf(folkAge) : null,
    hoangOc: customsApply ? hoangOcOf(folkAge) : null,
  });
}

const inSameGroup = (groups: readonly (readonly Branch[])[], a: Branch, b: Branch): boolean =>
  groups.some((g) => g.includes(a) && g.includes(b));

export function taiSui(birth: Branch, year: Branch): TaiSuiBond {
  if (year === birth) return TaiSuiBond.SAME;
  if (year === branchClash(birth)) return TaiSuiBond.CLASH;
  if (inSameGroup(PUNISHMENTS, birth, year)) return TaiSuiBond.PUNISHMENT;
  if ((birth + year) % BRANCH_COUNT === HARM_SUM) return TaiSuiBond.HARM;
  if (inSameGroup(BREAKS, birth, year)) return TaiSuiBond.BREAK;
  return TaiSuiBond.NONE;
}

/**
 * Tam Tai: three years in a row starting at the branch that clashes with the birth trine's
 * growth branch. Thân Tý Thìn → Dần Mão Thìn, Dần Ngọ Tuất → Thân Dậu Tuất, and so on.
 */
export function tamTaiYear(birth: Branch, year: Branch): number | null {
  const start = branchClash(trineGroup(birth)[0]!);
  const step = branchMinus(year, start);
  return step < TAM_TAI_YEARS ? step + 1 : null;
}

function elementRole(pillar: StemBranch, strength: DayMasterStrength | null): YearElementRole {
  if (strength === null) return YearElementRole.NEUTRAL;
  const element = stemElement(pillar.stem);
  if (element === strength.useful) return YearElementRole.USEFUL;
  if (element === strength.favorable) return YearElementRole.FAVORABLE;
  if (element === strength.unfavorable) return YearElementRole.UNFAVORABLE;
  return YearElementRole.NEUTRAL;
}
