import { Relationship } from "@/core/model";
import {
  FakePartnerRepository,
  FakeProfileRepository,
  TestProfiles,
} from "@/core/testing";
import { ProfilesModel } from "../profilesModel";

describe("ProfilesViewModel", () => {
  let profiles: FakeProfileRepository;
  let partners: FakePartnerRepository;
  const stops: (() => void)[] = [];

  beforeEach(() => {
    profiles = new FakeProfileRepository(TestProfiles.owner);
    partners = new FakePartnerRepository();
  });

  afterEach(() => stops.splice(0).forEach((stop) => stop()));

  const subscribed = (): ProfilesModel => {
    const model = new ProfilesModel(profiles, partners);
    stops.push(model.start());
    return model;
  };

  test("lists the owner and everyone added, with relationship and date", async () => {
    const model = subscribed();

    await partners.add(TestProfiles.other, Relationship.PARTNER, 20_100);

    const state = model.state.current();
    expect(state.owner?.name).toBe("Lan");
    expect(state.others).toHaveLength(1);
    const other = state.others[0]!;
    expect(other.relationship).toBe(Relationship.PARTNER);
    expect(other.addedOnEpochDay).toBe(20_100);
    expect(other.person.hasBirthTime).toBe(false);
  });

  test("delete removes the person", async () => {
    const model = subscribed();
    const id = await partners.add(TestProfiles.other, Relationship.FRIEND, 1);

    await model.delete(id);

    expect(model.state.current().others).toEqual([]);
    expect(model.state.current().deleteFailed).toBe(false);
  });

  test("a failed delete keeps the person and says so, until the next try", async () => {
    const model = subscribed();
    const id = await partners.add(TestProfiles.other, Relationship.FRIEND, 1);
    partners.removeFailure = new Error("disk full");

    await model.delete(id);
    expect(model.state.current().deleteFailed).toBe(true);
    expect(model.state.current().others).toHaveLength(1);

    partners.removeFailure = null;
    await model.delete(id);
    expect(model.state.current().deleteFailed).toBe(false);
    expect(model.state.current().others).toEqual([]);
  });
});
