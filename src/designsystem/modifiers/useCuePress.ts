import { useCallback } from 'react';

import { UiCue, useUiFeedback } from '../feedback/UiFeedback';

/**
 * Kotlin `ortusClickable` behaviour without the view: plays [cue] (null = silent), then runs
 * [onPress]. One cue per action, so callers never add a second one.
 */
export function useCuePress(onPress: (() => void) | undefined, cue: UiCue | null = UiCue.Tap): () => void {
  const feedback = useUiFeedback();
  return useCallback(() => {
    if (cue) feedback.perform(cue);
    onPress?.();
  }, [cue, feedback, onPress]);
}
