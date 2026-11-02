import { delay } from '../time/delay';

/**
 * A full-screen rewarded ad. The real SDK lives behind this interface; nothing about the owner
 * (and never their birth data) is passed to it.
 */
export interface RewardedAds {
  /** Shows one ad and resolves true when it was watched to the end and the reward is earned. */
  show(): Promise<boolean>;
}

const STUB_AD_MILLIS = 1_200;

/** Offline stand-in: a short pause, then the reward. No SDK, no IDs. */
export class StubRewardedAds implements RewardedAds {
  constructor(private readonly durationMillis: number = STUB_AD_MILLIS) {}

  async show(): Promise<boolean> {
    await delay(this.durationMillis);
    return true;
  }
}
