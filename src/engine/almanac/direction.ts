import type { Stem } from '../ganzhi/ganzhi';

/** The eight compass directions, clockwise from north. */
export enum Direction {
  NORTH,
  NORTH_EAST,
  EAST,
  SOUTH_EAST,
  SOUTH,
  SOUTH_WEST,
  WEST,
  NORTH_WEST,
}

const JOY_BY_STEM_PAIR: readonly Direction[] = [
  Direction.NORTH_EAST, // Giáp, Kỷ
  Direction.NORTH_WEST, // Ất, Canh
  Direction.SOUTH_WEST, // Bính, Tân
  Direction.SOUTH, // Đinh, Nhâm
  Direction.SOUTH_EAST, // Mậu, Quý
];

/** Direction of the Joy spirit (Hỷ thần) on a day with stem [dayStem]; stems five apart share it. */
export const joyDirection = (dayStem: Stem): Direction => JOY_BY_STEM_PAIR[dayStem % JOY_BY_STEM_PAIR.length]!;
