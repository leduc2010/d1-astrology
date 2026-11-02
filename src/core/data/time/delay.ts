/** Resolves after [millis]; at once (still asynchronously) when zero or less, like `delay(0)`. */
export function delay(millis: number): Promise<void> {
  if (millis <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, millis));
}
