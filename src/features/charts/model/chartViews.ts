import type { Gender } from '@/core/model';
import {
  branchPlus,
  DECADE,
  hiddenStems,
  trine,
  type Branch,
  type Bureau,
  type CivilDate,
  type DayMasterStrength,
  type Element,
  type LifeStage,
  type LuckPillar,
  type LunarDate,
  type NatalChart,
  type PalaceRole,
  type Stem,
  type StemBranch,
  type TenGod,
  type Transformation,
  type ZiWeiStar,
} from '@/engine';

/** The three charts of one person, worked out once and shown by the hub and the chart screens. */
export interface BirthCharts {
  readonly name: string;
  readonly gender: Gender;
  readonly solarDate: CivilDate;
  readonly lunarDate: LunarDate;
  /** Clock time of birth in minutes after midnight; null when unknown. */
  readonly clockMinutes: number | null;
  readonly hourBranch: Branch | null;
  readonly baZi: BaZiView;
  /** Null without a birth time: the hour places the Life palace. */
  readonly ziWei: ZiWeiView | null;
  readonly natal: NatalView;
}

/** Columns in the order the table shows them: hour, day, month, year. */
export enum PillarKind {
  HOUR,
  DAY,
  MONTH,
  YEAR,
}

/** One column of the Bát Tự table; [pillar] is null for an unknown birth hour. */
export interface PillarColumn {
  readonly kind: PillarKind;
  readonly pillar: StemBranch | null;
  /** The stem's relation to the day master; null in the day column, which is the day master. */
  readonly tenGod: TenGod | null;
  /** The day master's growth stage in this column's branch. */
  readonly lifeStage: LifeStage | null;
}

export const columnHiddenStems = (column: PillarColumn): readonly Stem[] =>
  column.pillar ? hiddenStems(column.pillar.branch) : [];

export interface BaZiView {
  readonly columns: readonly PillarColumn[];
  readonly dayMaster: Stem;
  /** Characters per element over the known pillars, strongest first. */
  readonly balance: readonly (readonly [Element, number])[];
  readonly luckStartAge: number;
  readonly luckForward: boolean;
  readonly luck: readonly LuckPillar[];
  /** Index into [luck] of the pillar running now; null before the first one starts. */
  readonly currentLuck: number | null;
  readonly strength: DayMasterStrength;
}

export const characterCount = (baZi: BaZiView): number => baZi.balance.reduce((sum, [, count]) => sum + count, 0);

/** A star in a palace with the year's transformation it carries, if any. */
export interface StarMark {
  readonly star: ZiWeiStar;
  readonly transformation: Transformation | null;
}

export interface PalaceView {
  readonly branch: Branch;
  readonly pillar: StemBranch;
  readonly role: PalaceRole;
  readonly decadeStartAge: number;
  readonly mainStars: readonly StarMark[];
  readonly luckyStars: readonly StarMark[];
  readonly maleficStars: readonly StarMark[];
  readonly isBody: boolean;
  /** Tuần: one of the two branches the birth year's decade leaves empty. */
  readonly isVoid: boolean;
  /** Triệt: cut by the birth year's stem. */
  readonly isCut: boolean;
}

export const decadeEndAge = (palace: PalaceView): number => palace.decadeStartAge + DECADE - 1;

export interface ZiWeiView {
  /** Twelve palaces indexed by branch ordinal. */
  readonly palaces: readonly PalaceView[];
  readonly lifeBranch: Branch;
  readonly bodyBranch: Branch;
  readonly bureau: Bureau;
  readonly yearPillar: StemBranch;
  /** The year's four transformations, Lộc first. */
  readonly transformations: readonly (readonly [Transformation, ZiWeiStar])[];
  /** Palace of the ten-year period running now; null before the first one starts. */
  readonly currentDecade: Branch | null;
}

const OPPOSITE_STEP = 6;

export function palaceOf(ziWei: ZiWeiView, branch: Branch): PalaceView {
  const palace = ziWei.palaces[branch];
  if (!palace) throw new Error(`no palace in branch ${branch}`);
  return palace;
}

export const lifePalaceOf = (ziWei: ZiWeiView): PalaceView => palaceOf(ziWei, ziWei.lifeBranch);

/** The two palaces that form a trine with [branch]. */
export const trineOf = (ziWei: ZiWeiView, branch: Branch): PalaceView[] => trine(branch).map((b) => palaceOf(ziWei, b));

/** The palace facing [branch] across the chart. */
export const oppositeOf = (ziWei: ZiWeiView, branch: Branch): PalaceView =>
  palaceOf(ziWei, branchPlus(branch, OPPOSITE_STEP));

/** [moonSigns] holds two signs when the birth time is unknown and the Moon changed sign that day. */
export interface NatalView {
  readonly chart: NatalChart;
  readonly hasTime: boolean;
  readonly moonSigns: readonly number[];
}

export const isMoonCertain = (natal: NatalView): boolean => natal.moonSigns.length === 1;
