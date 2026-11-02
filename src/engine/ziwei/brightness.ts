import type { Branch } from '../ganzhi/ganzhi';
import type { MainStar } from './ziwei';

/** How well a main star sits in a branch (Miếu, Vượng, Đắc, Bình, Hãm), brightest first. */
export enum Brightness {
  TEMPLE,
  PROSPEROUS,
  GAINED,
  NEUTRAL,
  DIM,
}

const BRIGHTNESS_CODES: Readonly<Record<string, Brightness>> = {
  M: Brightness.TEMPLE,
  V: Brightness.PROSPEROUS,
  D: Brightness.GAINED,
  B: Brightness.NEUTRAL,
  H: Brightness.DIM,
};

/**
 * One row per MainStar in declaration order, one letter per branch Tý … Hợi. Taken from the
 * open lasotuvi tables and cross-checked against Vietnamese references; Thiên Phủ, missing there,
 * follows tracuutuvi.
 */
const BRIGHTNESS: readonly string[] = [
  'BDMBVMMDMBVB', // Tử Vi
  'DDHMMVDDVMMH', // Thiên Cơ
  'HDVVVMMDHHHH', // Thái Dương
  'VMVDMHVMVDMH', // Vũ Khúc
  'VHMDHDHHMHHD', // Thiên Đồng
  'VDVHMHVDVHMH', // Liêm Trinh
  'MBMBVDMDMBVD', // Thiên Phủ
  'VDHHHHHDVMMM', // Thái Âm
  'HMDHVHHMDHVH', // Tham Lang
  'VHVMHHVHDMHD', // Cự Môn
  'VDMHVDVDMHVD', // Thiên Tướng
  'VDVVMHMDVHMH', // Thiên Lương
  'MDMHHVMDMHHV', // Thất Sát
  'MVHHDHMVHHDH', // Phá Quân
];

/** The star's brightness in [branch]. */
export function brightnessIn(star: MainStar, branch: Branch): Brightness {
  return BRIGHTNESS_CODES[BRIGHTNESS[star]!.charAt(branch)]!;
}
