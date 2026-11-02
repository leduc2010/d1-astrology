import { useMemo, useState } from 'react';

import { usePartners, usePrimaryProfile } from '@/core/data';

import { matchHomeUiState, ownerLoadOf, partnerSummariesOf, type MatchHomeUiState } from './matchHomeModel';

export type MatchHomeModel = {
  readonly state: MatchHomeUiState;
  readonly onSelect: (id: number) => void;
};

/** S07-01 (Kotlin `MatchHomeViewModel`): charts are worked out again only when their data changes. */
export function useMatchHomeModel(): MatchHomeModel {
  const profile = usePrimaryProfile();
  const partners = usePartners();
  const [chosenId, setChosenId] = useState<number | null>(null);
  const owner = useMemo(() => ownerLoadOf(profile), [profile]);
  const people = useMemo(() => (partners === undefined ? undefined : partnerSummariesOf(partners)), [partners]);
  const state = useMemo(() => matchHomeUiState(owner, people, chosenId), [owner, people, chosenId]);
  return { state, onSelect: setChosenId };
}
