import { idiv, mod } from '../util';

/**
 * The nine stars said to watch over each year of life (Cửu Diệu, sao chiếu mệnh): La Hầu, Thổ Tú,
 * Thủy Diệu, Thái Bạch, Thái Dương, Vân Hớn, Kế Đô, Thái Âm, Mộc Đức.
 */
export enum NineStar {
  LA_HAU,
  THO_TU,
  THUY_DIEU,
  THAI_BACH,
  THAI_DUONG,
  VAN_HON,
  KE_DO,
  THAI_AM,
  MOC_DUC,
}
const NINE_STAR_COUNT = 9;
const FEMALE_ROUND: readonly NineStar[] = [
  NineStar.KE_DO,
  NineStar.VAN_HON,
  NineStar.MOC_DUC,
  NineStar.THAI_AM,
  NineStar.THO_TU,
  NineStar.LA_HAU,
  NineStar.THAI_DUONG,
  NineStar.THAI_BACH,
  NineStar.THUY_DIEU,
];

/** The star for a folk age (tuổi mụ); men and women start the round at different stars. */
export function nineStarOf(folkAge: number, isMale: boolean): NineStar {
  const step = mod(folkAge - 1, NINE_STAR_COUNT);
  return isMale ? (step as NineStar) : FEMALE_ROUND[step]!;
}

/** Kim Lâu, consulted before building a house or a wedding: whom the year is said to touch. */
export enum KimLau {
  SELF,
  SPOUSE,
  CHILDREN,
  LIVESTOCK,
}
const KIM_LAU_CYCLE = 9;

/** Remainder of the folk age by nine: 1 self, 3 spouse, 6 children, 8 livestock; else clear. */
export function kimLauOf(folkAge: number): KimLau | null {
  switch (mod(folkAge, KIM_LAU_CYCLE)) {
    case 1:
      return KimLau.SELF;
    case 3:
      return KimLau.SPOUSE;
    case 6:
      return KimLau.CHILDREN;
    case 8:
      return KimLau.LIVESTOCK;
    default:
      return null;
  }
}

/**
 * Hoang Ốc, consulted before building a house: six palaces counted from age 10 (Nhất Cát), one per
 * decade, then one per year past the decade. Cát, Nghi and Tấn Tài are the favoured three.
 */
export enum HoangOc {
  NHAT_CAT,
  NHI_NGHI,
  TAM_DIA_SAT,
  TU_TAN_TAI,
  NGU_THO_TU,
  LUC_HOANG_OC,
}
const HOANG_OC_FAVOURED: readonly boolean[] = [true, true, false, true, false, false];
export const isFavouredHoangOc = (h: HoangOc): boolean => HOANG_OC_FAVOURED[h]!;
const FIRST_AGE = 10;

/** Null under age 10, where the count does not reach. */
export function hoangOcOf(folkAge: number): HoangOc | null {
  if (folkAge < FIRST_AGE) return null;
  return mod(idiv(folkAge, FIRST_AGE) - 1 + (folkAge % FIRST_AGE), HOANG_OC_FAVOURED.length) as HoangOc;
}
