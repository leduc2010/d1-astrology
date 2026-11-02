import {
  Branch,
  branchMinus,
  branchOf,
  branchPlus,
  Element,
  napAm,
  stemBranch,
  stemIsYang,
  stemOf,
  stemPlus,
  type Stem,
  type StemBranch,
} from '../ganzhi/ganzhi';
import { idiv, require } from '../util';

/** The five bureaus (Cục); [bureauNumber] is the age the first decade starts. */
export enum Bureau {
  WATER_2,
  WOOD_3,
  METAL_4,
  EARTH_5,
  FIRE_6,
}
const BUREAU_NUMBER: readonly number[] = [2, 3, 4, 5, 6];
export const bureauNumber = (b: Bureau): number => BUREAU_NUMBER[b]!;

export function bureauOf(element: Element): Bureau {
  switch (element) {
    case Element.WATER:
      return Bureau.WATER_2;
    case Element.WOOD:
      return Bureau.WOOD_3;
    case Element.METAL:
      return Bureau.METAL_4;
    case Element.EARTH:
      return Bureau.EARTH_5;
    case Element.FIRE:
      return Bureau.FIRE_6;
  }
}

/** The 14 main stars, each placed at a fixed offset from Tử Vi or Thiên Phủ. */
export enum MainStar {
  ZI_WEI,
  TIAN_JI,
  TAI_YANG,
  WU_QU,
  TIAN_TONG,
  LIAN_ZHEN,
  TIAN_FU,
  TAI_YIN,
  TAN_LANG,
  JU_MEN,
  TIAN_XIANG,
  TIAN_LIANG,
  QI_SHA,
  PO_JUN,
}
export const MAIN_STARS: readonly MainStar[] = Array.from({ length: 14 }, (_, i) => i as MainStar);

const enum Anchor {
  ZI_WEI,
  TIAN_FU,
}
interface MainStarSpec {
  readonly anchor: Anchor;
  readonly offset: number;
  readonly element: Element;
}
const MAIN_STAR_SPECS: readonly MainStarSpec[] = [
  { anchor: Anchor.ZI_WEI, offset: 0, element: Element.EARTH },
  { anchor: Anchor.ZI_WEI, offset: -1, element: Element.WOOD },
  { anchor: Anchor.ZI_WEI, offset: -3, element: Element.FIRE },
  { anchor: Anchor.ZI_WEI, offset: -4, element: Element.METAL },
  { anchor: Anchor.ZI_WEI, offset: -5, element: Element.WATER },
  { anchor: Anchor.ZI_WEI, offset: -8, element: Element.FIRE },
  { anchor: Anchor.TIAN_FU, offset: 0, element: Element.EARTH },
  { anchor: Anchor.TIAN_FU, offset: 1, element: Element.WATER },
  { anchor: Anchor.TIAN_FU, offset: 2, element: Element.WATER },
  { anchor: Anchor.TIAN_FU, offset: 3, element: Element.WATER },
  { anchor: Anchor.TIAN_FU, offset: 4, element: Element.WATER },
  { anchor: Anchor.TIAN_FU, offset: 5, element: Element.WOOD }, // Vietnamese schools; Chinese texts give Earth.
  { anchor: Anchor.TIAN_FU, offset: 6, element: Element.METAL },
  { anchor: Anchor.TIAN_FU, offset: 10, element: Element.WATER },
];
export const mainStarElement = (s: MainStar): Element => MAIN_STAR_SPECS[s]!.element;

/**
 * The minor stars this app places: lucky ones (Tả Phù, Hữu Bật, Văn Xương, Văn Khúc, Thiên Khôi,
 * Thiên Việt, Lộc Tồn) and malefic ones (Kình Dương, Đà La, Địa Không, Địa Kiếp).
 */
export enum MinorStar {
  LEFT_ASSISTANT,
  RIGHT_ASSISTANT,
  LITERARY_STAR,
  LITERARY_ART,
  HEAVENLY_LEADER,
  HEAVENLY_HONOR,
  PROSPERITY,
  SHEEP_BLADE,
  SPINNING_TOP,
  EARTH_VOID,
  EARTH_ROBBERY,
}
export const MINOR_STARS: readonly MinorStar[] = Array.from({ length: 11 }, (_, i) => i as MinorStar);
export const isLuckyMinorStar = (s: MinorStar): boolean => s <= MinorStar.PROSPERITY;

/** Any star placed on the Tử Vi chart. Instances are canonical, so they work as Map keys. */
export type ZiWeiStar =
  | { readonly kind: 'main'; readonly star: MainStar }
  | { readonly kind: 'minor'; readonly star: MinorStar };

const MAIN_STAR_REFS: readonly ZiWeiStar[] = MAIN_STARS.map((star) => Object.freeze({ kind: 'main' as const, star }));
const MINOR_STAR_REFS: readonly ZiWeiStar[] = MINOR_STARS.map((star) => Object.freeze({ kind: 'minor' as const, star }));
export const mainStarRef = (s: MainStar): ZiWeiStar => MAIN_STAR_REFS[s]!;
export const minorStarRef = (s: MinorStar): ZiWeiStar => MINOR_STAR_REFS[s]!;

/** The twelve palaces, counted from Mệnh against the order of the branches. */
export enum PalaceRole {
  LIFE,
  SIBLINGS,
  SPOUSE,
  CHILDREN,
  WEALTH,
  HEALTH,
  TRAVEL,
  FRIENDS,
  CAREER,
  PROPERTY,
  FORTUNE,
  PARENTS,
}
export const PALACE_ROLES: readonly PalaceRole[] = Array.from({ length: 12 }, (_, i) => i as PalaceRole);

/** The four transformations (Tứ Hóa) the year stem puts on four stars: Lộc, Quyền, Khoa, Kỵ. */
export enum Transformation {
  PROSPERITY,
  POWER,
  FAME,
  OBSTACLE,
}

/** Birth data in the lunar calendar as Tử Vi needs it. [lunarMonth] 1..12, [lunarDay] 1..30. */
export interface ZiWeiInput {
  readonly yearStem: Stem;
  readonly lunarMonth: number;
  readonly lunarDay: number;
  readonly hour: Branch;
  readonly isMale: boolean;
}

export function ziWeiInput(yearStem: Stem, lunarMonth: number, lunarDay: number, hour: Branch, isMale: boolean): ZiWeiInput {
  require(lunarMonth >= 1 && lunarMonth <= 12, `lunarMonth out of range: ${lunarMonth}`);
  require(lunarDay >= 1 && lunarDay <= 30, `lunarDay out of range: ${lunarDay}`);
  return Object.freeze({ yearStem, lunarMonth, lunarDay, hour, isMale });
}

export const DECADE = 10;

export interface ZiWeiChart {
  readonly lifePalace: StemBranch;
  readonly bodyPalace: Branch;
  readonly bureau: Bureau;
  readonly mainStars: ReadonlyMap<MainStar, Branch>;
  readonly minorStars: ReadonlyMap<MinorStar, Branch>;
  /** Tứ Hóa of the birth year: which star carries which transformation. */
  readonly transformations: ReadonlyMap<ZiWeiStar, Transformation>;
  readonly yearStem: Stem;
  readonly isForward: boolean;
}

/** Which palace sits in [branch]. */
export const roleOf = (chart: ZiWeiChart, branch: Branch): PalaceRole => branchMinus(chart.lifePalace.branch, branch);

/** The branch holding [role]. */
export const branchOfRole = (chart: ZiWeiChart, role: PalaceRole): Branch => branchPlus(chart.lifePalace.branch, -role);

/** Stem and branch of the palace in [branch]. */
export const palaceAt = (chart: ZiWeiChart, branch: Branch): StemBranch => palace(chart.yearStem, branch);

/** Main stars in [branch], in chart order. */
export const mainStarsIn = (chart: ZiWeiChart, branch: Branch): MainStar[] =>
  [...chart.mainStars].filter(([, b]) => b === branch).map(([s]) => s);

/** Minor stars in [branch], in chart order. */
export const minorStarsIn = (chart: ZiWeiChart, branch: Branch): MinorStar[] =>
  [...chart.minorStars].filter(([, b]) => b === branch).map(([s]) => s);

/** First nominal age of the 10-year period (Đại hạn) spent in [branch]. */
export function decadeStartAge(chart: ZiWeiChart, branch: Branch): number {
  const steps = chart.isForward ? branchMinus(branch, chart.lifePalace.branch) : branchMinus(chart.lifePalace.branch, branch);
  return bureauNumber(chart.bureau) + DECADE * steps;
}

/** Palace of the 10-year period (Đại hạn) covering nominal [age], or null before the first period. */
export function decadePalace(chart: ZiWeiChart, age: number): StemBranch | null {
  const start = bureauNumber(chart.bureau);
  if (age < start) return null;
  const step = idiv(age - start, DECADE);
  return palace(chart.yearStem, branchPlus(chart.lifePalace.branch, chart.isForward ? step : -step));
}

const TIAN_FU_AXIS = 4;
const TRINE_STEP = 4;
const CUT_STEP = 2;
const CUT_GROUPS = 5;
const STEM_COUNT = 10;
const YIN_STEMS: readonly number[] = [2, 4, 6, 8, 0];

// Lộc Tồn by year stem: Giáp Dần, Ất Mão, Bính/Mậu Tỵ, Đinh/Kỷ Ngọ, Canh Thân, Tân Dậu, Nhâm Hợi, Quý Tý.
const PROSPERITY_BRANCH: readonly Branch[] = [
  Branch.YIN, Branch.MAO, Branch.SI, Branch.WU, Branch.SI,
  Branch.WU, Branch.SHEN, Branch.YOU, Branch.HAI, Branch.ZI,
];

// Thiên Khôi / Thiên Việt by year stem (Vietnamese table):
// Giáp Mậu Sửu–Mùi, Ất Kỷ Tý–Thân, Bính Đinh Hợi–Dậu, Canh Tân Ngọ–Dần, Nhâm Quý Mão–Tỵ.
const NOBLE_BRANCHES: readonly (readonly [Branch, Branch])[] = [
  [Branch.CHOU, Branch.WEI], [Branch.ZI, Branch.SHEN], [Branch.HAI, Branch.YOU], [Branch.HAI, Branch.YOU],
  [Branch.CHOU, Branch.WEI], [Branch.ZI, Branch.SHEN], [Branch.WU, Branch.YIN], [Branch.WU, Branch.YIN],
  [Branch.MAO, Branch.SI], [Branch.MAO, Branch.SI],
];

const M = mainStarRef;
const N = minorStarRef;
// Lộc, Quyền, Khoa, Kỵ for each year stem Giáp … Quý.
const TRANSFORMATIONS: readonly (readonly ZiWeiStar[])[] = [
  [M(MainStar.LIAN_ZHEN), M(MainStar.PO_JUN), M(MainStar.WU_QU), M(MainStar.TAI_YANG)],
  [M(MainStar.TIAN_JI), M(MainStar.TIAN_LIANG), M(MainStar.ZI_WEI), M(MainStar.TAI_YIN)],
  [M(MainStar.TIAN_TONG), M(MainStar.TIAN_JI), N(MinorStar.LITERARY_STAR), M(MainStar.LIAN_ZHEN)],
  [M(MainStar.TAI_YIN), M(MainStar.TIAN_TONG), M(MainStar.TIAN_JI), M(MainStar.JU_MEN)],
  [M(MainStar.TAN_LANG), M(MainStar.TAI_YIN), N(MinorStar.RIGHT_ASSISTANT), M(MainStar.TIAN_JI)],
  [M(MainStar.WU_QU), M(MainStar.TAN_LANG), M(MainStar.TIAN_LIANG), N(MinorStar.LITERARY_ART)],
  [M(MainStar.TAI_YANG), M(MainStar.WU_QU), M(MainStar.TAI_YIN), M(MainStar.TIAN_TONG)],
  [M(MainStar.JU_MEN), M(MainStar.TAI_YANG), N(MinorStar.LITERARY_ART), N(MinorStar.LITERARY_STAR)],
  [M(MainStar.TIAN_LIANG), M(MainStar.ZI_WEI), N(MinorStar.LEFT_ASSISTANT), M(MainStar.WU_QU)],
  [M(MainStar.PO_JUN), M(MainStar.JU_MEN), M(MainStar.TAI_YIN), M(MainStar.TAN_LANG)],
];

/** Tử Vi Đẩu Số: palaces, bureau, the 14 main stars, a set of minor stars and Tứ Hóa. */
export function ziWeiChart(input: ZiWeiInput): ZiWeiChart {
  const monthStep = input.lunarMonth - 1;
  const life = branchPlus(Branch.YIN, monthStep - input.hour);
  const body = branchPlus(Branch.YIN, monthStep + input.hour);
  const lifePalace = palace(input.yearStem, life);
  const bureau = bureauOf(napAm(lifePalace));
  const ziWei = ziWeiPosition(input.lunarDay, bureau);
  const tianFu = branchOf(TIAN_FU_AXIS - ziWei);
  const stars = new Map<MainStar, Branch>(
    MAIN_STARS.map((star) => {
      const spec = MAIN_STAR_SPECS[star]!;
      const anchor = spec.anchor === Anchor.ZI_WEI ? ziWei : tianFu;
      return [star, branchPlus(anchor, spec.offset)] as const;
    }),
  );
  return Object.freeze({
    lifePalace,
    bodyPalace: body,
    bureau,
    mainStars: stars,
    minorStars: minorStars(input),
    transformations: transformations(input.yearStem),
    yearStem: input.yearStem,
    isForward: stemIsYang(input.yearStem) === input.isMale,
  });
}

/** Stem of a palace from the year stem (Ngũ hổ độn: the Dần palace stem). */
export function palace(yearStem: Stem, branch: Branch): StemBranch {
  const yinStem = stemOf(YIN_STEMS[yearStem % YIN_STEMS.length]!);
  return stemBranch(stemPlus(yinStem, branchMinus(branch, Branch.YIN)), branch);
}

/** Branch of the Tử Vi star from lunar day and bureau. */
export function ziWeiPosition(lunarDay: number, bureau: Bureau): Branch {
  const cuc = bureauNumber(bureau);
  let borrowed = 0;
  while ((lunarDay + borrowed) % cuc !== 0) borrowed++;
  const quotient = idiv(lunarDay + borrowed, cuc);
  const adjust = borrowed % 2 === 1 ? -borrowed : borrowed;
  return branchPlus(Branch.YIN, quotient - 1 + adjust);
}

/** The two palaces in a trine with [branch] (Tam hợp), four steps either way. */
export const trine = (branch: Branch): Branch[] => [branchPlus(branch, TRINE_STEP), branchPlus(branch, -TRINE_STEP)];

/** Tuần: the two branches the year's ten-day group leaves without a stem. Giáp Tý year → Tuất, Hợi. */
export function voidBranches(year: StemBranch): Branch[] {
  const first = branchPlus(year.branch, STEM_COUNT - year.stem);
  return [first, branchPlus(first, 1)];
}

/** Triệt: the pair of branches cut by the year stem. Giáp/Kỷ → Thân, Dậu … Mậu/Quý → Tý, Sửu. */
export function cutBranches(yearStem: Stem): Branch[] {
  const first = branchPlus(Branch.SHEN, -CUT_STEP * (yearStem % CUT_GROUPS));
  return [first, branchPlus(first, 1)];
}

/** Tứ Hóa of [yearStem]: Lộc, Quyền, Khoa and Kỵ, one star each. */
export function transformations(yearStem: Stem): ReadonlyMap<ZiWeiStar, Transformation> {
  return new Map(TRANSFORMATIONS[yearStem]!.map((star, i) => [star, i as Transformation] as const));
}

function minorStars(input: ZiWeiInput): ReadonlyMap<MinorStar, Branch> {
  const month = input.lunarMonth - 1;
  const hour: number = input.hour;
  const prosperity = PROSPERITY_BRANCH[input.yearStem]!;
  const [leader, honor] = NOBLE_BRANCHES[input.yearStem]!;
  return new Map<MinorStar, Branch>([
    [MinorStar.LEFT_ASSISTANT, branchPlus(Branch.CHEN, month)],
    [MinorStar.RIGHT_ASSISTANT, branchPlus(Branch.XU, -month)],
    [MinorStar.LITERARY_STAR, branchPlus(Branch.XU, -hour)],
    [MinorStar.LITERARY_ART, branchPlus(Branch.CHEN, hour)],
    [MinorStar.HEAVENLY_LEADER, leader],
    [MinorStar.HEAVENLY_HONOR, honor],
    [MinorStar.PROSPERITY, prosperity],
    [MinorStar.SHEEP_BLADE, branchPlus(prosperity, 1)],
    [MinorStar.SPINNING_TOP, branchPlus(prosperity, -1)],
    [MinorStar.EARTH_VOID, branchPlus(Branch.HAI, -hour)],
    [MinorStar.EARTH_ROBBERY, branchPlus(Branch.HAI, hour)],
  ]);
}
