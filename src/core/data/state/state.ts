/**
 * A tiny StateFlow: a current value plus change listeners. Setting an equal value (structurally)
 * notifies nobody, like `distinctUntilChanged` on the Kotlin flows.
 */
export interface ReadonlyState<T> {
  current(): T;
  /** Called after every change with the new value. Returns the unsubscribe function. */
  subscribe(listener: (value: T) => void): () => void;
}

export class MutableState<T> implements ReadonlyState<T> {
  private value: T;
  private readonly listeners = new Set<(value: T) => void>();

  constructor(initial: T) {
    this.value = initial;
  }

  current(): T {
    return this.value;
  }

  set(next: T): void {
    if (deepEqual(this.value, next)) return;
    this.value = next;
    for (const listener of [...this.listeners]) listener(next);
  }

  update(change: (value: T) => T): void {
    this.set(change(this.value));
  }

  subscribe(listener: (value: T) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/** Structural equality over plain records and arrays, like Kotlin data class `equals`. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  return aKeys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(aRecord[key], bRecord[key]));
}
