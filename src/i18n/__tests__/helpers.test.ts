import { act, renderHook } from '@testing-library/react-native';

import { getAppLanguage, getAppLanguageOverride, setAppLanguage, ta, tf, tp, useT } from '..';
import { positionalParams } from '../helpers';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', languageCode: 'en' }],
}));

afterEach(async () => {
  await setAppLanguage(null);
});

describe('positionalParams', () => {
  it('numbers args from p1', () => {
    expect(positionalParams(['a', 2])).toEqual({ p1: 'a', p2: '2' });
  });
});

describe('English', () => {
  it('starts in the device language', () => {
    expect(getAppLanguage()).toBe('en');
    expect(getAppLanguageOverride()).toBeNull();
  });

  it('fills positional placeholders', () => {
    expect(tf('ai_quota_free', 2, 3)).toBe('Free 2/3');
    expect(tf('charts_sign_degree', 'Leo', 12)).toBe('Leo 12°');
  });

  it('turns %% into a literal percent', () => {
    expect(tf('premium_save', 40)).toBe('Save 40%');
  });

  it('picks plural forms by count', () => {
    expect(tp('me_profiles_count', 1, 1)).toBe('1 profile');
    expect(tp('me_profiles_count', 5, 5)).toBe('5 profiles');
    expect(tp('premium_trial_note', 7, 7, 'Nov 9')).toBe('Free for 7 days, first charge on Nov 9');
  });

  it('returns string arrays', () => {
    const directions = ta('almanac_directions');
    expect(directions).toHaveLength(8);
    expect(directions[0]).toBe('North');
  });
});

describe('Vietnamese', () => {
  beforeEach(async () => {
    await setAppLanguage('vi');
  });

  it('switches language and remembers the override', () => {
    expect(getAppLanguage()).toBe('vi');
    expect(getAppLanguageOverride()).toBe('vi');
  });

  it('fills placeholders and uses the single "other" plural form', () => {
    expect(tf('ai_quota_free', 2, 3)).toBe('Miễn phí 2/3');
    expect(tp('me_profiles_count', 1, 1)).toBe(tp('me_profiles_count', 5, 1));
    expect(ta('almanac_directions')[0]).toBe('Bắc');
  });

  it('falls back to English for translatable="false" strings', () => {
    expect(tf('charts_sign_degree', 'Sư Tử', 12)).toBe('Sư Tử 12°');
  });
});

describe('plural categories beyond one/other', () => {
  it('uses Russian few/many', async () => {
    await setAppLanguage('ru');
    expect(tp('me_profiles_count', 21, 21)).toBe('21 профиль');
    expect(tp('me_profiles_count', 3, 3)).toBe('3 профиля');
    expect(tp('me_profiles_count', 5, 5)).toBe('5 профилей');
  });

  it('uses Arabic zero', async () => {
    await setAppLanguage('ar');
    expect(tp('me_profiles_count', 0, 0)).toBe('لا توجد ملفات');
  });
});

describe('useT', () => {
  it('re-renders with the new language', async () => {
    const { result } = await renderHook(() => useT());
    expect(result.current.language).toBe('en');
    expect(result.current.tf('ai_quota_free', 1, 3)).toBe('Free 1/3');
    await act(async () => {
      await setAppLanguage('vi');
    });
    expect(result.current.language).toBe('vi');
    expect(result.current.tf('ai_quota_free', 1, 3)).toBe('Miễn phí 1/3');
    expect(result.current.tp('me_profiles_count', 2, 2)).toBe('2 hồ sơ');
  });
});
