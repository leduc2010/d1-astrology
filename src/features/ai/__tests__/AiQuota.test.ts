import { ASK_DEFAULT_ADS, ASK_DEFAULT_FREE, ASK_DEFAULT_PREMIUM } from '@/core/model';

import {
  adsLeft,
  aiQuota,
  canAsk,
  canWatchAd,
  dailyAllowance,
  offersAds,
  questionsLeft,
  rewarded,
  spend,
} from '../aiQuota';

// Port of AiQuotaTest.

test('a new day starts with three free questions and five ads', () => {
  const quota = aiQuota();

  expect(questionsLeft(quota)).toBe(ASK_DEFAULT_FREE);
  expect(adsLeft(quota)).toBe(ASK_DEFAULT_ADS);
  expect(canAsk(quota)).toBe(true);
});

test('free questions are spent before ad credits', () => {
  const quota = spend(rewarded(aiQuota()));

  expect(quota.freeUsed).toBe(1);
  expect(quota.adCredits).toBe(1);
});

test('an ad credit is spent once free questions are gone', () => {
  const quota = spend(rewarded(aiQuota({ freeUsed: ASK_DEFAULT_FREE })));

  expect(quota.adCredits).toBe(0);
  expect(quota.adsWatched).toBe(1);
  expect(canAsk(quota)).toBe(false);
});

test('spending with nothing left fails', () => {
  expect(() => spend(aiQuota({ freeUsed: ASK_DEFAULT_FREE }))).toThrow('No questions left today');
});

test('ads stop paying out after the daily cap', () => {
  let quota = aiQuota({ freeUsed: ASK_DEFAULT_FREE });
  for (let i = 0; i < ASK_DEFAULT_ADS + 2; i++) quota = rewarded(quota);

  expect(quota.adCredits).toBe(ASK_DEFAULT_ADS);
  expect(canWatchAd(quota)).toBe(false);
});

test('premium raises the daily allowance and takes ads away', () => {
  const quota = aiQuota({ freeUsed: ASK_DEFAULT_FREE, premium: true });

  expect(dailyAllowance(quota)).toBe(ASK_DEFAULT_PREMIUM);
  expect(questionsLeft(quota)).toBe(ASK_DEFAULT_PREMIUM - ASK_DEFAULT_FREE);
  expect(adsLeft(quota)).toBe(0);
  expect(canWatchAd(quota)).toBe(false);
  expect(rewarded(quota)).toEqual(quota);
});

test('limits from remote config replace the defaults', () => {
  const quota = aiQuota({ limits: { freePerDay: 5, adsPerDay: 2, premiumPerDay: 50 } });

  expect(questionsLeft(quota)).toBe(5);
  expect(adsLeft(quota)).toBe(2);
  expect(dailyAllowance({ ...quota, premium: true })).toBe(50);
});

test('no ads a day means no ad offer and no rewards', () => {
  const quota = aiQuota({ freeUsed: 1, limits: { freePerDay: 1, adsPerDay: 0, premiumPerDay: ASK_DEFAULT_PREMIUM } });

  expect(offersAds(quota)).toBe(false);
  expect(canWatchAd(quota)).toBe(false);
  expect(rewarded(quota)).toEqual(quota);
});
