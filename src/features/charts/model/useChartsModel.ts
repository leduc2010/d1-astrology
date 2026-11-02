import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { useServices } from '@/core/data';
import type { Branch } from '@/engine';

import { ChartsModel, type ChartsUiState } from './chartsModel';

export type ChartsScreenModel = {
  readonly state: ChartsUiState;
  readonly onSelectPalace: (branch: Branch) => void;
};

/** This screen's own charts model, following the owner's profile while mounted. */
export function useChartsModel(): ChartsScreenModel {
  const { profile } = useServices();
  const model = useMemo(() => new ChartsModel(profile), [profile]);
  useEffect(() => model.start(), [model]);
  const state = useSyncExternalStore(model.subscribe, model.current, model.current);
  return { state, onSelectPalace: model.onSelectPalace };
}
