import type { AudioSource } from 'expo-audio';

import type { UiCue } from '@/designsystem/feedback/UiFeedback';

/** The short cue files generated for the Kotlin app (`scripts/gen-sounds.py`), one per cue. */
export const CUE_SOURCES: Readonly<Record<UiCue, AudioSource>> = {
  Tap: require('../../assets/sounds/cue_tap.wav'),
  Select: require('../../assets/sounds/cue_select.wav'),
  Toggle: require('../../assets/sounds/cue_toggle.wav'),
  Reveal: require('../../assets/sounds/cue_reveal.wav'),
  Success: require('../../assets/sounds/cue_success.wav'),
  Open: require('../../assets/sounds/cue_open.wav'),
};

/** Frequent cues sit lower so they stay a texture, not a noise (Kotlin `UiCue.volume()`). */
export const CUE_VOLUMES: Readonly<Record<UiCue, number>> = {
  Tap: 0.35,
  Select: 0.35,
  Toggle: 0.35,
  Open: 0.45,
  Reveal: 0.6,
  Success: 0.6,
};

/** At most one cue per this many milliseconds, so rapid taps never stack into noise. */
export const MIN_GAP_MS = 70;
