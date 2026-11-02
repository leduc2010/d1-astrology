import { Membership } from "@/core/data";
import { PremiumPlan } from "@/core/model";
import { FakeBilling, grantOnSuccess } from "@/core/testing";
import { MyPlanModel, RestoreStatus } from "../myPlanModel";

const TODAY = 20_000;

describe("MyPlanViewModel", () => {
  let billing: FakeBilling;
  const stops: (() => void)[] = [];

  beforeEach(() => {
    billing = new FakeBilling();
  });

  afterEach(() => stops.splice(0).forEach((stop) => stop()));

  /** Created, collected and with its offers loaded, like the Kotlin test dispatcher. */
  const subscribed = async (): Promise<MyPlanModel> => {
    const model = new MyPlanModel(billing, () => TODAY);
    stops.push(model.start());
    await model.ready;
    return model;
  };

  test("free plan has no details", async () => {
    expect((await subscribed()).state.current().details).toBeNull();
  });

  test("trial member sees days left and the renewal price", async () => {
    billing.membership.set(
      Membership.premium({
        plan: PremiumPlan.YEARLY,
        trialEndsOnEpochDay: TODAY + 5,
        renewsOnEpochDay: TODAY + 5,
      }),
    );
    const details = (await subscribed()).state.current().details;
    expect(details).not.toBeNull();
    expect(details?.trialDaysLeft).toBe(5);
    expect(details?.renewsOnEpochDay).toBe(TODAY + 5);
    expect(details?.renewalPrice?.priceMicros).toBe(32_990_000);
  });

  test("paying member has no trial left", async () => {
    billing.membership.set(
      Membership.premium({
        plan: PremiumPlan.MONTHLY,
        trialEndsOnEpochDay: TODAY - 1,
        renewsOnEpochDay: TODAY + 20,
      }),
    );
    const details = (await subscribed()).state.current().details;
    expect(details).not.toBeNull();
    expect(details?.trialDaysLeft).toBeNull();
    expect(details?.renewalPrice?.plan).toBe(PremiumPlan.MONTHLY);
  });

  test("restore reports nothing found, then up to date", async () => {
    const model = await subscribed();
    await model.restorePurchases();
    expect(model.state.current().restore).toBe(RestoreStatus.NothingFound);

    billing.restorable = grantOnSuccess(PremiumPlan.YEARLY);
    await model.restorePurchases();
    expect(model.state.current().restore).toBe(RestoreStatus.UpToDate);
    expect(model.state.current().details).not.toBeNull();
  });
});
