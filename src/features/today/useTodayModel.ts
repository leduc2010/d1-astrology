import { useEffect, useMemo } from 'react';

import { minuteTicks, useServices, useStateValue } from '@/core/data';
import { TodayModel, type TodayUiState } from './todayModel';

const systemNow = (): Date => new Date();

/** The Today screen state, following the minute clock and the owner's profile while mounted. */
export function useTodayModel(): TodayUiState {
  const { profile } = useServices();
  const model = useMemo(() => new TodayModel(profile, systemNow, (listener) => minuteTicks(listener, systemNow)), [profile]);
  useEffect(() => model.start(), [model]);
  return useStateValue(model.state);
}
