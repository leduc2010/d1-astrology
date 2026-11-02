import type { MutablePrefs, Prefs } from './preferencesFile';

/**
 * Typed reads and writes over string preferences. A value that does not parse reads as missing,
 * so callers apply the same defaults (or nulls) as for a key that was never written.
 */

const INTEGER = /^[+-]?\d+$/;

export function readString(prefs: Prefs, key: string): string | null {
  return prefs.get(key) ?? null;
}

export function readBoolean(prefs: Prefs, key: string): boolean | null {
  const value = prefs.get(key);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

/** Whole numbers only (Kotlin Int / Long keys). */
export function readInteger(prefs: Prefs, key: string): number | null {
  const value = prefs.get(key);
  if (value === undefined || !INTEGER.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

export function readDouble(prefs: Prefs, key: string): number | null {
  const value = prefs.get(key);
  if (value === undefined || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** A string set, stored as a JSON array. */
export function readStringSet(prefs: Prefs, key: string): readonly string[] | null {
  const value = prefs.get(key);
  if (value === undefined) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return [...new Set(parsed.filter((item): item is string => typeof item === 'string'))];
  } catch {
    return null;
  }
}

export function writeString(prefs: MutablePrefs, key: string, value: string): void {
  prefs.set(key, value);
}

export function writeBoolean(prefs: MutablePrefs, key: string, value: boolean): void {
  prefs.set(key, String(value));
}

export function writeInteger(prefs: MutablePrefs, key: string, value: number): void {
  prefs.set(key, String(Math.trunc(value)));
}

/** `String(number)` is the shortest text that parses back to the same double. */
export function writeDouble(prefs: MutablePrefs, key: string, value: number): void {
  prefs.set(key, String(value));
}

export function writeStringSet(prefs: MutablePrefs, key: string, values: Iterable<string>): void {
  prefs.set(key, JSON.stringify([...new Set(values)]));
}
