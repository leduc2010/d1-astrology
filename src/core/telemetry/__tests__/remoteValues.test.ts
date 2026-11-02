import { AD_PLACEMENTS, AdPlacement, ASK_DEFAULT_FREE } from '../../model';
import {
  adsConfig,
  DEFAULT_REMOTE_VALUES,
  REMOTE_DEFAULTS,
  type RemoteKey,
  RemoteKeys,
  remoteValuesFrom,
  TEST_UNIT_IDS,
  unitIdFor,
} from '..';

function valuesOf(pairs: Partial<Record<RemoteKey, string>> = {}) {
  return remoteValuesFrom((key) => pairs[key] ?? '');
}

describe('RemoteValues', () => {
  test('the parsed defaults match the in-code defaults', () => {
    expect(valuesOf()).toEqual(DEFAULT_REMOTE_VALUES);
    expect(remoteValuesFrom((key) => REMOTE_DEFAULTS[key])).toEqual(DEFAULT_REMOTE_VALUES);
  });

  test('invalid values fall back to the defaults and numbers are clamped', () => {
    const values = valuesOf({
      [RemoteKeys.PREMIUM_ENABLED]: 'maybe',
      [RemoteKeys.ASK_FREE_PER_DAY]: 'lots',
      [RemoteKeys.ASK_ADS_PER_DAY]: '99',
      [RemoteKeys.ASK_PREMIUM_PER_DAY]: '-4',
      [RemoteKeys.AD_ENABLE_PLACEMENT]: '{not json',
    });

    expect(values.premiumEnabled).toBe(true);
    expect(values.askLimits).toEqual({ freePerDay: ASK_DEFAULT_FREE, adsPerDay: 10, premiumPerDay: ASK_DEFAULT_FREE });
    expect(values.ads.enabled).toEqual(new Set(AD_PLACEMENTS));
  });

  test('only placements switched on with a real boolean show, and unknown keys are ignored', () => {
    const values = valuesOf({
      [RemoteKeys.AD_ENABLE_PLACEMENT]:
        '{"calendar_native": false, "today_native": true, "day_native": "yes", "ai_rewarded": true}',
    });

    expect(values.ads.enabled).toEqual(new Set([AdPlacement.AI_REWARDED]));
  });

  test('the master switch turns every ad off, and with it ad questions', () => {
    const values = valuesOf({ [RemoteKeys.ADS_ENABLED]: 'false' });

    expect(values.ads.enabled.size).toBe(0);
    expect(values.askLimits.adsPerDay).toBe(0);
  });

  test('no rewarded ad means no ad questions', () => {
    const values = valuesOf({ [RemoteKeys.AD_ENABLE_PLACEMENT]: '{"calendar_native": true, "day_native": true}' });

    expect(values.askLimits.adsPerDay).toBe(0);
  });

  test('only well-formed unit IDs are kept', () => {
    const good = 'ca-app-pub-1234567890123456/1234567890';
    const values = valuesOf({
      [RemoteKeys.AD_UNIT_ID_PLACEMENT]: `{"calendar_native": "${good}", "day_native": "ca-app-pub-123/456", "ai_rewarded": 7}`,
    });

    expect(values.ads.unitIds).toEqual({ [AdPlacement.CALENDAR_NATIVE]: good });
  });

  test('debug builds always load test IDs and release builds load nothing without a remote ID', () => {
    const ads = adsConfig([AdPlacement.DAY_NATIVE]);

    expect(unitIdFor(ads, AdPlacement.DAY_NATIVE, true)).toBe(TEST_UNIT_IDS.native);
    expect(unitIdFor(ads, AdPlacement.DAY_NATIVE, false)).toBeNull();
    expect(unitIdFor(ads, AdPlacement.CALENDAR_NATIVE, true)).toBeNull();
  });

  test('premium never gets fewer questions than free, and fractions are not integers', () => {
    const values = valuesOf({ [RemoteKeys.ASK_FREE_PER_DAY]: '12', [RemoteKeys.ASK_PREMIUM_PER_DAY]: '2.5' });

    expect(values.askLimits.freePerDay).toBe(12);
    expect(values.askLimits.premiumPerDay).toBe(30);
  });
});
