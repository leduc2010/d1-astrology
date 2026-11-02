import { Membership } from "@/core/data";
import {
  DEFAULT_SETTINGS,
  PremiumPlan,
  Relationship,
  WeekStart,
} from "@/core/model";
import {
  FakeBilling,
  FakePartnerRepository,
  FakeProfileRepository,
  FakeSettingsRepository,
  TestProfiles,
} from "@/core/testing";
import { DEFAULT_ME_UI_STATE, MeModel } from "../meModel";

const TODAY = 20_000;

describe("MeViewModel", () => {
  let settings: FakeSettingsRepository;
  let profiles: FakeProfileRepository;
  let partners: FakePartnerRepository;
  let billing: FakeBilling;
  const stops: (() => void)[] = [];

  beforeEach(() => {
    settings = new FakeSettingsRepository();
    profiles = new FakeProfileRepository();
    partners = new FakePartnerRepository();
    billing = new FakeBilling();
  });

  afterEach(() => stops.splice(0).forEach((stop) => stop()));

  const subscribed = (): MeModel => {
    const model = new MeModel(
      settings,
      profiles,
      partners,
      billing,
      () => TODAY,
    );
    stops.push(model.start());
    return model;
  };

  test("ui state mirrors stored settings", () => {
    const model = subscribed();

    settings.state.update((it) => ({
      ...it,
      soundEnabled: false,
      reducedMotion: true,
      weekStart: WeekStart.SUNDAY,
      showLunarInCalendar: false,
    }));

    expect(model.state.current()).toEqual({
      ...DEFAULT_ME_UI_STATE,
      soundEnabled: false,
      reducedMotion: true,
      weekStart: WeekStart.SUNDAY,
      showLunarInCalendar: false,
    });
  });

  test("controls write through to the repository", async () => {
    const model = subscribed();

    await model.setSoundEnabled(false);
    await model.setReducedMotion(true);
    await model.setWeekStart(WeekStart.SUNDAY);
    await model.setShowLunarInCalendar(false);

    expect(settings.current()).toEqual({
      ...DEFAULT_SETTINGS,
      soundEnabled: false,
      reducedMotion: true,
      weekStart: WeekStart.SUNDAY,
      showLunarInCalendar: false,
    });
  });

  test("summarizes the owner and counts everyone", async () => {
    const model = subscribed();

    profiles.state.set(TestProfiles.owner);
    await partners.add(TestProfiles.other, Relationship.FRIEND, TODAY);

    const state = model.state.current();
    expect(state.owner?.name).toBe("Lan");
    expect(state.owner?.lunarYear).not.toBeNull();
    expect(state.owner?.sunLongitude).not.toBeNull();
    expect(state.profileCount).toBe(2);
  });

  test("an owner born outside the calendar range still shows, without year or sign", () => {
    const model = subscribed();

    profiles.state.set({
      ...TestProfiles.owner,
      date: TestProfiles.outOfRange,
    });

    const owner = model.state.current().owner;
    expect(owner).not.toBeNull();
    expect(owner?.lunarYear).toBeNull();
    expect(owner?.sunLongitude).toBeNull();
  });

  test("shows the plan and the trial days left", () => {
    const model = subscribed();
    expect(model.state.current().premium).toBeNull();

    billing.membership.set(
      Membership.premium({
        plan: PremiumPlan.YEARLY,
        trialEndsOnEpochDay: TODAY + 6,
        renewsOnEpochDay: TODAY + 6,
      }),
    );

    expect(model.state.current().premium).toEqual({
      plan: PremiumPlan.YEARLY,
      trialDaysLeft: 6,
    });
  });

  test("a failed write keeps showing the stored value", async () => {
    const model = subscribed();
    settings.writeFailure = new Error("disk full");

    await model.setSoundEnabled(false);

    expect(model.state.current().soundEnabled).toBe(true);
  });
});
