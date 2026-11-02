import { useCallback, useMemo, useState } from 'react';

import { usePartners, usePrimaryProfile, useServices } from '@/core/data';

import {
  deletePartner,
  matchResultLoadOf,
  matchResultUiState,
  partnerById,
  type MatchResultUiState,
} from './matchResultModel';

export type MatchResultModel = {
  readonly state: MatchResultUiState;
  readonly onDelete: () => void;
};

/** S07-03 (Kotlin `MatchResultViewModel`): the owner and one partner, read system by system. */
export function useMatchResultModel(partnerId: number): MatchResultModel {
  const { partners: repository } = useServices();
  const profile = usePrimaryProfile();
  const partners = usePartners();
  const [deleteFailed, setDeleteFailed] = useState(false);
  const other = useMemo(() => partnerById(partners, partnerId), [partners, partnerId]);
  const load = useMemo(() => matchResultLoadOf(profile, other), [profile, other]);
  const state = useMemo(() => matchResultUiState(load, deleteFailed), [load, deleteFailed]);
  const onDelete = useCallback(() => {
    setDeleteFailed(false);
    void deletePartner(repository, partnerId, () => setDeleteFailed(true));
  }, [repository, partnerId]);
  return { state, onDelete };
}
