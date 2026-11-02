import { Trigram } from '../almanac/almanac';
import {
  type Element,
  generates,
  controls,
  napAm,
  naYinIndex,
  stemElement,
  branchMinus,
  branchPlus,
  type Branch,
  type Stem,
  type StemBranch,
} from '../ganzhi/ganzhi';
import { mod, range } from '../util';

const BRANCHES = 12;
const STEMS = 10;
const TRINE_GAP = 4;
const TRINE_SIZE = 3;
const LEAD_REMAINDER = 2;
const HARMONY_SUM = 1;
const HARM_SUM = 7;
const FAVORABLE_COUNT = 4;

/** How two branches meet: Tam hợp, Lục hợp, Lục xung, Lục hại, or none of these (bình hòa). */
export enum BranchBond {
  TRINE,
  HARMONY,
  CLASH,
  HARM,
  NEUTRAL,
}

export function branchBondOf(a: Branch, b: Branch): BranchBond {
  const sum = (a + b) % BRANCHES;
  const gap = branchMinus(a, b);
  if (gap === TRINE_GAP || gap === BRANCHES - TRINE_GAP) return BranchBond.TRINE;
  if (sum === HARMONY_SUM) return BranchBond.HARMONY;
  if (gap === BRANCHES / 2) return BranchBond.CLASH;
  if (sum === HARM_SUM) return BranchBond.HARM;
  return BranchBond.NEUTRAL;
}

/** The Tam hợp group [branch] belongs to, led by its growth branch: Thân Tý Thìn, Hợi Mão Mùi… */
export function trineGroup(branch: Branch): Branch[] {
  const lead = range(TRINE_SIZE)
    .map((i) => branchPlus(branch, i * TRINE_GAP))
    .find((b) => b % TRINE_SIZE === LEAD_REMAINDER)!;
  return range(TRINE_SIZE).map((i) => branchPlus(lead, i * TRINE_GAP));
}

/** How the first element meets the second in the generating and controlling cycles. */
export enum ElementBond {
  SAME,
  GENERATES,
  GENERATED_BY,
  CONTROLS,
  CONTROLLED_BY,
}

export const isSupportiveBond = (bond: ElementBond): boolean =>
  bond === ElementBond.SAME || bond === ElementBond.GENERATES || bond === ElementBond.GENERATED_BY;

export function elementBondOf(a: Element, b: Element): ElementBond {
  if (a === b) return ElementBond.SAME;
  if (generates(a) === b) return ElementBond.GENERATES;
  if (generates(b) === a) return ElementBond.GENERATED_BY;
  if (controls(a) === b) return ElementBond.CONTROLS;
  return ElementBond.CONTROLLED_BY;
}

/** Two stems either combine (Giáp–Kỷ, Ất–Canh…) or meet through their elements. */
export interface StemBond {
  readonly combines: boolean;
  readonly elements: ElementBond;
}

export const stemBondOf = (a: Stem, b: Stem): StemBond =>
  Object.freeze({ combines: mod(a - b, STEMS) === STEMS / 2, elements: elementBondOf(stemElement(a), stemElement(b)) });

/** Nạp âm of two pillars: the element bond, and whether they share the very same sound name. */
export interface NaYinBond {
  readonly sameSound: boolean;
  readonly elements: ElementBond;
}

export const naYinBondOf = (a: StemBranch, b: StemBranch): NaYinBond =>
  Object.freeze({ sameSound: naYinIndex(a) === naYinIndex(b), elements: elementBondOf(napAm(a), napAm(b)) });

/** The eight mansions of Bát trạch, the four favourable ones first. */
export enum HouseMansion {
  SHENG_QI,
  TIAN_YI,
  YAN_NIAN,
  FU_WEI,
  HUO_HAI,
  LIU_SHA,
  WU_GUI,
  JUE_MING,
}

export const isFavorableMansion = (m: HouseMansion): boolean => m < FAVORABLE_COUNT;

/** East-group trigrams are Khảm, Chấn, Tốn, Ly; the rest are West group. */
export const isEastGroup = (t: Trigram): boolean =>
  t === Trigram.KAN || t === Trigram.ZHEN || t === Trigram.XUN || t === Trigram.LI;

const BY_NUMBER: Readonly<Record<number, Trigram>> = {
  1: Trigram.KAN,
  2: Trigram.KUN,
  3: Trigram.ZHEN,
  4: Trigram.XUN,
  6: Trigram.QIAN,
  7: Trigram.DUI,
  8: Trigram.GEN,
  9: Trigram.LI,
};

/** Row per trigram (Trigram order): the trigram sitting in Sinh Khí … Tuyệt Mệnh. */
const MANSION_TABLE: readonly (readonly Trigram[])[] = [
  [4, 3, 9, 1, 7, 6, 8, 2], // KAN
  [8, 7, 6, 2, 3, 9, 4, 1], // KUN
  [9, 1, 4, 3, 2, 8, 6, 7], // ZHEN
  [1, 9, 3, 4, 6, 7, 2, 8], // XUN
  [7, 8, 2, 6, 4, 1, 3, 9], // QIAN
  [6, 2, 8, 7, 1, 4, 9, 3], // DUI
  [2, 6, 7, 8, 9, 3, 1, 4], // GEN
  [3, 4, 1, 9, 8, 2, 7, 6], // LI
].map((row) => row.map((n) => BY_NUMBER[n]!));

/** The mansion [other]'s trigram stands in, seen from [self]'s trigram; symmetric. */
export const houseMansionOf = (self: Trigram, other: Trigram): HouseMansion =>
  MANSION_TABLE[self]!.indexOf(other) as HouseMansion;

