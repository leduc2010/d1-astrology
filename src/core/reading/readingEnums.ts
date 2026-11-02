/* Enums shared by readings and their details; kept apart so neither file imports the other at load. */

/** The six life topics a reading covers (S05-01). */
export enum Topic {
  PERSONALITY,
  CAREER,
  LOVE,
  MONEY,
  FAMILY,
  WELLBEING,
}
export const TOPICS: readonly Topic[] = [
  Topic.PERSONALITY,
  Topic.CAREER,
  Topic.LOVE,
  Topic.MONEY,
  Topic.FAMILY,
  Topic.WELLBEING,
];

/**
 * The broad temperament a signal points to. Every system's signal is folded into one of these so
 * the three can be compared: drive (fire), steadiness (earth, metal), brightness (air, wood), depth (water).
 */
export enum Tone {
  DRIVE,
  STEADY,
  BRIGHT,
  DEEP,
}

/** The three systems, in the order the app lists them. */
export enum ReadingSystem {
  ZIWEI,
  BAZI,
  WESTERN,
}
export const READING_SYSTEMS: readonly ReadingSystem[] = [ReadingSystem.ZIWEI, ReadingSystem.BAZI, ReadingSystem.WESTERN];

export enum BaZiSignal {
  DAY_MASTER,
  MONTH_STEM,
  DAY_BRANCH,
  WEALTH_ELEMENT,
  YEAR_BRANCH,
  STRONGEST_ELEMENT,
}
