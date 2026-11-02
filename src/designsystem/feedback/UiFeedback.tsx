import { createContext, useContext, type ReactNode } from 'react';

/**
 * Non-visual feedback cues for user actions (mirrors Kotlin `UiCue`). The design system only
 * names the moment; `src/sound` decides what it sounds like.
 */
export const UiCue = {
  /** Any ordinary press. */
  Tap: 'Tap',
  /** Choosing one option among several (tab, chip, radio, wheel). */
  Select: 'Select',
  /** A switch or checkbox flips. */
  Toggle: 'Toggle',
  /** A reading or result is revealed. */
  Reveal: 'Reveal',
  /** Something completed (saved, purchased). */
  Success: 'Success',
  /** A sheet or dialog opens. */
  Open: 'Open',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- enum-like const + type
export type UiCue = (typeof UiCue)[keyof typeof UiCue];

/** Plays a cue for a user action. At most one cue per action. */
export interface UiFeedback {
  perform(cue: UiCue): void;
}

/** Silent feedback: the default until the app provides a sound player. */
export const NoUiFeedback: UiFeedback = {
  perform() {},
};

const UiFeedbackContext = createContext<UiFeedback>(NoUiFeedback);

/** Kotlin `LocalUiFeedback` provider. `DesignSystemProvider` and `SoundProvider` use this. */
export function UiFeedbackProvider({ feedback, children }: { feedback: UiFeedback; children: ReactNode }) {
  return <UiFeedbackContext.Provider value={feedback}>{children}</UiFeedbackContext.Provider>;
}

/** The current feedback sink (Kotlin `LocalUiFeedback.current`). */
export function useUiFeedback(): UiFeedback {
  return useContext(UiFeedbackContext);
}
