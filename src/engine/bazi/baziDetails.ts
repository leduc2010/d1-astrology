import {
  Branch,
  branchElement,
  branchMinus,
  ELEMENTS,
  Stem,
  stemBranchPlus,
  stemElement,
  stemIsYang,
  type Element,
  type StemBranch,
} from '../ganzhi/ganzhi';
import { require } from '../util';

const HIDDEN_STEMS: readonly (readonly Stem[])[] = [
  [Stem.GUI],
  [Stem.JI, Stem.GUI, Stem.XIN],
  [Stem.JIA, Stem.BING, Stem.WU],
  [Stem.YI],
  [Stem.WU, Stem.YI, Stem.GUI],
  [Stem.BING, Stem.WU, Stem.GENG],
  [Stem.DING, Stem.JI],
  [Stem.JI, Stem.DING, Stem.YI],
  [Stem.GENG, Stem.REN, Stem.WU],
  [Stem.XIN],
  [Stem.WU, Stem.XIN, Stem.DING],
  [Stem.REN, Stem.JIA],
];

/** The stems hidden in each branch (Tàng can), main qi first. */
export const hiddenStems = (b: Branch): readonly Stem[] => HIDDEN_STEMS[b]!;

/** The twelve stages of a stem's life cycle through the branches (Trường sinh). */
export enum LifeStage {
  BIRTH,
  BATH,
  CAP,
  OFFICE,
  PEAK,
  DECLINE,
  SICKNESS,
  DEATH,
  TOMB,
  EXTINCTION,
  CONCEPTION,
  NURTURE,
}

// Giáp Hợi, Ất Ngọ, Bính/Mậu Dần, Đinh/Kỷ Dậu, Canh Tỵ, Tân Tý, Nhâm Thân, Quý Mão.
const BIRTH_BRANCH: readonly Branch[] = [
  Branch.HAI, Branch.WU, Branch.YIN, Branch.YOU, Branch.YIN,
  Branch.YOU, Branch.SI, Branch.ZI, Branch.SHEN, Branch.MAO,
];

/** Stage of [stem] in [branch]: yang stems walk the branches forward, yin stems backward. */
export function lifeStageOf(stem: Stem, branch: Branch): LifeStage {
  const birth = BIRTH_BRANCH[stem]!;
  return stemIsYang(stem) ? branchMinus(branch, birth) : branchMinus(birth, branch);
}

const LUCK_SPAN = 10;
export const DEFAULT_LUCK_PILLARS = 8;

/** One 10-year luck pillar (Đại vận) and the age it starts at. */
export interface LuckPillar {
  readonly pillar: StemBranch;
  readonly startAge: number;
  readonly endAge: number;
}

export const luckCovers = (lp: LuckPillar, age: number): boolean => age >= lp.startAge && age <= lp.endAge;

/** Luck cycles walk forward for a yang-year man or a yin-year woman, backward otherwise. */
export const luckRunsForward = (yearStem: Stem, isMale: boolean): boolean => stemIsYang(yearStem) === isMale;

/**
 * The luck pillars after the month pillar, one step along the 60-pair cycle each (forward or
 * backward), starting at [startAge] and ten years apart.
 */
export function luckPillars(month: StemBranch, forward: boolean, startAge: number, count = DEFAULT_LUCK_PILLARS): LuckPillar[] {
  require(count >= 0, `count must not be negative: ${count}`);
  const step = forward ? 1 : -1;
  return Array.from({ length: count }, (_, i) => {
    const start = startAge + LUCK_SPAN * i;
    return Object.freeze({ pillar: stemBranchPlus(month, step * (i + 1)), startAge: start, endAge: start + LUCK_SPAN - 1 });
  });
}

/** How many of the given characters belong to each phase: stems by their own phase, branches by theirs. */
export function elementBalance(pillars: readonly StemBranch[]): ReadonlyMap<Element, number> {
  const counts = new Map<Element, number>(ELEMENTS.map((e) => [e, 0]));
  for (const p of pillars) {
    for (const e of [stemElement(p.stem), branchElement(p.branch)]) counts.set(e, counts.get(e)! + 1);
  }
  return counts;
}
