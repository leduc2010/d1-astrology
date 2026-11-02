import { ELEMENTS, type Element, type StemBranch } from '../ganzhi/ganzhi';
import { maxBy, minBy } from '../util';
import { BranchBond, branchBondOf, ElementBond, isSupportiveBond, stemBondOf, type StemBond } from './folk';

/** A per-criterion mark. Marks are shown side by side and never added into one score. */
export enum MatchMark {
  GOOD,
  NEUTRAL,
  CARE,
}

export enum BaZiCriterion {
  YEAR_STEMS,
  ELEMENT_SUPPORT,
  YEAR_BRANCHES,
  DAY_PILLARS,
}

export interface CriterionMark {
  readonly criterion: BaZiCriterion;
  readonly mark: MatchMark;
}

/** What one person brings to a Four Pillars match: year and day pillars and the element count. */
export interface MatchPillars {
  readonly year: StemBranch;
  readonly day: StemBranch;
  readonly balance: ReadonlyMap<Element, number>;
}

export const strongestElement = (p: MatchPillars): Element => maxBy(ELEMENTS, (e) => p.balance.get(e) ?? 0);
export const weakestElement = (p: MatchPillars): Element => minBy(ELEMENTS, (e) => p.balance.get(e) ?? 0);

export const baziCriteria = (a: MatchPillars, b: MatchPillars): CriterionMark[] => [
  Object.freeze({ criterion: BaZiCriterion.YEAR_STEMS, mark: stemsMark(stemBondOf(a.year.stem, b.year.stem)) }),
  Object.freeze({ criterion: BaZiCriterion.ELEMENT_SUPPORT, mark: elementSupportMark(a, b) }),
  Object.freeze({ criterion: BaZiCriterion.YEAR_BRANCHES, mark: branchesMark(branchBondOf(a.year.branch, b.year.branch)) }),
  Object.freeze({ criterion: BaZiCriterion.DAY_PILLARS, mark: dayPillarsMark(a.day, b.day) }),
];

/** Combining or feeding stems help; the same element is even; a controlling pair asks for care. */
export function stemsMark(bond: StemBond): MatchMark {
  if (bond.combines) return MatchMark.GOOD;
  if (bond.elements === ElementBond.SAME) return MatchMark.NEUTRAL;
  if (isSupportiveBond(bond.elements)) return MatchMark.GOOD;
  return MatchMark.CARE;
}

export function branchesMark(bond: BranchBond): MatchMark {
  switch (bond) {
    case BranchBond.TRINE:
    case BranchBond.HARMONY:
      return MatchMark.GOOD;
    case BranchBond.NEUTRAL:
      return MatchMark.NEUTRAL;
    case BranchBond.CLASH:
    case BranchBond.HARM:
      return MatchMark.CARE;
  }
}

/** One person's richest element filling the other's thinnest is read as mutual support. */
export const elementSupportMark = (a: MatchPillars, b: MatchPillars): MatchMark =>
  weakestElement(a) === strongestElement(b) || weakestElement(b) === strongestElement(a) ? MatchMark.GOOD : MatchMark.NEUTRAL;

function dayPillarsMark(a: StemBranch, b: StemBranch): MatchMark {
  const branchMark = branchesMark(branchBondOf(a.branch, b.branch));
  const good = stemBondOf(a.stem, b.stem).combines || branchMark === MatchMark.GOOD;
  const care = branchMark === MatchMark.CARE;
  if (good && !care) return MatchMark.GOOD;
  if (care && !good) return MatchMark.CARE;
  return MatchMark.NEUTRAL;
}
