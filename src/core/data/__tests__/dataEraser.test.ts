import { DEFAULT_SETTINGS, Relationship } from '../../model';
import { FakePartnerRepository } from '../../testing/fakePartnerRepository';
import { FakeProfileRepository } from '../../testing/fakeProfileRepository';
import { FakeSettingsRepository } from '../../testing/fakeSettingsRepository';
import { TestProfiles } from '../../testing/testProfiles';
import { DataEraser, EraseStatus } from '../dataEraser';

const setup = async () => {
  const partners = new FakePartnerRepository();
  const profile = new FakeProfileRepository(TestProfiles.owner);
  const settings = new FakeSettingsRepository();
  await partners.add(TestProfiles.other, Relationship.FRIEND, 20_000);
  await settings.setOnboardingCompleted(true);
  await settings.setLanguage('vi');
  return { partners, profile, settings, eraser: new DataEraser(partners, profile, settings) };
};

describe('DataEraser', () => {
  test('erases partners, profile and settings, then reports done', async () => {
    const { partners, profile, settings, eraser } = await setup();
    expect(eraser.status.current()).toBe(EraseStatus.Idle);

    const erasing = eraser.eraseAll();
    expect(eraser.status.current()).toBe(EraseStatus.Erasing);
    await erasing;

    expect(eraser.status.current()).toBe(EraseStatus.Done);
    expect(partners.current()).toEqual([]);
    expect(profile.saved).toBeNull();
    expect(settings.current()).toEqual({ ...DEFAULT_SETTINGS, language: 'vi' });
  });

  test('a failing store reports failed and keeps later stores, then a retry succeeds', async () => {
    const { partners, profile, eraser } = await setup();
    profile.clearFailure = new Error('disk full');

    await eraser.eraseAll();

    expect(eraser.status.current()).toBe(EraseStatus.Failed);
    expect(partners.current()).toEqual([]);
    expect(profile.saved).not.toBeNull();

    profile.clearFailure = null;
    await eraser.eraseAll();
    expect(eraser.status.current()).toBe(EraseStatus.Done);
    expect(profile.saved).toBeNull();
  });

  test('a second call while erasing joins the first', async () => {
    const { partners, eraser } = await setup();
    const clear = jest.spyOn(partners, 'clear');

    const first = eraser.eraseAll();
    const second = eraser.eraseAll();

    expect(second).toBe(first);
    await second;
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
