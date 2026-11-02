import { useEffect, useMemo } from 'react';

import { useServices, useStateValue } from '@/core/data';
import { CalendarModel, type CalendarUiState } from './calendarModel';

const systemNow = (): Date => new Date();

export type CalendarModelHandle = { state: CalendarUiState; onMonthShown: (index: number) => void };

/** The calendar state, following the week-start and lunar-label settings while mounted. */
export function useCalendarModel(): CalendarModelHandle {
  const { settings } = useServices();
  const model = useMemo(() => new CalendarModel(settings, systemNow), [settings]);
  useEffect(() => model.start(), [model]);
  const state = useStateValue(model.state);
  const onMonthShown = useMemo(() => (index: number) => model.onMonthShown(index), [model]);
  return { state, onMonthShown };
}
