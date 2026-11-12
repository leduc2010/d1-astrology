/**
 * App-wide data types, ported from the Kotlin `core/model` module.
 * Plain immutable records; factories validate like the Kotlin `init` blocks.
 */

/** How an ad is shown. No unit IDs live in the repo; a real build supplies them from remote config. */
export enum AdFormat {
  NATIVE = 'native',
  REWARDED = 'rewarded',
}

/**
 * Every place an ad may appear. Remote config can switch these on or off but never adds one:
 * readings, Ask AI answers, matches and Today have no placement.
 */
export enum AdPlacement {
  CALENDAR_NATIVE = 'calendar_native',
  DAY_NATIVE = 'day_native',
  AI_REWARDED = 'ai_rewarded',
}

export const AD_PLACEMENTS: readonly AdPlacement[] = [
  AdPlacement.CALENDAR_NATIVE,
  AdPlacement.DAY_NATIVE,
  AdPlacement.AI_REWARDED,
];

export function adFormatOf(placement: AdPlacement): AdFormat {
  return placement === AdPlacement.AI_REWARDED ? AdFormat.REWARDED : AdFormat.NATIVE;
}

/** Where the legal pages and support inbox live, set per build. A blank one hides its link. */
export interface AppLinks {
  readonly termsUrl: string;
  readonly privacyUrl: string;
  readonly supportEmail: string;
}

export const EMPTY_APP_LINKS: AppLinks = Object.freeze({ termsUrl: '', privacyUrl: '', supportEmail: '' });

export const hasLegal = (links: AppLinks): boolean =>
  links.termsUrl.trim() !== '' || links.privacyUrl.trim() !== '';
export const hasAnyLink = (links: AppLinks): boolean => hasLegal(links) || links.supportEmail.trim() !== '';

/** The daily Ask AI allowance: included, earned by ads (0 when off), and for Premium members. */
export interface AskLimits {
  readonly freePerDay: number;
  readonly adsPerDay: number;
  readonly premiumPerDay: number;
}

export const ASK_DEFAULT_FREE = 3;
export const ASK_DEFAULT_ADS = 5;
export const ASK_DEFAULT_PREMIUM = 30;

export const DEFAULT_ASK_LIMITS: AskLimits = Object.freeze({
  freePerDay: ASK_DEFAULT_FREE,
  adsPerDay: ASK_DEFAULT_ADS,
  premiumPerDay: ASK_DEFAULT_PREMIUM,
});

/** Used by Tử Vi and Bát Tự to set the direction of the luck cycles. */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

const MINUTES_PER_HOUR = 60;

/** Clock time of birth as written on the certificate (local civil time). */
export interface BirthClock {
  readonly hour: number;
  readonly minute: number;
}

export function birthClock(hour: number, minute: number): BirthClock {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new RangeError(`hour out of range: ${hour}`);
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new RangeError(`minute out of range: ${minute}`);
  return Object.freeze({ hour, minute });
}

export const minutesOfDay = (clock: BirthClock): number => clock.hour * MINUTES_PER_HOUR + clock.minute;

/**
 * Where someone was born. [zoneId] is an IANA zone or a fixed offset like "+05:30"; the civil
 * offset for a date is resolved from it (with Vietnam's North/South history).
 */
export interface BirthPlace {
  readonly name: string;
  readonly region: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly zoneId: string;
}

export function birthPlace(name: string, region: string, latitude: number, longitude: number, zoneId: string): BirthPlace {
  if (!(latitude >= -90 && latitude <= 90)) throw new RangeError(`latitude out of range: ${latitude}`);
  if (!(longitude >= -180 && longitude <= 180)) throw new RangeError(`longitude out of range: ${longitude}`);
  return Object.freeze({ name, region, latitude, longitude, zoneId });
}

/** Solar (Gregorian) calendar date. */
export interface BirthDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/**
 * The owner's birth data. The date is always solar; [enteredAsLunar] remembers how it was typed.
 * A null [clock] means the time of birth is unknown.
 */
export interface BirthProfile {
  readonly name: string;
  readonly gender: Gender;
  readonly date: BirthDate;
  readonly clock: BirthClock | null;
  readonly place: BirthPlace;
  readonly enteredAsLunar: boolean;
}

/** How the other person is related to the owner; only shapes the wording of a match. */
export enum Relationship {
  PARTNER = 'PARTNER',
  SPOUSE = 'SPOUSE',
  FRIEND = 'FRIEND',
  COLLEAGUE = 'COLLEAGUE',
}

export const RELATIONSHIPS: readonly Relationship[] = [
  Relationship.PARTNER,
  Relationship.SPOUSE,
  Relationship.FRIEND,
  Relationship.COLLEAGUE,
];

/**
 * Someone the owner compares charts with. Added only with their consent, stays on this device.
 * [addedOnEpochDay] is the local date it was added, in days since 1970-01-01.
 */
export interface Partner {
  readonly id: number;
  readonly profile: BirthProfile;
  readonly relationship: Relationship;
  readonly addedOnEpochDay: number;
}

export enum PremiumPlan {
  YEARLY = 'YEARLY',
  MONTHLY = 'MONTHLY',
}

/** An active Premium subscription. Dates are local epoch days. */
export interface PremiumMembership {
  readonly plan: PremiumPlan;
  /** The day the free trial ends and the first charge happens; null without a trial. */
  readonly trialEndsOnEpochDay: number | null;
  /** The next billing date (the first charge during a trial). */
  readonly renewsOnEpochDay: number;
}

/** Whole days of trial left on [todayEpochDay]; null when there is no trial or it has ended. */
export function trialDaysLeft(membership: PremiumMembership, todayEpochDay: number): number | null {
  if (membership.trialEndsOnEpochDay === null) return null;
  const left = membership.trialEndsOnEpochDay - todayEpochDay;
  return left > 0 ? left : null;
}

/** The first column of the month grid. */
export enum WeekStart {
  MONDAY = 'MONDAY',
  SUNDAY = 'SUNDAY',
}

/** App-level preferences persisted on device. Consents default to off until answered. */
export interface UserSettings {
  readonly soundEnabled: boolean;
  readonly reducedMotion: boolean;
  readonly onboardingCompleted: boolean;
  readonly personalizedTips: boolean;
  readonly analyticsConsent: boolean;
  /** Ads may be chosen by interest. Never uses birth data, whatever the answer. */
  readonly personalizedAds: boolean;
  readonly weekStart: WeekStart;
  /** The small lunar day under each date of the month grid. */
  readonly showLunarInCalendar: boolean;
  /**
   * Ask AI may send the question and a chart summary (never name or birth details) to the AI
   * proxy. RN-only: the Kotlin app has no online AI. Off until the owner agrees.
   */
  readonly aiConsent: boolean;
  /** Chosen app language code; null follows the device. RN-only: Android keeps this in per-app locales. */
  readonly language: string | null;
}

export const DEFAULT_SETTINGS: UserSettings = Object.freeze({
  soundEnabled: true,
  reducedMotion: false,
  onboardingCompleted: false,
  personalizedTips: false,
  analyticsConsent: false,
  personalizedAds: false,
  weekStart: WeekStart.MONDAY,
  showLunarInCalendar: true,
  aiConsent: false,
  language: null,
});

const MS_PER_DAY = 86_400_000;

/** Today's local date as days since 1970-01-01, like `LocalDate.now().toEpochDay()`. */
export function todayEpochDay(now: Date = new Date()): number {
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / MS_PER_DAY);
}
