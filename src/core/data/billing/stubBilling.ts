import { PremiumPlan, todayEpochDay } from '../../model';
import { MutableState, type ReadonlyState } from '../state/state';
import { delay } from '../time/delay';
import { plusMonths, plusYears } from '../time/epochDay';
import { Membership, planOffer, PurchaseResult, type Billing, type PlanOffer } from './billing';

const STUB_STORE_MILLIS = 1_000;
const TRIAL_DAYS = 7;

/** Sample prices for the test build only; a real store supplies its own. */
export const STUB_OFFERS: readonly PlanOffer[] = Object.freeze([
  planOffer(PremiumPlan.YEARLY, 32_990_000, 'USD', TRIAL_DAYS),
  planOffer(PremiumPlan.MONTHLY, 4_990_000, 'USD', 0),
]);

/**
 * Offline stand-in for the store: sample prices, a short pause, then success. No SDK, no product
 * IDs, no money. The membership lives in memory only, so every launch starts on the free plan.
 * [today] gives the local date as an epoch day.
 */
export class StubBilling implements Billing {
  // Known at once: there is no store to ask.
  private readonly state = new MutableState<Membership>(Membership.Free);
  readonly membership: ReadonlyState<Membership> = this.state;

  constructor(
    private readonly today: () => number = () => todayEpochDay(),
    private readonly delayMillis: number = STUB_STORE_MILLIS,
  ) {}

  async offers(): Promise<readonly PlanOffer[]> {
    await delay(Math.trunc(this.delayMillis / 2));
    return STUB_OFFERS;
  }

  async purchase(plan: PremiumPlan): Promise<PurchaseResult> {
    await delay(this.delayMillis);
    const offer = STUB_OFFERS.find((it) => it.plan === plan);
    if (!offer) throw new RangeError(`no offer for plan: ${plan}`);
    const start = this.today();
    const trialEnd = offer.trialDays > 0 ? start + offer.trialDays : null;
    const renews = trialEnd ?? (plan === PremiumPlan.YEARLY ? plusYears(start, 1) : plusMonths(start, 1));
    this.state.set(
      Membership.premium(Object.freeze({ plan, trialEndsOnEpochDay: trialEnd, renewsOnEpochDay: renews })),
    );
    return PurchaseResult.Success;
  }

  async restore(): Promise<boolean> {
    await delay(this.delayMillis);
    return this.state.current().kind === 'premium';
  }
}
