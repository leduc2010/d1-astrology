import { useEffect, useState } from "react";

import { useStateValue, type ReadonlyState } from "../data";

/**
 * The RN form of a Kotlin ViewModel: a [state] that is ready from construction, plus [start],
 * which subscribes to the sources (like `stateIn(WhileSubscribed)`) and returns the stop.
 */
export interface ScreenModel<S> {
  readonly state: ReadonlyState<S>;
  start(): () => void;
}

/** The UI state type a [ScreenModel] publishes. */
type StateOf<M> = M extends ScreenModel<infer S> ? S : never;

/** One model per screen visit (Compose `viewModel { }`), started while the screen is mounted. */
export function useScreenModel<M extends ScreenModel<unknown>>(
  create: () => M,
): readonly [StateOf<M>, M] {
  const [model] = useState(create);
  useEffect(() => model.start(), [model]);
  return [
    useStateValue(model.state as ReadonlyState<StateOf<M>>),
    model,
  ] as const;
}

/** Runs a settings write; a failure leaves the stored value, which every control mirrors. */
export async function saveQuietly(write: () => Promise<void>): Promise<void> {
  try {
    await write();
  } catch {
    // Nothing to roll back: the controls mirror the persisted settings.
  }
}
