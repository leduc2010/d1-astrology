import type { PartnerRepository } from './partnerRepository';
import type { ProfileRepository } from './profileRepository';
import type { SettingsRepository } from './settingsRepository';
import { MutableState, type ReadonlyState } from './state/state';

export enum EraseStatus {
  Idle = 'Idle',
  Erasing = 'Erasing',
  Failed = 'Failed',
  Done = 'Done',
}

/**
 * Erase-all, owned by the app rather than a screen: clearing the profile sends the app back to
 * onboarding before the last step ends, so the outcome has to outlive the Privacy screen.
 */
export class DataEraser {
  private readonly state = new MutableState(EraseStatus.Idle);
  private running: Promise<void> = Promise.resolve();

  /** Erasing until every store is cleared, then Done or Failed until the next attempt. */
  readonly status: ReadonlyState<EraseStatus> = this.state;

  constructor(
    private readonly partnerRepository: PartnerRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly settingsRepository: SettingsRepository,
  ) {}

  /**
   * Forgets everyone added, the owner's profile and every setting, in that order, so a failure
   * part way never leaves other people's birth data behind the owner's. A second call while
   * erasing is ignored (it resolves with the first); after Failed it tries again from the start.
   * The promise never rejects: the outcome is in [status].
   */
  eraseAll(): Promise<void> {
    if (this.state.current() === EraseStatus.Erasing) return this.running;
    this.state.set(EraseStatus.Erasing);
    this.running = this.erase().then((status) => this.state.set(status));
    return this.running;
  }

  private async erase(): Promise<EraseStatus> {
    try {
      await this.partnerRepository.clear();
      await this.profileRepository.clear();
      await this.settingsRepository.clear();
      return EraseStatus.Done;
    } catch {
      // Any storage failure is reported through the status; the screen offers a retry.
      return EraseStatus.Failed;
    }
  }
}
