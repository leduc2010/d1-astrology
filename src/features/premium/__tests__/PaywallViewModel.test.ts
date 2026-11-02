import {
  PurchaseResult,
  type Billing,
  type Membership,
  type PlanOffer,
  type ReadonlyState,
} from "@/core/data";
import { PremiumPlan } from "@/core/model";
import { FakeBilling, SAMPLE_OFFERS } from "@/core/testing";
import {
  firstChargeEpochDay,
  NETWORK_ERROR_CODE,
  PaywallModel,
  savingsPercent,
  StoreStatus,
} from "../paywallModel";

const TODAY = 20_000;

/** Throws like a dropped connection while [failing]. */
class FlakyBilling implements Billing {
  readonly membership: ReadonlyState<Membership>;

  constructor(
    private readonly delegate: FakeBilling,
    public failing = true,
  ) {
    this.membership = delegate.membership;
  }

  offers(): Promise<readonly PlanOffer[]> {
    return this.failing
      ? Promise.reject(new Error("offline"))
      : this.delegate.offers();
  }

  purchase(plan: PremiumPlan): Promise<PurchaseResult> {
    return this.failing
      ? Promise.reject(new Error("offline"))
      : this.delegate.purchase(plan);
  }

  restore(): Promise<boolean> {
    return this.failing
      ? Promise.reject(new Error("offline"))
      : this.delegate.restore();
  }
}

describe("PaywallViewModel", () => {
  let billing: FakeBilling;
  const stops: (() => void)[] = [];

  beforeEach(() => {
    billing = new FakeBilling();
  });

  afterEach(() => stops.splice(0).forEach((stop) => stop()));

  /** Created, collected and with its first offers load finished, like the Kotlin test dispatcher. */
  const subscribed = async (
    store: Billing = billing,
  ): Promise<PaywallModel> => {
    const model = new PaywallModel(store, () => TODAY);
    stops.push(model.start());
    await model.ready;
    return model;
  };

  test("loads offers with yearly selected and its trial dated", async () => {
    const state = (await subscribed()).state.current();
    expect(state.loadingOffers).toBe(false);
    expect(state.offers).toHaveLength(2);
    expect(state.selected).toBe(PremiumPlan.YEARLY);
    expect(firstChargeEpochDay(state)).toBe(TODAY + 7);
    expect(savingsPercent(state)).toBe(44);
  });

  test("monthly has no trial date", async () => {
    const model = await subscribed();
    model.select(PremiumPlan.MONTHLY);
    expect(firstChargeEpochDay(model.state.current())).toBeNull();
  });

  test("falls back to the first offer when yearly is not on sale", async () => {
    billing.availableOffers = SAMPLE_OFFERS.filter(
      (it) => it.plan === PremiumPlan.MONTHLY,
    );
    expect((await subscribed()).state.current().selected).toBe(
      PremiumPlan.MONTHLY,
    );
  });

  test("successful purchase activates and shows the membership", async () => {
    const model = await subscribed();
    await model.purchase();
    const state = model.state.current();
    expect(state.status).toEqual(StoreStatus.Activated);
    expect(state.membership?.plan).toBe(PremiumPlan.YEARLY);
    expect(billing.purchased).toEqual([PremiumPlan.YEARLY]);
  });

  test("cancelled purchase returns quietly to the offer", async () => {
    billing.nextResult = PurchaseResult.Cancelled;
    const model = await subscribed();
    await model.purchase();
    expect(model.state.current().status).toEqual(StoreStatus.Idle);
    expect(model.state.current().membership).toBeNull();
  });

  test("failed purchase keeps the store code", async () => {
    billing.nextResult = PurchaseResult.failed("BILLING_UNAVAILABLE");
    const model = await subscribed();
    await model.purchase();
    expect(model.state.current().status).toEqual(
      StoreStatus.failed("BILLING_UNAVAILABLE"),
    );
  });

  test("restore with nothing bought says so", async () => {
    const model = await subscribed();
    await model.restore();
    expect(model.state.current().status).toEqual(StoreStatus.NothingToRestore);
  });

  test("restore finds an earlier purchase", async () => {
    billing.restorable = {
      plan: PremiumPlan.MONTHLY,
      trialEndsOnEpochDay: null,
      renewsOnEpochDay: TODAY + 30,
    };
    const model = await subscribed();
    await model.restore();
    expect(model.state.current().status).toEqual(StoreStatus.Activated);
    expect(model.state.current().membership).not.toBeNull();
  });

  test("unreachable store shows no plans, and retry loads them", async () => {
    const store = new FlakyBilling(billing);
    const model = await subscribed(store);
    expect(model.state.current().offers).toEqual([]);
    store.failing = false;
    await model.loadOffers();
    expect(model.state.current().offers).toHaveLength(2);
  });

  test("dropped connection during purchase reads as a network failure", async () => {
    const store = new FlakyBilling(billing, false);
    const model = await subscribed(store);
    store.failing = true;
    await model.purchase();
    expect(model.state.current().status).toEqual(
      StoreStatus.failed(NETWORK_ERROR_CODE),
    );
  });
});
