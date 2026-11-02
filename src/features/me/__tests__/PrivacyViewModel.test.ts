import { DataEraser, EraseStatus } from "@/core/data";
import { DEFAULT_SETTINGS, Relationship } from "@/core/model";
import {
  FakePartnerRepository,
  FakeProfileRepository,
  FakeSettingsRepository,
  TestProfiles,
} from "@/core/testing";
import { DEFAULT_PRIVACY_UI_STATE, PrivacyModel } from "../privacyModel";

describe("PrivacyViewModel", () => {
  let settings: FakeSettingsRepository;
  let profiles: FakeProfileRepository;
  let partners: FakePartnerRepository;
  const stops: (() => void)[] = [];

  beforeEach(() => {
    settings = new FakeSettingsRepository({
      ...DEFAULT_SETTINGS,
      onboardingCompleted: true,
      soundEnabled: false,
    });
    profiles = new FakeProfileRepository(TestProfiles.owner);
    partners = new FakePartnerRepository();
  });

  afterEach(() => stops.splice(0).forEach((stop) => stop()));

  const newEraser = () => new DataEraser(partners, profiles, settings);

  const subscribed = (eraser: DataEraser = newEraser()): PrivacyModel => {
    const model = new PrivacyModel(settings, eraser);
    stops.push(model.start());
    return model;
  };

  test("each consent switches on its own", async () => {
    const model = subscribed();

    await model.setPersonalizedAds(true);
    expect(model.state.current()).toEqual({
      ...DEFAULT_PRIVACY_UI_STATE,
      personalizedAds: true,
    });

    await model.setPersonalizedTips(true);
    await model.setAnalytics(true);
    await model.setPersonalizedAds(false);
    expect(model.state.current()).toEqual({
      ...DEFAULT_PRIVACY_UI_STATE,
      personalizedTips: true,
      analytics: true,
    });
  });

  test("erase forgets everyone, the owner and every setting", async () => {
    const model = subscribed();
    await partners.add(TestProfiles.other, Relationship.FRIEND, 1);

    await model.eraseAll();

    expect(model.state.current().erase).toBe(EraseStatus.Done);
    expect(partners.current()).toEqual([]);
    expect(profiles.saved).toBeNull();
    expect(settings.current()).toEqual(DEFAULT_SETTINGS);
  });

  test("a failed erase says so and never leaves other people behind the owner", async () => {
    const model = subscribed();
    await partners.add(TestProfiles.other, Relationship.FRIEND, 1);
    partners.clearFailure = new Error("disk full");

    await model.eraseAll();

    expect(model.state.current().erase).toBe(EraseStatus.Failed);
    expect(profiles.saved?.name).toBe("Lan");

    partners.clearFailure = null;
    await model.eraseAll();
    expect(model.state.current().erase).toBe(EraseStatus.Done);
  });

  test("settings left behind after the profile went are reported, not skipped", async () => {
    const eraser = newEraser();
    const model = subscribed(eraser);
    settings.clearFailure = new Error("disk full");

    await model.eraseAll();

    expect(profiles.saved).toBeNull();
    expect(eraser.status.current()).toBe(EraseStatus.Failed);
    expect(model.state.current().erase).toBe(EraseStatus.Failed);

    settings.clearFailure = null;
    await eraser.eraseAll();
    expect(eraser.status.current()).toBe(EraseStatus.Done);
    expect(settings.current()).toEqual(DEFAULT_SETTINGS);
  });

  test("an erase from before onboarding is not shown on a later visit", async () => {
    const eraser = newEraser();
    await eraser.eraseAll();

    expect(subscribed(eraser).state.current().erase).toBe(EraseStatus.Idle);
  });
});
