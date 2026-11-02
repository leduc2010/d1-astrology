import { getLocales } from 'expo-localization';

import { getAppLanguage, getDeviceLanguage, setAppLanguage, tf } from '..';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [
    { languageTag: 'ja-JP', languageCode: 'ja' },
    { languageTag: 'in-ID', languageCode: 'in' },
  ]),
}));

describe('start-up language', () => {
  it('initialises i18next in the first supported device language', () => {
    expect(getAppLanguage()).toBe('id');
    expect(tf('ai_quota_free', 1, 3)).not.toBe('Free 1/3');
  });

  it('goes back to the device language when the override is cleared', async () => {
    await setAppLanguage('de');
    expect(getAppLanguage()).toBe('de');
    await setAppLanguage(null);
    expect(getAppLanguage()).toBe('id');
  });

  it('falls back to English when expo-localization throws', () => {
    jest.mocked(getLocales).mockImplementationOnce(() => {
      throw new Error('unavailable');
    });
    expect(getDeviceLanguage()).toBe('en');
  });
});
