import { PremiumPlan } from '../../model';
import { FakeBilling, grantOnSuccess } from '../../testing/fakeBilling';
import { Membership, PurchaseResult } from '../billing/billing';
import { StubBilling } from '../billing/stubBilling';
import { EraseStatus } from '../dataEraser';
import { createAppServices } from '../services';
import { MemoryKeyValueStore } from '../storage/keyValueStore';

describe('createAppServices', () => {
  test('defaults to stubs and wires the eraser to the same stores', async () => {
    const services = createAppServices(new MemoryKeyValueStore());
    expect(services.billing).toBeInstanceOf(StubBilling);
    await expect(services.rewardedAds.show()).resolves.toBe(true);

    await services.settings.setOnboardingCompleted(true);
    await services.eraser.eraseAll();

    expect(services.eraser.status.current()).toBe(EraseStatus.Done);
    expect((await services.settings.load()).onboardingCompleted).toBe(false);
  });

  test('overrides replace the billing', () => {
    const billing = new FakeBilling();
    expect(createAppServices(new MemoryKeyValueStore(), { billing }).billing).toBe(billing);
  });
});

describe('FakeBilling', () => {
  test('success grants the plan, a failure leaves the membership alone', async () => {
    const billing = new FakeBilling(undefined, PurchaseResult.failed('E_DECLINED'));
    expect(await billing.purchase(PremiumPlan.YEARLY)).toEqual(PurchaseResult.failed('E_DECLINED'));
    expect(billing.membership.current()).toEqual(Membership.Free);

    billing.nextResult = PurchaseResult.Success;
    await billing.purchase(PremiumPlan.MONTHLY);

    expect(billing.membership.current()).toEqual(Membership.premium(grantOnSuccess(PremiumPlan.MONTHLY)));
    expect(billing.purchased).toEqual([PremiumPlan.YEARLY, PremiumPlan.MONTHLY]);
  });
});
