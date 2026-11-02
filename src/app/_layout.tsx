import { Stack, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { AdPlacement } from '@/core/model';
import {
  EraseStatus,
  Membership,
  ServicesProvider,
  useEraseStatus,
  useMembership,
  usePrimaryProfile,
  useServices,
  useSettings,
} from '@/core/data';
import { applyConsent, screenNameOfSegments, screenViewEvent, useRemoteValues } from '@/core/telemetry';
import { AdPlacementsProvider, PremiumOfferedProvider } from '@/core/ui';
import { DesignSystemProvider, StarfieldBackground, useOrtusFonts, useReducedMotion } from '@/designsystem';
import { isSupportedLanguage, setAppLanguage } from '@/i18n';
import { Paths, restartAtOnboarding } from '@/navigation/routes';
import { SoundProvider } from '@/sound';

/** Whether this build sells Premium at all (Kotlin `BuildConfig.PREMIUM_ENABLED`, off by default). */
const PREMIUM_ENABLED = process.env.EXPO_PUBLIC_PREMIUM_ENABLED === 'true';
const NO_PLACEMENTS: ReadonlySet<AdPlacement> = new Set();

// Held until fonts, settings and the profile are read, so the first frame has the right start screen.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden (fast refresh): nothing to hold.
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <ServicesProvider>
          <AppRoot />
        </ServicesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Kotlin `MainActivity` + `OrtusApp`: theme, sound, one shared starfield, then the stack. */
function AppRoot() {
  const [fontsLoaded, fontError] = useOrtusFonts();
  const settings = useSettings();
  const profile = usePrimaryProfile();
  const { telemetry } = useServices();
  const remote = useRemoteValues(telemetry.remote);
  const membership = useMembership();
  const ready = (fontsLoaded || fontError !== null) && settings !== undefined && profile !== undefined;

  // Before the first screen renders, so its strings are already in the chosen language.
  useMemo(() => {
    if (!settings) return;
    const language = settings.language;
    setAppLanguage(language !== null && isSupportedLanguage(language) ? language : null);
  }, [settings]);

  // Analytics and crash reports follow the owner's answer, off until they say yes.
  const analyticsConsent = settings?.analyticsConsent ?? false;
  useEffect(() => {
    applyConsent(telemetry, { analyticsConsent });
  }, [telemetry, analyticsConsent]);

  useEffect(() => {
    telemetry.remote.refresh().catch(() => undefined);
  }, [telemetry]);

  // Premium members see no ad slots, nor does anyone before the store answers (no cold-start
  // flash for a member). Remote config can switch slots off, never add one.
  const placements = useMemo(
    () => (membership === Membership.Free ? remote.ads.enabled : NO_PLACEMENTS),
    [membership, remote.ads.enabled],
  );

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;
  // A restored install can say onboarding is done while no profile exists: ask again then.
  const needsOnboarding = !settings.onboardingCompleted || profile === null;

  return (
    <DesignSystemProvider reducedMotion={settings.reducedMotion}>
      <SoundProvider enabled={settings.soundEnabled}>
        <StatusBar style="light" />
        <StarfieldBackground style={styles.fill}>
          <PremiumOfferedProvider value={PREMIUM_ENABLED && remote.premiumEnabled}>
            <AdPlacementsProvider value={placements}>
              <AppStack needsOnboarding={needsOnboarding} />
            </AdPlacementsProvider>
          </PremiumOfferedProvider>
        </StarfieldBackground>
      </SoundProvider>
    </DesignSystemProvider>
  );
}

function AppStack({ needsOnboarding }: { needsOnboarding: boolean }) {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const erase = useEraseStatus();
  useScreenViews();

  // The profile vanished while the app ran (erase-all): start over at onboarding. Mid-erase the
  // profile is already gone; wait, so a failure is shown on Privacy instead of being skipped.
  const restart = needsOnboarding && erase !== EraseStatus.Erasing && pathname !== Paths.onboarding;
  useEffect(() => {
    if (restart) restartAtOnboarding();
  }, [restart]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: styles.transparent,
        // New content drifts into focus; nothing moves when the user asked for less motion.
        animation: reduced ? 'none' : 'fade',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

/** Logs each screen once by its route name only; never a parameter, so no birth data can leak. */
function useScreenViews() {
  const { telemetry } = useServices();
  const segments = useSegments();
  const screen = screenNameOfSegments(segments);
  useEffect(() => {
    if (screen !== null) telemetry.analytics.log(screenViewEvent(screen));
  }, [telemetry, screen]);
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  transparent: { backgroundColor: 'transparent' },
});
