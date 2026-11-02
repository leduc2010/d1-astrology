import {
  type Membership,
  MutableState,
  premiumOf,
  type Billing,
  type PartnerRepository,
  type ProfileRepository,
  type ReadonlyState,
  type SettingsRepository,
} from "@/core/data";
import {
  DEFAULT_SETTINGS,
  todayEpochDay,
  trialDaysLeft,
  WeekStart,
  type BirthProfile,
  type Partner,
  type PremiumPlan,
  type UserSettings,
} from "@/core/model";
import { personSummary, type PersonSummary } from "./personSummary";
import { saveQuietly, type ScreenModel } from "@/core/ui";

/** The member's plan as the Me page shows it; [trialDaysLeft] is null outside a trial. */
export interface PremiumStatus {
  readonly plan: PremiumPlan;
  readonly trialDaysLeft: number | null;
}

export interface MeUiState {
  readonly owner: PersonSummary | null;
  /** The owner plus everyone they added. */
  readonly profileCount: number;
  readonly premium: PremiumStatus | null;
  readonly soundEnabled: boolean;
  readonly reducedMotion: boolean;
  readonly weekStart: WeekStart;
  readonly showLunarInCalendar: boolean;
}

export const DEFAULT_ME_UI_STATE: MeUiState = Object.freeze({
  owner: null,
  profileCount: 0,
  premium: null,
  soundEnabled: true,
  reducedMotion: false,
  weekStart: WeekStart.MONDAY,
  showLunarInCalendar: true,
});

export interface MeSources {
  readonly settings: UserSettings | undefined;
  readonly owner: PersonSummary | null;
  readonly partners: readonly Partner[];
  readonly membership: Membership;
  readonly todayEpochDay: number;
}

/** The Me page from the stored settings, the people and the membership (the Kotlin `combine`). */
export function meUiState({
  settings = DEFAULT_SETTINGS,
  owner,
  partners,
  membership,
  todayEpochDay: today,
}: MeSources): MeUiState {
  const premium = premiumOf(membership);
  return Object.freeze({
    owner,
    profileCount: partners.length + (owner !== null ? 1 : 0),
    premium: premium
      ? Object.freeze({
          plan: premium.plan,
          trialDaysLeft: trialDaysLeft(premium, today),
        })
      : null,
    soundEnabled: settings.soundEnabled,
    reducedMotion: settings.reducedMotion,
    weekStart: settings.weekStart,
    showLunarInCalendar: settings.showLunarInCalendar,
  });
}

/** Kotlin `MeViewModel`: the Me page state and the settings it writes. */
export class MeModel implements ScreenModel<MeUiState> {
  private readonly ui: MutableState<MeUiState>;
  private ownerProfile: BirthProfile | null | undefined = undefined;
  private ownerSummary: PersonSummary | null = null;
  readonly state: ReadonlyState<MeUiState>;

  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly partnerRepository: PartnerRepository,
    private readonly billing: Billing,
    private readonly today: () => number = todayEpochDay,
  ) {
    this.ui = new MutableState(this.compute());
    this.state = this.ui;
  }

  start(): () => void {
    const refresh = () => this.ui.set(this.compute());
    const stops = [
      this.settingsRepository.subscribe(refresh),
      this.profileRepository.subscribe(refresh),
      this.partnerRepository.subscribe(refresh),
      this.billing.membership.subscribe(refresh),
    ];
    void this.settingsRepository.load();
    void this.profileRepository.load();
    void this.partnerRepository.load();
    refresh();
    return () => stops.forEach((stop) => stop());
  }

  setSoundEnabled = (enabled: boolean): Promise<void> =>
    saveQuietly(() => this.settingsRepository.setSoundEnabled(enabled));
  setReducedMotion = (enabled: boolean): Promise<void> =>
    saveQuietly(() => this.settingsRepository.setReducedMotion(enabled));
  setWeekStart = (weekStart: WeekStart): Promise<void> =>
    saveQuietly(() => this.settingsRepository.setWeekStart(weekStart));
  setShowLunarInCalendar = (enabled: boolean): Promise<void> =>
    saveQuietly(() => this.settingsRepository.setShowLunarInCalendar(enabled));
  /** RN only: Android keeps the app language itself; here the settings store persists it. */
  setLanguage = (language: string | null): Promise<void> =>
    saveQuietly(() => this.settingsRepository.setLanguage(language));

  private compute(): MeUiState {
    return meUiState({
      settings: this.settingsRepository.current(),
      owner: this.owner(),
      partners: this.partnerRepository.current() ?? [],
      membership: this.billing.membership.current(),
      todayEpochDay: this.today(),
    });
  }

  /** The owner's summary, resolved again only when the stored profile changes. */
  private owner(): PersonSummary | null {
    const profile = this.profileRepository.current();
    if (profile !== this.ownerProfile) {
      this.ownerProfile = profile;
      this.ownerSummary = profile ? personSummary(profile) : null;
    }
    return this.ownerSummary;
  }
}
