import type { PremiumMembership, PremiumPlan } from '../../model';
import type { ReadonlyState } from '../state/state';

/**
 * One plan as the store sells it. Prices come from the store in the buyer's currency, so they
 * are data here, never strings in the app.
 */
export interface PlanOffer {
  readonly plan: PremiumPlan;
  readonly priceMicros: number;
  readonly currencyCode: string;
  /** Free days before the first charge; 0 when the plan has no trial. */
  readonly trialDays: number;
}

export function planOffer(plan: PremiumPlan, priceMicros: number, currencyCode: string, trialDays: number): PlanOffer {
  return Object.freeze({ plan, priceMicros, currencyCode, trialDays });
}

/**
 * What the store says about the owner's subscription. `unknown` means the store has not answered
 * yet (cold start) and counts as neither: no ad slots, no Premium.
 */
export type Membership =
  | { readonly kind: 'unknown' }
  | { readonly kind: 'free' }
  | { readonly kind: 'premium'; readonly details: PremiumMembership };

// A type and its values share one name, like a Kotlin sealed interface and its objects.
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Membership = Object.freeze({
  Unknown: Object.freeze({ kind: 'unknown' }) as Membership,
  Free: Object.freeze({ kind: 'free' }) as Membership,
  premium: (details: PremiumMembership): Membership => Object.freeze({ kind: 'premium', details }),
});

/** The active subscription, or null when free or not known yet. */
export function premiumOf(membership: Membership): PremiumMembership | null {
  return membership.kind === 'premium' ? membership.details : null;
}

/**
 * `cancelled`: the buyer closed the store sheet, nothing to report. `failed`: the store declined
 * or failed and nothing was charged; [code] is the store's own error code.
 */
export type PurchaseResult =
  | { readonly kind: 'success' }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'failed'; readonly code: string };

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const PurchaseResult = Object.freeze({
  Success: Object.freeze({ kind: 'success' }) as PurchaseResult,
  Cancelled: Object.freeze({ kind: 'cancelled' }) as PurchaseResult,
  failed: (code: string): PurchaseResult => Object.freeze({ kind: 'failed', code }),
});

/**
 * Premium subscriptions. The store SDK lives behind this interface; it is told which plan, and
 * nothing about the owner (never their birth data).
 */
export interface Billing {
  /** Unknown until the store first answers, then free or premium. */
  readonly membership: ReadonlyState<Membership>;
  /** Plans on sale, yearly first. Empty when the store cannot be reached. */
  offers(): Promise<readonly PlanOffer[]>;
  /** Must settle (with a result or a rejection) even when the store never answers. */
  purchase(plan: PremiumPlan): Promise<PurchaseResult>;
  /** Looks for a subscription bought earlier (new phone, reinstall). True when one was found. */
  restore(): Promise<boolean>;
}
