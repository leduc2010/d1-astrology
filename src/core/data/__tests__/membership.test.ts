import { PremiumPlan } from '../../model';
import { Membership, premiumOf } from '../billing/billing';

// Port of MembershipTest.
describe('Membership', () => {
  test('only a known subscription has details', () => {
    const details = { plan: PremiumPlan.MONTHLY, trialEndsOnEpochDay: null, renewsOnEpochDay: 20_000 };

    expect(premiumOf(Membership.Unknown)).toBeNull();
    expect(premiumOf(Membership.Free)).toBeNull();
    expect(premiumOf(Membership.premium(details))).toEqual(details);
  });
});
