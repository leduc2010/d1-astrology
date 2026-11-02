import { useMemo } from 'react';

import { useStateValue } from '@/core/data';
import { type CivilDate, isoDate } from '@/engine';
import { DayModel, type DayUiState } from './dayModel';

const systemNow = (): Date => new Date();

export type DayModelHandle = { state: DayUiState; onShift: (days: number) => void };

/** One day page; [start] null (an unreadable link) or outside the supported years opens today. */
export function useDayModel(start: CivilDate | null): DayModelHandle {
  const key = start ? isoDate(start) : null;
  // Keyed by the date text so a new object for the same day keeps the model and its steps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const model = useMemo(() => new DayModel(start, systemNow), [key]);
  const state = useStateValue(model.state);
  const onShift = useMemo(() => (days: number) => model.onShift(days), [model]);
  return { state, onShift };
}
