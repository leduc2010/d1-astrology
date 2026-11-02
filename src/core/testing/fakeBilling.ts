import type { PremiumMembership, PremiumPlan } from '../model';
import { Membership, premiumOf, PurchaseResult, type Billing, type PlanOffer } from '../data/billing/billing';
import { STUB_OFFERS } from '../data/billing/stubBilling';
import { MutableState } from '../data/state/state';

/** Same sample plans as the stub store. */
export const SAMPLE_OFFERS: readonly PlanOffer[] = STUB_OFFERS;

const GRANTED_RENEWAL_EPOCH_DAY = 20_000;

/** What a successful fake purchase grants: no trial, renewing on a fixed day. */
export function grantOnSuccess(plan: PremiumPlan): PremiumMembership {
  return Object.freeze({ plan, trialEndsOnEpochDay: null, renewsOnEpochDay: GRANTED_RENEWAL_EPOCH_DAY });
}

/** Answers at once. [nextResult] decides the next purchase; success grants [grantOnSuccess]. */
export class FakeBilling implements Billing {
  readonly membership = new MutableState<Membership>(Membership.Free);
  /** What [restore] finds; null means nothing was bought before. */
  restorable: PremiumMembership | null = null;

  private readonly purchases: PremiumPlan[] = [];

  constructor(
    public availableOffers: readonly PlanOffer[] = SAMPLE_OFFERS,
    public nextResult: PurchaseResult = PurchaseResult.Success,
  ) {}

  get purchased(): readonly PremiumPlan[] {
    return [...this.purchases];
  }

  async offers(): Promise<readonly PlanOffer[]> {
    return this.availableOffers;
  }

  async purchase(plan: PremiumPlan): Promise<PurchaseResult> {
    this.purchases.push(plan);
    const result = this.nextResult;
    if (result.kind === 'success') this.membership.set(Membership.premium(grantOnSuccess(plan)));
    return result;
  }

  async restore(): Promise<boolean> {
    const found = this.restorable ?? premiumOf(this.membership.current());
    if (found) this.membership.set(Membership.premium(found));
    return found !== null;
  }
}
