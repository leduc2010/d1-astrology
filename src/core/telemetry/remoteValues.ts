import { AD_PLACEMENTS, AdFormat, adFormatOf, AdPlacement, type AskLimits, DEFAULT_ASK_LIMITS } from '../model';
import { REMOTE_DEFAULTS, type RemoteKey, RemoteKeys } from './remoteKeys';

/** Reads one raw remote value; empty when the key is unknown. */
export type RemoteSource = (key: RemoteKey) => string;

/** Google's published test units, loaded by debug builds only. */
export const TEST_UNIT_IDS: Readonly<Record<AdFormat, string>> = Object.freeze({
  [AdFormat.NATIVE]: 'ca-app-pub-3940256099942544/2247696110',
  [AdFormat.REWARDED]: 'ca-app-pub-3940256099942544/5224354917',
});

/**
 * Which placements may show, and their AdMob unit IDs. Placements are fixed in code: remote
 * config can only switch them on or off, never add one to a screen that has none.
 */
export interface AdsConfig {
  readonly enabled: ReadonlySet<AdPlacement>;
  readonly unitIds: Readonly<Partial<Record<AdPlacement, string>>>;
}

export function adsConfig(
  enabled: Iterable<AdPlacement> = AD_PLACEMENTS,
  unitIds: Partial<Record<AdPlacement, string>> = {},
): AdsConfig {
  return Object.freeze({ enabled: new Set(enabled), unitIds: Object.freeze({ ...unitIds }) });
}

/**
 * The unit ID to load: Google's test ID in debug builds, otherwise the remote one. Null when the
 * placement is off or has no valid ID, so nothing real loads by default.
 */
export function unitIdFor(ads: AdsConfig, placement: AdPlacement, isDebug: boolean): string | null {
  if (!ads.enabled.has(placement)) return null;
  if (isDebug) return TEST_UNIT_IDS[adFormatOf(placement)];
  return ads.unitIds[placement] ?? null;
}

/** The app's remote-tunable values, already checked and clamped to safe ranges. */
export interface RemoteValues {
  readonly premiumEnabled: boolean;
  readonly askLimits: AskLimits;
  readonly ads: AdsConfig;
}

export const DEFAULT_REMOTE_VALUES: RemoteValues = Object.freeze({
  premiumEnabled: true,
  askLimits: DEFAULT_ASK_LIMITS,
  ads: adsConfig(),
});

type IntRange = readonly [min: number, max: number];
const FREE_RANGE: IntRange = [1, 20];
const ADS_RANGE: IntRange = [0, 10];
const PREMIUM_RANGE: IntRange = [1, 100];
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const UNIT_ID = /^ca-app-pub-\d{16}\/\d{10}$/;

export function remoteValuesFrom(source: RemoteSource): RemoteValues {
  const raw = (key: RemoteKey) => source(key).trim() || REMOTE_DEFAULTS[key];
  const bool = (key: RemoteKey) => strictBoolean(raw(key)) ?? REMOTE_DEFAULTS[key] === 'true';
  const int = (key: RemoteKey, range: IntRange) =>
    clamp(strictInt(raw(key)) ?? Number(REMOTE_DEFAULTS[key]), range);

  const ads = adsConfigFrom(
    bool(RemoteKeys.ADS_ENABLED),
    raw(RemoteKeys.AD_ENABLE_PLACEMENT),
    raw(RemoteKeys.AD_UNIT_ID_PLACEMENT),
  );
  const freePerDay = int(RemoteKeys.ASK_FREE_PER_DAY, FREE_RANGE);
  const askLimits: AskLimits = Object.freeze({
    freePerDay,
    // No rewarded ad, no ad credits to earn.
    adsPerDay: ads.enabled.has(AdPlacement.AI_REWARDED) ? int(RemoteKeys.ASK_ADS_PER_DAY, ADS_RANGE) : 0,
    // Premium never gets fewer questions than the free plan.
    premiumPerDay: Math.max(int(RemoteKeys.ASK_PREMIUM_PER_DAY, PREMIUM_RANGE), freePerDay),
  });
  return Object.freeze({ premiumEnabled: bool(RemoteKeys.PREMIUM_ENABLED), askLimits, ads });
}

function adsConfigFrom(masterOn: boolean, enabledJson: string, unitIdsJson: string): AdsConfig {
  const switches = objectOrNull(enabledJson) ?? objectOrNull(REMOTE_DEFAULTS[RemoteKeys.AD_ENABLE_PLACEMENT]);
  const ids = objectOrNull(unitIdsJson);
  // Like kotlinx `booleanOrNull`, a primitive whose text is exactly "true" counts as on.
  const enabled = masterOn ? AD_PLACEMENTS.filter((p) => primitiveText(switches?.[p]) === 'true') : [];
  const unitIds: Partial<Record<AdPlacement, string>> = {};
  for (const placement of AD_PLACEMENTS) {
    const id = ids?.[placement];
    if (typeof id === 'string' && UNIT_ID.test(id.trim())) unitIds[placement] = id.trim();
  }
  return adsConfig(enabled, unitIds);
}

function objectOrNull(text: string): Readonly<Record<string, unknown>> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function primitiveText(value: unknown): string | null {
  return typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number' ? String(value) : null;
}

/** Kotlin `toBooleanStrictOrNull`: exactly "true" or "false". */
function strictBoolean(text: string): boolean | null {
  if (text === 'true') return true;
  if (text === 'false') return false;
  return null;
}

/** Kotlin `toIntOrNull`: an optional sign and digits, within 32 bits. */
function strictInt(text: string): number | null {
  if (!/^[+-]?\d+$/.test(text)) return null;
  const value = Number(text);
  return value >= INT_MIN && value <= INT_MAX ? value : null;
}

function clamp(value: number, [min, max]: IntRange): number {
  return Math.min(Math.max(value, min), max);
}
