import {
  MutableState,
  type PartnerRepository,
  type ProfileRepository,
  type ReadonlyState,
} from "@/core/data";
import type { BirthProfile, Partner, Relationship } from "@/core/model";
import { personSummary, type PersonSummary } from "./personSummary";
import type { ScreenModel } from "@/core/ui";

/** Someone the owner added with that person's consent, on [addedOnEpochDay]. */
export interface OtherPerson {
  readonly id: number;
  readonly relationship: Relationship;
  readonly addedOnEpochDay: number;
  readonly person: PersonSummary;
}

export interface ProfilesUiState {
  readonly owner: PersonSummary | null;
  readonly others: readonly OtherPerson[];
  readonly deleteFailed: boolean;
}

export function otherPerson(partner: Partner): OtherPerson {
  return Object.freeze({
    id: partner.id,
    relationship: partner.relationship,
    addedOnEpochDay: partner.addedOnEpochDay,
    person: personSummary(partner.profile),
  });
}

/** Kotlin `ProfilesViewModel`: the owner first, then everyone added; deleting someone. */
export class ProfilesModel implements ScreenModel<ProfilesUiState> {
  private deleteFailed = false;
  private ownerOf: {
    profile: BirthProfile | null | undefined;
    summary: PersonSummary | null;
  } = {
    profile: undefined,
    summary: null,
  };
  private othersOf: {
    partners: readonly Partner[] | undefined;
    others: readonly OtherPerson[];
  } = {
    partners: undefined,
    others: [],
  };
  private readonly ui: MutableState<ProfilesUiState>;
  readonly state: ReadonlyState<ProfilesUiState>;

  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly partnerRepository: PartnerRepository,
  ) {
    this.ui = new MutableState(this.compute());
    this.state = this.ui;
  }

  start(): () => void {
    const stops = [
      this.profileRepository.subscribe(this.refresh),
      this.partnerRepository.subscribe(this.refresh),
    ];
    void this.profileRepository.load();
    void this.partnerRepository.load();
    this.refresh();
    return () => stops.forEach((stop) => stop());
  }

  /** Removes someone together with their compatibility readings (those are worked out on demand). */
  delete = async (id: number): Promise<void> => {
    this.setDeleteFailed(false);
    try {
      await this.partnerRepository.remove(id);
    } catch {
      this.setDeleteFailed(true);
    }
  };

  private setDeleteFailed(failed: boolean): void {
    this.deleteFailed = failed;
    this.refresh();
  }

  private readonly refresh = (): void => this.ui.set(this.compute());

  private compute(): ProfilesUiState {
    return Object.freeze({
      owner: this.owner(),
      others: this.others(),
      deleteFailed: this.deleteFailed,
    });
  }

  private owner(): PersonSummary | null {
    const profile = this.profileRepository.current();
    if (profile !== this.ownerOf.profile) {
      this.ownerOf = {
        profile,
        summary: profile ? personSummary(profile) : null,
      };
    }
    return this.ownerOf.summary;
  }

  private others(): readonly OtherPerson[] {
    const partners = this.partnerRepository.current();
    if (partners !== this.othersOf.partners) {
      this.othersOf = {
        partners,
        others: Object.freeze((partners ?? []).map(otherPerson)),
      };
    }
    return this.othersOf.others;
  }
}
