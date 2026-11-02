const MS_PER_MINUTE = 60_000;
const MIN_WAIT_MS = 1;

/**
 * Calls [listener] with the current time now and then at the start of every following minute,
 * until the returned function is called. Each wait is measured afresh, so the ticks do not drift.
 */
export function minuteTicks(listener: (now: Date) => void, now: () => Date = () => new Date()): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    const time = now();
    listener(time);
    if (stopped) return;
    const next = new Date(time.getTime());
    next.setSeconds(0, 0);
    const wait = next.getTime() + MS_PER_MINUTE - time.getTime();
    timer = setTimeout(tick, Math.max(wait, MIN_WAIT_MS));
  };

  tick();
  return () => {
    stopped = true;
    if (timer !== null) clearTimeout(timer);
  };
}
