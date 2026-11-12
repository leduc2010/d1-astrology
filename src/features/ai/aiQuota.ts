import { DEFAULT_ASK_LIMITS, type AskLimits } from '@/core/model';

/**
 * Today's question allowance (S06-05). Included questions are spent first, then the ones earned by
 * watching an ad. Both reset at local midnight. [premium] raises the included questions to the
 * Premium allowance and takes ads out of the picture. [limits] are tunable remotely.
 */
export type AiQuota = {
  readonly freeUsed: number;
  readonly adsWatched: number;
  readonly adCredits: number;
  readonly premium: boolean;
  readonly limits: AskLimits;
};

export function aiQuota(fields: Partial<AiQuota> = {}): AiQuota {
  return { freeUsed: 0, adsWatched: 0, adCredits: 0, premium: false, limits: DEFAULT_ASK_LIMITS, ...fields };
}

/** Questions included today before any ad. */
export const dailyAllowance = (q: AiQuota): number => (q.premium ? q.limits.premiumPerDay : q.limits.freePerDay);
export const freeLeft = (q: AiQuota): number => Math.max(dailyAllowance(q) - q.freeUsed, 0);
export const adsLeft = (q: AiQuota): number => (q.premium ? 0 : Math.max(q.limits.adsPerDay - q.adsWatched, 0));
export const questionsLeft = (q: AiQuota): number => freeLeft(q) + q.adCredits;
export const canAsk = (q: AiQuota): boolean => questionsLeft(q) > 0;
export const canWatchAd = (q: AiQuota): boolean => adsLeft(q) > 0;

/** False when ads are switched off: no ad pill and no "watch an ad" offer. */
export const offersAds = (q: AiQuota): boolean => !q.premium && q.limits.adsPerDay > 0;

/** Takes one question: free first, then an ad credit. Throws when nothing is left. */
export function spend(q: AiQuota): AiQuota {
  if (!canAsk(q)) throw new Error('No questions left today');
  return freeLeft(q) > 0 ? { ...q, freeUsed: q.freeUsed + 1 } : { ...q, adCredits: q.adCredits - 1 };
}

/** Where [spend] would take the next question from. */
export const spendSource = (q: AiQuota): 'free' | 'ad' => (freeLeft(q) > 0 ? 'free' : 'ad');

/** Gives back a question that got no answer (the online guide failed before writing anything). */
export function refund(q: AiQuota, source: 'free' | 'ad'): AiQuota {
  return source === 'free' ? { ...q, freeUsed: Math.max(q.freeUsed - 1, 0) } : { ...q, adCredits: q.adCredits + 1 };
}

/** One ad watched to the end earns one question, up to the day's ad limit. */
export function rewarded(q: AiQuota): AiQuota {
  return canWatchAd(q) ? { ...q, adsWatched: q.adsWatched + 1, adCredits: q.adCredits + 1 } : q;
}
