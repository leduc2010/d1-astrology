/** Kotlin-compatible number helpers, so ported formulas keep their exact results. */

/** Integer division truncating toward zero, like Kotlin `Int / Int`. */
export function idiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

/** Floored modulo (result has the sign of [n]), like Kotlin `.mod()` for Int and Double. */
export function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

/** Kotlin `require`. */
export function require(condition: boolean, message: string): asserts condition {
  if (!condition) throw new RangeError(message);
}

/** Kotlin `roundToInt()` (half rounds toward positive infinity, like `Math.round`). */
export function roundToInt(x: number): number {
  return Math.round(x);
}

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Kotlin `maxBy`: the first element with the largest key. */
export function maxBy<T>(items: readonly T[], key: (item: T) => number): T {
  if (items.length === 0) throw new RangeError("maxBy of an empty list");
  let best = items[0] as T;
  let bestKey = key(best);
  for (let i = 1; i < items.length; i++) {
    const k = key(items[i] as T);
    if (k > bestKey) {
      best = items[i] as T;
      bestKey = k;
    }
  }
  return best;
}

/** Kotlin `minBy`: the first element with the smallest key. */
export function minBy<T>(items: readonly T[], key: (item: T) => number): T {
  return maxBy(items, (item) => -key(item));
}

/** `0 until n` as an array. */
export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** Kotlin `minByOrNull`: the first element with the smallest key, or null when empty. */
export function minByOrNull<T>(items: readonly T[], key: (item: T) => number): T | null {
  return items.length === 0 ? null : minBy(items, key);
}

/** Kotlin `maxByOrNull`: the first element with the largest key, or null when empty. */
export function maxByOrNull<T>(items: readonly T[], key: (item: T) => number): T | null {
  return items.length === 0 ? null : maxBy(items, key);
}
