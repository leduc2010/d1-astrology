import {
  EraseStatus,
  MutableState,
  type DataEraser,
  type ReadonlyState,
  type SettingsRepository,
} from "@/core/data";
import { DEFAULT_SETTINGS, type UserSettings } from "@/core/model";
import { saveQuietly, type ScreenModel } from "@/core/ui";

export interface PrivacyUiState {
  readonly personalizedTips: boolean;
  readonly analytics: boolean;
  readonly personalizedAds: boolean;
  readonly erase: EraseStatus;
}

export const DEFAULT_PRIVACY_UI_STATE: PrivacyUiState = Object.freeze({
  personalizedTips: false,
  analytics: false,
  personalizedAds: false,
  erase: EraseStatus.Idle,
});

/** Only an erase asked for on this visit shows, not an earlier one from before onboarding. */
export function privacyUiState(
  settings: UserSettings = DEFAULT_SETTINGS,
  requested: boolean,
  status: EraseStatus,
): PrivacyUiState {
  return Object.freeze({
    personalizedTips: settings.personalizedTips,
    analytics: settings.analyticsConsent,
    personalizedAds: settings.personalizedAds,
    erase: requested ? status : EraseStatus.Idle,
  });
}

/** Kotlin `PrivacyViewModel`: the three consents, and erase-all through the app-wide eraser. */
export class PrivacyModel implements ScreenModel<PrivacyUiState> {
  private requested = false;
  private readonly ui: MutableState<PrivacyUiState>;
  readonly state: ReadonlyState<PrivacyUiState>;

  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly eraser: DataEraser,
  ) {
    this.ui = new MutableState(this.compute());
    this.state = this.ui;
  }

  start(): () => void {
    const stops = [
      this.settingsRepository.subscribe(this.refresh),
      this.eraser.status.subscribe(this.refresh),
    ];
    void this.settingsRepository.load();
    this.refresh();
    return () => stops.forEach((stop) => stop());
  }

  setPersonalizedTips = (enabled: boolean): Promise<void> =>
    saveQuietly(() => this.settingsRepository.setPersonalizedTips(enabled));
  setAnalytics = (enabled: boolean): Promise<void> =>
    saveQuietly(() => this.settingsRepository.setAnalytics(enabled));
  setPersonalizedAds = (enabled: boolean): Promise<void> =>
    saveQuietly(() => this.settingsRepository.setPersonalizedAds(enabled));

  /** Erases everything through the app-wide [DataEraser], which outlives this screen. */
  eraseAll = (): Promise<void> => {
    this.requested = true;
    this.refresh();
    return this.eraser.eraseAll();
  };

  private readonly refresh = (): void => this.ui.set(this.compute());

  private compute(): PrivacyUiState {
    return privacyUiState(
      this.settingsRepository.current(),
      this.requested,
      this.eraser.status.current(),
    );
  }
}
