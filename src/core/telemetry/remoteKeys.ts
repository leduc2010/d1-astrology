/** Remote config keys and their in-app defaults (the app behaves the same with no backend). */
export const RemoteKeys = Object.freeze({
  PREMIUM_ENABLED: 'premium_enabled',
  ASK_FREE_PER_DAY: 'ask_free_per_day',
  ASK_ADS_PER_DAY: 'ask_ads_per_day',
  ASK_PREMIUM_PER_DAY: 'ask_premium_per_day',
  ADS_ENABLED: 'ads_enabled',
  AD_ENABLE_PLACEMENT: 'ad_enable_placement',
  AD_UNIT_ID_PLACEMENT: 'ad_unit_id_placement',
});

export type RemoteKey = (typeof RemoteKeys)[keyof typeof RemoteKeys];

export const REMOTE_DEFAULTS: Readonly<Record<RemoteKey, string>> = Object.freeze({
  [RemoteKeys.PREMIUM_ENABLED]: 'true',
  [RemoteKeys.ASK_FREE_PER_DAY]: '3',
  [RemoteKeys.ASK_ADS_PER_DAY]: '5',
  [RemoteKeys.ASK_PREMIUM_PER_DAY]: '30',
  [RemoteKeys.ADS_ENABLED]: 'true',
  [RemoteKeys.AD_ENABLE_PLACEMENT]: '{"calendar_native":true,"day_native":true,"ai_rewarded":true}',
  // Empty: no unit ID ships in the repo, so release builds load nothing until remote config has one.
  [RemoteKeys.AD_UNIT_ID_PLACEMENT]: '{}',
});
