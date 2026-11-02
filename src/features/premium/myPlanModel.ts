import {
  MutableState,
  premiumOf,
  type Billing,
  type PlanOffer,
  type ReadonlyState,
} from "@/core/data";
import { todayEpochDay, trialDaysLeft, type PremiumPlan } from "@/core/model";
import type { ScreenModel } from "@/core/ui";

/** The member's subscription as S08-03 shows it. [renewalPrice] is null until the store answers. */
export interface PlanDetails {
  readonly plan: PremiumPlan;
  readonly trialDaysLeft: number | null;
  readonly renewsOnEpochDay: number;
  readonly renewalPrice: PlanOffer | null;
}

export enum RestoreStatus {
  Idle = "Idle",
  Restoring = "Restoring",
  UpToDate = "UpToDate",
  NothingFound = "NothingFound",
  Failed = "Failed",
}

export interface MyPlanUiState {
  /** Null on the free plan (or before the store has answered on a new launch). */
  readonly details: PlanDetails | null;
  readonly restore: RestoreStatus;
}

/** Kotlin `MyPlanViewModel` (S08-03): what the member pays, when, and where to manage it. */
export class MyPlanModel implements ScreenModel<MyPlanUiState> {
  private offers: readonly PlanOffer[] = [];
  private restoreStatus = RestoreStatus.Idle;
  private readonly ui: MutableState<MyPlanUiState>;
  readonly state: ReadonlyState<MyPlanUiState>;
  /** The offers load, started on creation like Kotlin `init`. */
  readonly ready: Promise<void>;

  constructor(
    private readonly billing: Billing,
    private readonly today: () => number = todayEpochDay,
  ) {
    this.ui = new MutableState(this.compute());
    this.state = this.ui;
    this.ready = this.loadOffers();
  }

  start(): () => void {
    const stop = this.billing.membership.subscribe(this.refresh);
    this.refresh();
    return stop;
  }

  restorePurchases = async (): Promise<void> => {
    if (this.restoreStatus === RestoreStatus.Restoring) return;
    this.setRestore(RestoreStatus.Restoring);
    try {
      this.setRestore(
        (await this.billing.restore())
          ? RestoreStatus.UpToDate
          : RestoreStatus.NothingFound,
      );
    } catch {
      this.setRestore(RestoreStatus.Failed);
    }
  };

  private async loadOffers(): Promise<void> {
    try {
      this.offers = await this.billing.offers();
      this.refresh();
    } catch {
      // The price line simply stays hidden; the plan and date still show.
    }
  }

  private setRestore(status: RestoreStatus): void {
    this.restoreStatus = status;
    this.refresh();
  }

  private readonly refresh = (): void => this.ui.set(this.compute());

  private compute(): MyPlanUiState {
    const member = premiumOf(this.billing.membership.current());
    const details: PlanDetails | null = member
      ? Object.freeze({
          plan: member.plan,
          trialDaysLeft: trialDaysLeft(member, this.today()),
          renewsOnEpochDay: member.renewsOnEpochDay,
          renewalPrice:
            this.offers.find((it) => it.plan === member.plan) ?? null,
        })
      : null;
    return Object.freeze({ details, restore: this.restoreStatus });
  }
}
