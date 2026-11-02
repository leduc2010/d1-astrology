import type { ReactElement, ReactNode } from 'react';

import type { UiCue, UiFeedback } from '../feedback/UiFeedback';
import { DesignSystemProvider } from '../theme/DesignSystemProvider';

/** A feedback sink that remembers every cue, for tests. */
export function recordingFeedback(): UiFeedback & { readonly cues: readonly UiCue[] } {
  const cues: UiCue[] = [];
  return {
    get cues() {
      return [...cues];
    },
    perform(cue: UiCue) {
      cues.push(cue);
    },
  };
}

/** Wraps [ui] in the design-system providers with the given feedback sink. */
export function withDesignSystem(ui: ReactNode, feedback: UiFeedback, reducedMotion = false): ReactElement {
  return (
    <DesignSystemProvider reducedMotion={reducedMotion} feedback={feedback}>
      {ui}
    </DesignSystemProvider>
  );
}
