import type { ResolvedBirth } from '@/core/data';
import { Gender } from '@/core/model';
import {
  AxisLevel,
  baziCriteria,
  branchBondOf,
  branchesMark,
  elementBalance,
  houseMansionOf,
  isFavorableMansion,
  isSupportiveBond,
  lifeTrigram,
  MatchMark,
  naYinBondOf,
  synastryAxes,
  type AxisReading,
  type BaZiCriterion,
  type BranchBond,
  type CriterionMark,
  type HouseMansion,
  type MatchPillars,
  type NaYinBond,
  type StemBranch,
  type SynastryAxis,
  type Trigram,
} from '@/engine';

/** Most strengths and most points of care listed on the result page. */
const MAX_POINTS = 3;

/** One person as the match pages show them. [lunarYear] is the folk "tuổi" (year by Tết). */
export interface MatchSide {
  readonly name: string;
  readonly lunarYear: StemBranch;
  readonly pillars: MatchPillars;
  readonly lifeTrigram: Trigram;
}

/** The folk "hợp tuổi" view: year branches, nạp âm of the year, and the life-trigram mansion. */
export interface FolkMatch {
  readonly branches: BranchBond;
  readonly naYin: NaYinBond;
  readonly mansion: HouseMansion;
}

export const branchMark = (folk: FolkMatch): MatchMark => branchesMark(folk.branches);

export const naYinMark = (folk: FolkMatch): MatchMark =>
  folk.naYin.sameSound || isSupportiveBond(folk.naYin.elements) ? MatchMark.GOOD : MatchMark.CARE;

export const mansionMark = (folk: FolkMatch): MatchMark =>
  isFavorableMansion(folk.mansion) ? MatchMark.GOOD : MatchMark.CARE;

/** A single strength or point of care, named by the system it comes from. */
export type MatchPoint =
  | { readonly kind: 'Axis'; readonly axis: SynastryAxis; readonly level: AxisLevel }
  | { readonly kind: 'Criterion'; readonly criterion: BaZiCriterion; readonly mark: MatchMark }
  | { readonly kind: 'Branches'; readonly bond: BranchBond }
  | { readonly kind: 'NaYin'; readonly bond: NaYinBond }
  | { readonly kind: 'Mansion'; readonly mansion: HouseMansion };

/**
 * How two charts meet, system by system. Every system is read on its own terms and nothing is
 * added up into an overall score.
 */
export interface MatchReport {
  readonly first: MatchSide;
  readonly second: MatchSide;
  readonly axes: readonly AxisReading[];
  readonly criteria: readonly CriterionMark[];
  readonly folk: FolkMatch;
  readonly strengths: readonly MatchPoint[];
  readonly cares: readonly MatchPoint[];
}

const AXIS_MARKS: Readonly<Record<AxisLevel, MatchMark>> = {
  [AxisLevel.QUIET]: MatchMark.NEUTRAL,
  [AxisLevel.NEEDS_CARE]: MatchMark.CARE,
  [AxisLevel.MODERATE]: MatchMark.NEUTRAL,
  [AxisLevel.WARM]: MatchMark.GOOD,
  [AxisLevel.STRONG]: MatchMark.GOOD,
};

const axisMark = (level: AxisLevel): MatchMark => AXIS_MARKS[level];

function interleave<T>(lists: readonly (readonly T[])[]): T[] {
  const longest = Math.max(0, ...lists.map((it) => it.length));
  const out: T[] = [];
  for (let i = 0; i < longest; i++) {
    lists.forEach((list) => {
      const item = list[i];
      if (item !== undefined) out.push(item);
    });
  }
  return out;
}

function points(
  axes: readonly AxisReading[],
  criteria: readonly CriterionMark[],
  folk: FolkMatch,
  mark: MatchMark,
): readonly MatchPoint[] {
  const axisPoints: MatchPoint[] = axes
    .filter((it) => axisMark(it.level) === mark)
    .map((it) => ({ kind: 'Axis', axis: it.axis, level: it.level }));
  const criterionPoints: MatchPoint[] = criteria
    .filter((it) => it.mark === mark)
    .map((it) => ({ kind: 'Criterion', criterion: it.criterion, mark: it.mark }));
  const folkPoints: MatchPoint[] = [
    ...(branchMark(folk) === mark ? [{ kind: 'Branches', bond: folk.branches } as const] : []),
    ...(naYinMark(folk) === mark ? [{ kind: 'NaYin', bond: folk.naYin } as const] : []),
    ...(mansionMark(folk) === mark ? [{ kind: 'Mansion', mansion: folk.mansion } as const] : []),
  ];
  // Interleave the systems so the first lines are not all from one of them.
  return Object.freeze(interleave([axisPoints, criterionPoints, folkPoints]).slice(0, MAX_POINTS));
}

function matchSide(birth: ResolvedBirth): MatchSide {
  const pillars = birth.pillars();
  const all = [pillars.year, pillars.month, pillars.day, pillars.hour].filter((it): it is StemBranch => it !== null);
  return Object.freeze({
    name: birth.profile.name,
    lunarYear: birth.lunarYearPillar,
    pillars: Object.freeze({ year: pillars.year, day: pillars.day, balance: elementBalance(all) }),
    // Cung phi follows the lunar year, as in Vietnamese practice.
    lifeTrigram: lifeTrigram(birth.lunarDate.year, birth.profile.gender === Gender.MALE),
  });
}

/** Reads [a] and [b] against each other. Throws when either chart cannot be worked out. */
export function matchReportOf(a: ResolvedBirth, b: ResolvedBirth): MatchReport {
  const first = matchSide(a);
  const second = matchSide(b);
  const axes = Object.freeze(synastryAxes(a.natal(), b.natal()));
  const criteria = Object.freeze(baziCriteria(first.pillars, second.pillars));
  const folk: FolkMatch = Object.freeze({
    branches: branchBondOf(first.lunarYear.branch, second.lunarYear.branch),
    naYin: naYinBondOf(first.lunarYear, second.lunarYear),
    mansion: houseMansionOf(first.lifeTrigram, second.lifeTrigram),
  });
  return Object.freeze({
    first,
    second,
    axes,
    criteria,
    folk,
    strengths: points(axes, criteria, folk, MatchMark.GOOD),
    cares: points(axes, criteria, folk, MatchMark.CARE),
  });
}
