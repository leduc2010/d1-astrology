import { resolveBirth, type PartnerRepository } from '@/core/data';
import type { BirthProfile, Partner } from '@/core/model';

import { matchReportOf, type MatchReport } from './matchReport';

export type MatchResultUiState =
  | { readonly kind: 'Loading' }
  | { readonly kind: 'NoProfile' }
  /** One of the two dates is outside the supported range. */
  | { readonly kind: 'Unavailable' }
  /** The person is not stored (any more): deleted here or elsewhere. */
  | { readonly kind: 'Gone' }
  /** [deleteFailed]: the last delete could not be written; the person is still stored. */
  | {
      readonly kind: 'Ready';
      readonly partner: Partner;
      readonly report: MatchReport;
      readonly deleteFailed: boolean;
    };

/** The report part of S07-03, worked out once per pair (the delete notice is kept apart). */
export type MatchResultLoad =
  | { readonly kind: 'Loading' | 'NoProfile' | 'Unavailable' | 'Gone' }
  | { readonly kind: 'Ready'; readonly partner: Partner; readonly report: MatchReport };

export const partnerById = (partners: readonly Partner[] | undefined, id: number): Partner | null | undefined =>
  partners === undefined ? undefined : (partners.find((it) => it.id === id) ?? null);

export function matchResultLoadOf(
  owner: BirthProfile | null | undefined,
  other: Partner | null | undefined,
): MatchResultLoad {
  if (owner === undefined || other === undefined) return { kind: 'Loading' };
  if (owner === null) return { kind: 'NoProfile' };
  if (other === null) return { kind: 'Gone' };
  try {
    return Object.freeze({ kind: 'Ready', partner: other, report: matchReportOf(resolveBirth(owner), resolveBirth(other.profile)) });
  } catch {
    return { kind: 'Unavailable' };
  }
}

export const matchResultUiState = (load: MatchResultLoad, deleteFailed: boolean): MatchResultUiState =>
  load.kind === 'Ready' ? Object.freeze({ ...load, deleteFailed }) : load;

/**
 * Deletes the person and their birth data; the page then closes as the partner list no longer
 * holds them. [onFailed] runs when the store could not be written.
 */
export async function deletePartner(
  partners: Pick<PartnerRepository, 'remove'>,
  id: number,
  onFailed: () => void,
): Promise<void> {
  try {
    await partners.remove(id);
  } catch {
    onFailed();
  }
}
