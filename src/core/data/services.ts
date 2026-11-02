import { createContext, createElement, useContext, useState, type ReactNode } from 'react';

import { createTelemetry, type Telemetry } from '../telemetry';
import { StubRewardedAds, type RewardedAds } from './ads/rewardedAds';
import { createAskUsageRepository, type AskUsageRepository } from './askUsageRepository';
import type { Billing } from './billing/billing';
import { StubBilling } from './billing/stubBilling';
import { DataEraser } from './dataEraser';
import { createPartnerRepository, type PartnerRepository } from './partnerRepository';
import { createProfileRepository, type ProfileRepository } from './profileRepository';
import { createSettingsRepository, type SettingsRepository } from './settingsRepository';
import { createAsyncStorageStore } from './storage/asyncStorageStore';
import type { KeyValueStore } from './storage/keyValueStore';

/** The app-wide data singletons, the counterpart of the Kotlin Hilt graph for core/data. */
export interface AppServices {
  readonly settings: SettingsRepository;
  readonly profile: ProfileRepository;
  readonly partners: PartnerRepository;
  readonly askUsage: AskUsageRepository;
  readonly billing: Billing;
  readonly rewardedAds: RewardedAds;
  readonly eraser: DataEraser;
  /** Remote config, analytics and crash reports; no vendor SDK and never any birth data. */
  readonly telemetry: Telemetry;
}

/** Store-backed services can be swapped (a real store SDK, fakes in tests); repositories cannot. */
export interface ServiceOverrides {
  readonly billing?: Billing;
  readonly rewardedAds?: RewardedAds;
  readonly telemetry?: Telemetry;
}

/** Builds every service over one [store], AsyncStorage by default. Call once per app. */
export function createAppServices(
  store: KeyValueStore = createAsyncStorageStore(),
  overrides: ServiceOverrides = {},
): AppServices {
  const settings = createSettingsRepository(store);
  const profile = createProfileRepository(store);
  const partners = createPartnerRepository(store);
  return Object.freeze({
    settings,
    profile,
    partners,
    askUsage: createAskUsageRepository(store),
    billing: overrides.billing ?? new StubBilling(),
    rewardedAds: overrides.rewardedAds ?? new StubRewardedAds(),
    eraser: new DataEraser(partners, profile, settings),
    telemetry: overrides.telemetry ?? createTelemetry(),
  });
}

const ServicesContext = createContext<AppServices | null>(null);

export interface ServicesProviderProps {
  /** The services to share; built over AsyncStorage on first render when omitted. */
  readonly services?: AppServices;
  readonly children?: ReactNode;
}

export function ServicesProvider({ services, children }: ServicesProviderProps) {
  const [fallback] = useState<AppServices | null>(() => (services ? null : createAppServices()));
  const value = services ?? fallback;
  return createElement(ServicesContext.Provider, { value }, children);
}

/** The services of the nearest [ServicesProvider]; throws outside one. */
export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be called inside a ServicesProvider');
  return services;
}
