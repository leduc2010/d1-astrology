import {
  MutableState,
  premiumOf,
  type Billing,
  type PlanOffer,
  type ReadonlyState,
} from "@/core/data";
import {
  PremiumPlan,
  todayEpochDay,
  type PremiumMembership,
} from "@/core/model";
import { yearlySavingsPercent } from "./pricing";
import type { ScreenModel } from "@/core/ui";

/** Where a purchase or restore stands. */
export type StoreStatus =
  | { readonly kind: "Idle" }
  /** Waiting on the store (S08-02b). */
  | { readonly kind: "Confirming" }
  /** Premium is on (S08-02a). */
  | { readonly kind: "Activated" }
  /** Nothing was charged (S08-02c); [code] is the store's own error code. */
  | { readonly kind: "Failed"; readonly code: string }
  /** Restore found no earlier purchase on this account. */
  | { readonly kind: "NothingToRestore" };

// eslint-disable-next-line @typescript-eslint/no-redeclare -- factories share the type's name
export const StoreStatus = Object.freeze({
  Idle: Object.freeze({ kind: "Idle" }) as StoreStatus,
  Confirming: Object.freeze({ kind: "Confirming" }) as StoreStatus,
  Activated: Object.freeze({ kind: "Activated" }) as StoreStatus,
  NothingToRestore: Object.freeze({ kind: "NothingToRestore" }) as StoreStatus,
  failed: (code: string): StoreStatus =>
    Object.freeze({ kind: "Failed", code }),
});

export interface PaywallUiState {
  readonly offers: readonly PlanOffer[];
  readonly loadingOffers: boolean;
  readonly selected: PremiumPlan;
  readonly status: StoreStatus;
  readonly membership: PremiumMembership | null;
  readonly todayEpochDay: number;
}

export const selectedOffer = (state: PaywallUiState): PlanOffer | null =>
  state.offers.find((it) => it.plan === state.selected) ?? null;

export const savingsPercent = (state: PaywallUiState): number | null =>
  yearlySavingsPercent(state.offers);

/** The day the selected plan first charges when it starts with a trial; null without one. */
export function firstChargeEpochDay(state: PaywallUiState): number | null {
  const trialDays = selectedOffer(state)?.trialDays ?? 0;
  return trialDays > 0 ? state.todayEpochDay + trialDays : null;
}

/** Code shown when the store could not be reached at all. */
export const NETWORK_ERROR_CODE = "NETWORK";

type Local = Omit<PaywallUiState, "membership" | "todayEpochDay">;

const INITIAL_LOCAL: Local = Object.freeze({
  offers: Object.freeze([]),
  loadingOffers: true,
  selected: PremiumPlan.YEARLY,
  status: StoreStatus.Idle,
});

/** Kotlin `PaywallViewModel` (S08-01/02): the plans on sale, and buying or restoring one. */
export class PaywallModel implements ScreenModel<PaywallUiState> {
  private local: Local = INITIAL_LOCAL;
  private readonly ui: MutableState<PaywallUiState>;
  readonly state: ReadonlyState<PaywallUiState>;
  /** The first offers load, started on creation like Kotlin `init`. */
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

  loadOffers = async (): Promise<void> => {
    this.update((it) => ({ ...it, loadingOffers: true }));
    let offers: readonly PlanOffer[];
    try {
      offers = await this.billing.offers();
    } catch {
      offers = [];
    }
    this.update((state) => {
      const selected = offers.some((it) => it.plan === state.selected)
        ? state.selected
        : (offers[0]?.plan ?? state.selected);
      return { ...state, offers, loadingOffers: false, selected };
    });
  };

  select = (plan: PremiumPlan): void => {
    this.update((it) =>
      it.status.kind === "Confirming" ? it : { ...it, selected: plan },
    );
  };

  purchase = (): Promise<void> => {
    const plan = selectedOffer(this.state.current())?.plan;
    if (plan === undefined) return Promise.resolve();
    return this.storeCall(async () => {
      const result = await this.billing.purchase(plan);
      switch (result.kind) {
        case "success":
          return StoreStatus.Activated;
        case "cancelled":
          return StoreStatus.Idle;
        case "failed":
          return StoreStatus.failed(result.code);
      }
    });
  };

  restore = (): Promise<void> =>
    this.storeCall(async () =>
      (await this.billing.restore())
        ? StoreStatus.Activated
        : StoreStatus.NothingToRestore,
    );

  /** One store call at a time; a dropped connection reads as a failure that charged nothing. */
  private async storeCall(call: () => Promise<StoreStatus>): Promise<void> {
    if (this.local.status.kind === "Confirming") return;
    this.update((it) => ({ ...it, status: StoreStatus.Confirming }));
    let status: StoreStatus;
    try {
      status = await call();
    } catch {
      status = StoreStatus.failed(NETWORK_ERROR_CODE);
    }
    this.update((it) => ({ ...it, status }));
  }

  private update(change: (local: Local) => Local): void {
    this.local = Object.freeze(change(this.local));
    this.refresh();
  }

  private readonly refresh = (): void => this.ui.set(this.compute());

  private compute(): PaywallUiState {
    return Object.freeze({
      ...this.local,
      membership: premiumOf(this.billing.membership.current()),
      todayEpochDay: this.today(),
    });
  }
}
