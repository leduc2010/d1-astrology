import { civilDate } from '../../../engine/time/civilDate';
import { PremiumPlan } from '../../model';
import { Membership, premiumOf, PurchaseResult } from '../billing/billing';
import { StubBilling } from '../billing/stubBilling';
import { epochDayOf, plusMonths } from '../time/epochDay';

// Port of StubBillingTest.
const today = epochDayOf(civilDate(2026, 11, 1));
const billing = () => new StubBilling(() => today, 0);

describe('StubBilling', () => {
  test('starts on the free plan, known at once', () => {
    expect(billing().membership.current()).toEqual(Membership.Free);
  });

  test('offers list the yearly plan first', async () => {
    const offers = await billing().offers();

    expect(offers.map((it) => it.plan)).toEqual([PremiumPlan.YEARLY, PremiumPlan.MONTHLY]);
    expect(offers[0]!.trialDays).toBeGreaterThan(0);
    expect(offers[offers.length - 1]!.trialDays).toBe(0);
  });

  test('yearly purchase starts a trial that ends when the plan renews', async () => {
    const stub = billing();
    expect(await stub.purchase(PremiumPlan.YEARLY)).toEqual(PurchaseResult.Success);

    const membership = premiumOf(stub.membership.current());
    const trialEnd = today + 7;
    expect(membership?.plan).toBe(PremiumPlan.YEARLY);
    expect(membership?.trialEndsOnEpochDay).toBe(trialEnd);
    expect(membership?.renewsOnEpochDay).toBe(trialEnd);
  });

  test('monthly purchase renews a month later without a trial', async () => {
    const stub = billing();
    await stub.purchase(PremiumPlan.MONTHLY);

    const membership = premiumOf(stub.membership.current());
    expect(membership?.trialEndsOnEpochDay).toBeNull();
    expect(membership?.renewsOnEpochDay).toBe(plusMonths(today, 1));
    expect(membership?.renewsOnEpochDay).toBe(epochDayOf(civilDate(2026, 12, 1)));
  });

  test('restore finds only a plan bought earlier', async () => {
    const stub = billing();
    expect(await stub.restore()).toBe(false);

    await stub.purchase(PremiumPlan.MONTHLY);

    expect(await stub.restore()).toBe(true);
  });
});
