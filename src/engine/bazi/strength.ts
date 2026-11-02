import {
  controlledBy,
  controls,
  generatedBy,
  generates,
  stemElement,
  type Branch,
  type Element,
  type Stem,
  type StemBranch,
} from '../ganzhi/ganzhi';
import { TEN_GOD_GROUPS, tenGodGroup, tenGodOf, TenGodGroup } from '../ganzhi/tenGod';
import { minBy } from '../util';
import { hiddenStems } from './baziDetails';

/** How much of the chart backs the day master (Thân vượng / nhược), five steps. */
export enum StrengthLevel {
  VERY_WEAK,
  WEAK,
  BALANCED,
  STRONG,
  VERY_STRONG,
}

/**
 * The day master's strength and the elements that steady it (Dụng thần, Hỷ thần, Kỵ thần).
 * [support] is the share of the chart, 0..1, that is the day master's own element or feeds it.
 */
export interface DayMasterStrength {
  readonly support: number;
  readonly level: StrengthLevel;
  /** Weighted points per relation group (the day master's own stem left out). */
  readonly points: ReadonlyMap<TenGodGroup, number>;
  /** The element that best brings the chart back to balance. */
  readonly useful: Element;
  /** The element that feeds [useful]. */
  readonly favorable: Element;
  /** The element that restrains [useful]. */
  readonly unfavorable: Element;
}

const STEM_WEIGHT = 1.0;
const BRANCH_WEIGHT = 1.0;
const MONTH_WEIGHT = 2.5;
const HALF = 0.5;
const VERY_WEAK_BELOW = 0.3;
const WEAK_BELOW = 0.45;
const BALANCED_UP_TO = 0.55;
const STRONG_UP_TO = 0.7;

/** Share of a branch's weight per hidden stem, main qi first. */
const HIDDEN_SHARES: Readonly<Record<number, readonly number[]>> = {
  1: [1.0],
  2: [0.7, 0.3],
  3: [0.6, 0.3, 0.1],
};

/**
 * Phù ức method: visible stems count one point each, a branch counts through its hidden stems
 * (main qi heaviest), and the month branch counts 2.5 times as it sets the season.
 *
 * Strong charts use the group that undoes what made them strong: wealth breaks heavy resource,
 * power restrains heavy companions. Weak charts use resource against heavy power or output, and
 * companions against heavy wealth. A balanced chart uses its least present element.
 */
export function strengthOf(year: StemBranch, month: StemBranch, day: StemBranch, hour: StemBranch | null): DayMasterStrength {
  const self = day.stem;
  const points = new Map<TenGodGroup, number>(TEN_GOD_GROUPS.map((g) => [g, 0.0]));
  const add = (stemPoints: readonly (readonly [Stem, number])[]) => {
    for (const [stem, weight] of stemPoints) {
      const group = tenGodGroup(tenGodOf(self, stem));
      points.set(group, points.get(group)! + weight);
    }
  };
  const stems = [year.stem, month.stem, ...(hour ? [hour.stem] : [])];
  add(stems.map((s) => [s, STEM_WEIGHT] as const));
  for (const b of [year.branch, day.branch, ...(hour ? [hour.branch] : [])]) add(branchPoints(b, BRANCH_WEIGHT));
  add(branchPoints(month.branch, MONTH_WEIGHT));

  let total = 0;
  for (const v of points.values()) total += v;
  const backing = points.get(TenGodGroup.COMPANION)! + points.get(TenGodGroup.RESOURCE)!;
  const support = total === 0.0 ? HALF : backing / total;
  const level = levelOf(support);
  const useful = elementOf(stemElement(self), usefulGroup(level, points), points);
  return Object.freeze({
    support,
    level,
    points: new Map(points),
    useful,
    favorable: generatedBy(useful),
    unfavorable: controlledBy(useful),
  });
}

function branchPoints(branch: Branch, weight: number): (readonly [Stem, number])[] {
  const stems = hiddenStems(branch);
  const shares = HIDDEN_SHARES[stems.length]!;
  return stems.map((stem, i) => [stem, weight * shares[i]!] as const);
}

function levelOf(support: number): StrengthLevel {
  if (support < VERY_WEAK_BELOW) return StrengthLevel.VERY_WEAK;
  if (support < WEAK_BELOW) return StrengthLevel.WEAK;
  if (support <= BALANCED_UP_TO) return StrengthLevel.BALANCED;
  if (support <= STRONG_UP_TO) return StrengthLevel.STRONG;
  return StrengthLevel.VERY_STRONG;
}

/** Null for a balanced chart, which picks by element instead. */
function usefulGroup(level: StrengthLevel, points: ReadonlyMap<TenGodGroup, number>): TenGodGroup | null {
  const p = (g: TenGodGroup) => points.get(g)!;
  switch (level) {
    case StrengthLevel.STRONG:
    case StrengthLevel.VERY_STRONG:
      return p(TenGodGroup.RESOURCE) > p(TenGodGroup.COMPANION) ? TenGodGroup.WEALTH : TenGodGroup.POWER;
    case StrengthLevel.WEAK:
    case StrengthLevel.VERY_WEAK:
      return p(TenGodGroup.WEALTH) > Math.max(p(TenGodGroup.POWER), p(TenGodGroup.OUTPUT))
        ? TenGodGroup.COMPANION
        : TenGodGroup.RESOURCE;
    case StrengthLevel.BALANCED:
      return null;
  }
}

function elementOf(self: Element, group: TenGodGroup | null, points: ReadonlyMap<TenGodGroup, number>): Element {
  const chosen = group ?? minBy(TEN_GOD_GROUPS, (g) => points.get(g)!);
  switch (chosen) {
    case TenGodGroup.COMPANION:
      return self;
    case TenGodGroup.OUTPUT:
      return generates(self);
    case TenGodGroup.WEALTH:
      return controls(self);
    case TenGodGroup.POWER:
      return controlledBy(self);
    case TenGodGroup.RESOURCE:
      return generatedBy(self);
  }
}
