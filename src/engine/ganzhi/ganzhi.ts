import { idiv, mod, require } from '../util';

/** The five phases (Ngũ hành). */
export enum Element {
  WOOD,
  FIRE,
  EARTH,
  METAL,
  WATER,
}
export const ELEMENTS: readonly Element[] = [Element.WOOD, Element.FIRE, Element.EARTH, Element.METAL, Element.WATER];

/** The phase this one feeds in the generating cycle (Tương sinh): Wood → Fire → … → Wood. */
export const generates = (e: Element): Element => mod(e + 1, 5);
/** The phase that feeds this one. */
export const generatedBy = (e: Element): Element => mod(e - 1, 5);
/** The phase this one restrains in the controlling cycle (Tương khắc): Wood → Earth, Fire → Metal… */
export const controls = (e: Element): Element => mod(e + 2, 5);
/** The phase that restrains this one: Metal restrains Wood, Water restrains Fire… */
export const controlledBy = (e: Element): Element => mod(e - 2, 5);

/** Heavenly stems (Thiên can), Giáp … Quý. Display names live in i18n resources. */
export enum Stem {
  JIA,
  YI,
  BING,
  DING,
  WU,
  JI,
  GENG,
  XIN,
  REN,
  GUI,
}
export const STEMS: readonly Stem[] = Array.from({ length: 10 }, (_, i) => i as Stem);

export const stemOf = (index: number): Stem => mod(index, 10);
export const stemIsYang = (s: Stem): boolean => s % 2 === 0;
export const stemElement = (s: Stem): Element => idiv(s, 2);
export const stemPlus = (s: Stem, steps: number): Stem => stemOf(s + steps);

/** Earthly branches (Địa chi), Tý … Hợi. */
export enum Branch {
  ZI,
  CHOU,
  YIN,
  MAO,
  CHEN,
  SI,
  WU,
  WEI,
  SHEN,
  YOU,
  XU,
  HAI,
}
export const BRANCHES: readonly Branch[] = Array.from({ length: 12 }, (_, i) => i as Branch);

export const branchOf = (index: number): Branch => mod(index, 12);
export const branchPlus = (b: Branch, steps: number): Branch => branchOf(b + steps);
/** The opposite branch (Lục xung), six steps away: Tý–Ngọ, Dần–Thân… */
export const branchClash = (b: Branch): Branch => branchPlus(b, 6);
/** Steps from [other] forward to [b], 0..11 (Kotlin `b - other`). */
export const branchMinus = (b: Branch, other: Branch): number => mod(b - other, 12);

const BRANCH_ELEMENTS: readonly Element[] = [
  Element.WATER, Element.EARTH, Element.WOOD, Element.WOOD, Element.EARTH, Element.FIRE,
  Element.FIRE, Element.EARTH, Element.METAL, Element.METAL, Element.EARTH, Element.WATER,
];
/** The branch's own phase: Tý Water, Sửu Earth, Dần Wood… (the four corners are Earth). */
export const branchElement = (b: Branch): Element => BRANCH_ELEMENTS[b]!;

/** A stem–branch pair (Can chi), e.g. Giáp Tý. */
export interface StemBranch {
  readonly stem: Stem;
  readonly branch: Branch;
}

const CYCLE = 60;
const NAP_AM_CYCLE = 5;
// 6·stem − 5·branch is the one index in 0..59 that is ≡ stem (mod 10) and ≡ branch (mod 12).
const STEM_STEP = 6;
const BRANCH_STEP = 5;
const NAP_AM_ELEMENTS: readonly Element[] = [Element.WOOD, Element.METAL, Element.WATER, Element.FIRE, Element.EARTH];

export function stemBranch(stem: Stem, branch: Branch): StemBranch {
  // Only the 60 pairs of the sexagenary cycle exist: yang stems with yang branches, yin with yin.
  require(stem % 2 === branch % 2, `not a sexagenary pair: ${stem} ${branch}`);
  return Object.freeze({ stem, branch });
}

export const sameStemBranch = (a: StemBranch, b: StemBranch): boolean => a.stem === b.stem && a.branch === b.branch;

/** Position in the 60-pair cycle: Giáp Tý 0, Ất Sửu 1 … Quý Hợi 59. */
export const cycleIndex = (p: StemBranch): number => mod(STEM_STEP * p.stem - BRANCH_STEP * p.branch, CYCLE);

/** The pair at [index] of the 60-pair cycle. */
export const stemBranchAt = (index: number): StemBranch => stemBranch(stemOf(index), branchOf(index));

/** Which of the 30 Nạp âm "sounds" this pair shares with its neighbour (two pairs each). */
export const naYinIndex = (p: StemBranch): number => idiv(cycleIndex(p), 2);

/** The pair [steps] further along the 60-pair cycle. */
export const stemBranchPlus = (p: StemBranch, steps: number): StemBranch =>
  stemBranch(stemPlus(p.stem, steps), branchPlus(p.branch, steps));

/** Element of the sexagenary pair's "sound" (Nạp âm). */
export function napAm(p: StemBranch): Element {
  let s = idiv(p.stem, 2) + 1 + idiv(p.branch % 6, 2) + 1;
  while (s > NAP_AM_CYCLE) s -= NAP_AM_CYCLE;
  return NAP_AM_ELEMENTS[s - 1]!;
}
