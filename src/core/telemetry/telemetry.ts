import type { UserSettings } from '../model';
import { type Analytics, NoOpAnalytics } from './analytics';
import { type CrashReporter, NoOpCrashReporter } from './crashReporter';
import { DefaultRemoteSettings, type RemoteSettings } from './remoteSettings';

/** Remote config, analytics and crash reports, behind interfaces so the app never calls a vendor SDK. */
export interface Telemetry {
  readonly remote: RemoteSettings;
  readonly analytics: Analytics;
  readonly crash: CrashReporter;
}

/**
 * The telemetry this build uses. No vendor SDK ships yet, so it is built-in defaults and no-ops;
 * the app works the same without one.
 */
export function createTelemetry(): Telemetry {
  return Object.freeze({
    remote: new DefaultRemoteSettings(),
    analytics: NoOpAnalytics,
    crash: NoOpCrashReporter,
  });
}

/**
 * Turns analytics and crash reports on or off from the owner's answer (off until answered), as
 * Kotlin's `OrtusApplication` does on every settings change.
 */
export function applyConsent(telemetry: Telemetry, settings: Pick<UserSettings, 'analyticsConsent'>): void {
  telemetry.analytics.setEnabled(settings.analyticsConsent);
  telemetry.crash.setEnabled(settings.analyticsConsent);
}
