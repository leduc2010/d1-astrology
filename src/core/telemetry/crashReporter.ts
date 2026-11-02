/** Crash reports. Nothing is sent until `setEnabled(true)` is called with the owner's consent. */
export interface CrashReporter {
  setEnabled(enabled: boolean): void;
}

export const NoOpCrashReporter: CrashReporter = Object.freeze({
  setEnabled: () => undefined,
});

/**
 * Stands in for a crash's error before it is reported. It keeps the original class name and
 * stack frames but drops the message, which could quote a birth date, a name or a place.
 */
export class ScrubbedError extends Error {
  readonly scrubbedCause: ScrubbedError | null;

  constructor(originalClass: string, cause: ScrubbedError | null, frames: readonly string[] = []) {
    super(originalClass);
    this.name = 'ScrubbedError';
    this.scrubbedCause = cause;
    // Set after super() so the engine's own header (which repeats the message) is replaced.
    Object.defineProperty(this, 'cause', { value: cause ?? undefined, enumerable: false });
    this.stack = [originalClass, ...frames].join('\n');
  }
}

const MAX_CAUSES = 8;
/** V8/Hermes frames start with "at "; JSC frames look like "fn@file:line:col". */
const FRAME = /^\s+at\s|^[^\s]*@\S+:\d+/;

/** `error` and its causes as `ScrubbedError`s, with the same stack frames and no messages. */
export function scrub(error: unknown): ScrubbedError {
  return scrubAt(error, 0);
}

function scrubAt(error: unknown, depth: number): ScrubbedError {
  const next = causeOf(error);
  const cause = next !== undefined && next !== error && depth < MAX_CAUSES ? scrubAt(next, depth + 1) : null;
  return new ScrubbedError(classNameOf(error), cause, stackFramesOf(error));
}

/**
 * `scrub`, or a bare `ScrubbedError` if scrubbing itself fails, so the crash still reaches the
 * next handler.
 */
export function scrubOrBare(error: unknown): Error {
  try {
    return scrub(error);
  } catch {
    return new ScrubbedError(classNameOf(error), null);
  }
}

/** Only the frame lines of an error's stack: the header line holds the message. */
export function stackFramesOf(error: unknown): string[] {
  const stack = error instanceof Error ? error.stack : undefined;
  return (stack ?? '').split('\n').filter((line) => FRAME.test(line));
}

function causeOf(error: unknown): unknown {
  return error instanceof Error ? error.cause : undefined;
}

function classNameOf(error: unknown): string {
  if (error instanceof Error) {
    const ctor = (error as { constructor?: { name?: unknown } }).constructor;
    return typeof ctor?.name === 'string' && ctor.name.length > 0 ? ctor.name : 'Error';
  }
  return typeof error;
}
