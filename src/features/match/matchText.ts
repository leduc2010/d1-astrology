/* Display text for the match pages. Arrays are kept in enum order, one item per entry. */

import { branchName, itemOf, naYinName, stemBranchName, stemName, type UiText } from '@/core/ui';
import { OrtusColors, TagTone } from '@/designsystem';
import {
  AxisLevel,
  BaZiCriterion,
  MatchMark,
  type BranchBond,
  type HouseMansion,
  type NaYinBond,
  type SynastryAxis,
} from '@/engine';

import type { MatchPoint, MatchReport } from './matchReport';

export const axisName = (t: UiText, axis: SynastryAxis): string => itemOf(t.ta('match_axes'), axis);

export const levelName = (t: UiText, level: AxisLevel): string => itemOf(t.ta('match_levels'), level);

export const markName = (t: UiText, mark: MatchMark): string => itemOf(t.ta('match_marks'), mark);

const LEVEL_COLORS: Readonly<Record<AxisLevel, string>> = {
  [AxisLevel.QUIET]: OrtusColors.textMuted,
  [AxisLevel.NEEDS_CARE]: OrtusColors.inauspicious.content,
  [AxisLevel.MODERATE]: OrtusColors.textMuted,
  [AxisLevel.WARM]: OrtusColors.auspicious.content,
  [AxisLevel.STRONG]: OrtusColors.auspicious.content,
};

/** Warm levels read in green, the one asking for care in red, the rest stay muted. */
export const levelColor = (level: AxisLevel): string => LEVEL_COLORS[level];

const MARK_TONES: Readonly<Record<MatchMark, TagTone>> = {
  [MatchMark.GOOD]: TagTone.Auspicious,
  [MatchMark.NEUTRAL]: TagTone.Neutral,
  [MatchMark.CARE]: TagTone.Gold,
};

export const markTone = (mark: MatchMark): TagTone => MARK_TONES[mark];

/** "Year stems Ất – Giáp": the criterion named with both people's values where it has them. */
export function criterionTitle(t: UiText, criterion: BaZiCriterion, report: MatchReport): string {
  const a = report.first.pillars;
  const b = report.second.pillars;
  switch (criterion) {
    case BaZiCriterion.YEAR_STEMS:
      return t.tf('match_criterion_year_stems', stemName(t, a.year.stem), stemName(t, b.year.stem));
    case BaZiCriterion.ELEMENT_SUPPORT:
      return t.tf('match_criterion_elements');
    case BaZiCriterion.YEAR_BRANCHES:
      return t.tf('match_criterion_year_branches', branchName(t, a.year.branch), branchName(t, b.year.branch));
    case BaZiCriterion.DAY_PILLARS:
      return t.tf('match_criterion_day_pillars', stemBranchName(t, a.day), stemBranchName(t, b.day));
  }
}

/** "Hợi – Tuất bình hòa", from the folk years (by Tết). */
export const branchBondText = (t: UiText, bond: BranchBond, report: MatchReport): string =>
  t.tf(
    'match_branch_bond',
    branchName(t, report.first.lunarYear.branch),
    branchName(t, report.second.lunarYear.branch),
    itemOf(t.ta('match_branch_bonds'), bond),
  );

/** "Cùng Sơn Đầu Hỏa" when both years share a nạp âm, else how the two sounds' elements meet. */
export const naYinText = (t: UiText, bond: NaYinBond, report: MatchReport): string =>
  bond.sameSound
    ? t.tf('match_nayin_same', naYinName(t, report.first.lunarYear))
    : itemOf(t.ta('match_nayin_bonds'), bond.elements);

export const mansionText = (t: UiText, mansion: HouseMansion): string =>
  t.tf('match_mansion', itemOf(t.ta('match_mansions'), mansion), itemOf(t.ta('match_mansion_glosses'), mansion));

/** One line of the strengths / points-of-care cards. */
export function pointText(t: UiText, point: MatchPoint, report: MatchReport): string {
  switch (point.kind) {
    case 'Axis':
      return t.tf('match_point', axisName(t, point.axis), levelName(t, point.level));
    case 'Criterion':
      return t.tf('match_point', criterionTitle(t, point.criterion, report), markName(t, point.mark));
    case 'Branches':
      return branchBondText(t, point.bond, report);
    case 'NaYin':
      return naYinText(t, point.bond, report);
    case 'Mansion':
      return mansionText(t, point.mansion);
  }
}
