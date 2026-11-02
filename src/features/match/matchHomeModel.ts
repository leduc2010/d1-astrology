import { resolveBirth } from '@/core/data';
import type { BirthProfile, Partner } from '@/core/model';
import type { StemBranch } from '@/engine';

/** The owner's card: lunar year and sun sign (S07-01 "Ất Hợi · Sư Tử"). */
export interface OwnerSummary {
  readonly name: string;
  readonly lunarYear: StemBranch;
  readonly sunLongitude: number;
}

/** Someone added for matching; [lunarYear] is null when their date is outside the supported range. */
export interface PartnerSummary {
  readonly partner: Partner;
  readonly lunarYear: StemBranch | null;
}

export type MatchHomeUiState =
  | { readonly kind: 'Loading' }
  | { readonly kind: 'NoProfile' }
  | { readonly kind: 'Unavailable' }
  | {
      readonly kind: 'Ready';
      readonly owner: OwnerSummary;
      readonly partners: readonly PartnerSummary[];
      readonly selected: PartnerSummary | null;
    };

/** The owner as read once per profile: undefined while loading, null with no profile, else ok or not. */
export type OwnerLoad = undefined | null | { readonly ok: true; readonly owner: OwnerSummary } | { readonly ok: false };

export function ownerLoadOf(profile: BirthProfile | null | undefined): OwnerLoad {
  if (profile === undefined || profile === null) return profile;
  try {
    const resolved = resolveBirth(profile);
    const owner: OwnerSummary = Object.freeze({
      name: profile.name,
      lunarYear: resolved.lunarYearPillar,
      sunLongitude: resolved.sunLongitude(),
    });
    return Object.freeze({ ok: true, owner });
  } catch {
    return Object.freeze({ ok: false });
  }
}

function lunarYearOf(profile: BirthProfile): StemBranch | null {
  try {
    return resolveBirth(profile).lunarYearPillar;
  } catch {
    return null;
  }
}

export const partnerSummariesOf = (partners: readonly Partner[]): readonly PartnerSummary[] =>
  Object.freeze(partners.map((partner) => Object.freeze({ partner, lunarYear: lunarYearOf(partner.profile) })));

/** S07-01's state from the owner, everyone added, and the person the owner last chose (if any). */
export function matchHomeUiState(
  owner: OwnerLoad,
  people: readonly PartnerSummary[] | undefined,
  chosenId: number | null,
): MatchHomeUiState {
  if (owner === undefined || people === undefined) return { kind: 'Loading' };
  if (owner === null) return { kind: 'NoProfile' };
  if (!owner.ok) return { kind: 'Unavailable' };
  return Object.freeze({
    kind: 'Ready',
    owner: owner.owner,
    partners: people,
    // The latest person added is picked until the owner chooses someone else.
    selected: people.find((it) => it.partner.id === chosenId) ?? people.at(-1) ?? null,
  });
}
