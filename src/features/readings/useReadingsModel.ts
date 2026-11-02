import { useCallback, useMemo, useState } from 'react';

import { usePrimaryProfile } from '@/core/data';
import type { Topic } from '@/core/reading';

import {
  ReadingLens,
  readingsLoadOf,
  readingsUiState,
  withFeedback,
  type ReadingsUiState,
} from './readingsModel';

export type ReadingsModel = {
  readonly state: ReadingsUiState;
  readonly onSelectLens: (lens: ReadingLens) => void;
  /** Feedback stays on the device in this version; only the fact that it was given is kept. */
  readonly onFeedbackSent: (topic: Topic) => void;
};

/**
 * The owner's six topic readings, recomputed only when the profile changes (Kotlin
 * `ReadingsViewModel`). Each screen gets its own lens and feedback state, as each Kotlin
 * destination had its own view model.
 */
export function useReadingsModel(initialLens: ReadingLens = ReadingLens.COMBINED): ReadingsModel {
  const profile = usePrimaryProfile();
  const load = useMemo(() => readingsLoadOf(profile), [profile]);
  const [lens, setLens] = useState(initialLens);
  const [feedbackSent, setFeedbackSent] = useState<readonly Topic[]>([]);
  const state = useMemo(() => readingsUiState(load, lens, feedbackSent), [load, lens, feedbackSent]);
  const onFeedbackSent = useCallback((topic: Topic) => setFeedbackSent((sent) => withFeedback(sent, topic)), []);
  return { state, onSelectLens: setLens, onFeedbackSent };
}
