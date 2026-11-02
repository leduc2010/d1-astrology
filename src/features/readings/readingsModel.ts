import { resolveBirth } from '@/core/data';
import type { BirthProfile } from '@/core/model';
import { factFor, readingCharts, Readings, ReadingSystem, Topic, type TopicReading } from '@/core/reading';

/** How the readings are read: all three systems together, or one system on its own. */
export enum ReadingLens {
  COMBINED = 'COMBINED',
  ZIWEI = 'ZIWEI',
  BAZI = 'BAZI',
  WESTERN = 'WESTERN',
}

/** Lenses in Kotlin ordinal order, matching the `readings_lenses` array. */
export const READING_LENSES: readonly ReadingLens[] = [
  ReadingLens.COMBINED,
  ReadingLens.ZIWEI,
  ReadingLens.BAZI,
  ReadingLens.WESTERN,
];

const LENS_SYSTEMS: Readonly<Record<ReadingLens, ReadingSystem | null>> = {
  [ReadingLens.COMBINED]: null,
  [ReadingLens.ZIWEI]: ReadingSystem.ZIWEI,
  [ReadingLens.BAZI]: ReadingSystem.BAZI,
  [ReadingLens.WESTERN]: ReadingSystem.WESTERN,
};

/** The one system a lens reads through, or null for the combined lens. */
export const lensSystem = (lens: ReadingLens): ReadingSystem | null => LENS_SYSTEMS[lens];

export type ReadingsReady = {
  readonly kind: 'Ready';
  readonly readings: readonly TopicReading[];
  readonly lens: ReadingLens;
  /** The topics the owner already answered "does this ring true?" for. */
  readonly feedbackSent: readonly Topic[];
};

export type ReadingsUiState =
  | { readonly kind: 'Loading' }
  | { readonly kind: 'NoProfile' }
  /** The profile could not be turned into charts (a date outside the supported range). */
  | { readonly kind: 'Unavailable' }
  | ReadingsReady;

/**
 * The owner's readings as loaded: undefined while the profile loads, null without a profile,
 * otherwise the six readings (null when the birth cannot be charted).
 */
export type ReadingsLoad = undefined | null | { readonly readings: readonly TopicReading[] | null };

/** Works out the six readings for [profile]; the RN form of the view model's `map { runCatching }`. */
export function readingsLoadOf(profile: BirthProfile | null | undefined): ReadingsLoad {
  if (profile === undefined || profile === null) return profile;
  try {
    return Object.freeze({ readings: Object.freeze(Readings.all(readingCharts(resolveBirth(profile)))) });
  } catch {
    return Object.freeze({ readings: null });
  }
}

export function readingsUiState(load: ReadingsLoad, lens: ReadingLens, feedbackSent: readonly Topic[]): ReadingsUiState {
  if (load === undefined) return { kind: 'Loading' };
  if (load === null) return { kind: 'NoProfile' };
  if (load.readings === null) return { kind: 'Unavailable' };
  return Object.freeze({ kind: 'Ready', readings: load.readings, lens, feedbackSent });
}

/** Tử Vi needs the birth hour; without it every topic reads from two systems. */
export const hasZiWei = (ready: ReadingsReady): boolean =>
  ready.readings.some((it) => factFor(it, ReadingSystem.ZIWEI) !== null);

export function readingOf(ready: ReadingsReady, topic: Topic): TopicReading {
  const reading = ready.readings.find((it) => it.topic === topic);
  if (!reading) throw new Error(`no reading for topic ${Topic[topic]}`);
  return reading;
}

/** [sent] plus [topic], as a set: each topic at most once. */
export const withFeedback = (sent: readonly Topic[], topic: Topic): readonly Topic[] =>
  sent.includes(topic) ? sent : Object.freeze([...sent, topic]);

/** The route key of [topic] (the enum name, as Kotlin's serialized route). */
export const topicKey = (topic: Topic): string => Topic[topic];

/** [key] back to a topic, or null when it names none (a stale or hand-typed link). */
export function parseTopic(key: string | undefined): Topic | null {
  if (key === undefined) return null;
  const value: unknown = (Topic as unknown as Record<string, unknown>)[key];
  return typeof value === 'number' ? (value as Topic) : null;
}

/** [key] back to a lens; an unknown or missing key reads as the combined lens. */
export const parseLens = (key: string | undefined): ReadingLens =>
  READING_LENSES.find((it) => it === key) ?? ReadingLens.COMBINED;

/** Two systems pointing the same way is the least that counts as shared. */
const MIN_AGREEMENT = 2;

/** "My trio": the topics where at least two systems agree, strongest first (stable on ties). */
export const trioShared = (readings: readonly TopicReading[]): readonly TopicReading[] =>
  readings.filter((it) => it.agreement >= MIN_AGREEMENT).sort((a, b) => b.agreement - a.agreement);
