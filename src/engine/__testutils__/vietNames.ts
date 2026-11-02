import type { Branch, StemBranch } from '../ganzhi/ganzhi';

/** Vietnamese names so test vectors read exactly like the spec (TAI-LIEU-DAC-TA-APP.md). */
export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
export const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;

export const vi = (p: StemBranch): string => `${CAN[p.stem]} ${CHI[p.branch]}`;
export const viBranch = (b: Branch): string => CHI[b]!;

export function expectNear(actual: number, expected: number, tolerance: number): void {
  if (Math.abs(expected - actual) > tolerance) {
    throw new Error(`expected ${expected} ± ${tolerance}, got ${actual}`);
  }
}
