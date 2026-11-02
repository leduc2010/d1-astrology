import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EraseStatus, ServicesProvider, useEraseStatus, usePrimaryProfile, useSettings } from '@/core/data';
import { DesignSystemProvider, StarfieldBackground, useOrtusFonts, useReducedMotion } from '@/designsystem';
import { isSupportedLanguage, setAppLanguage } from '@/i18n';
import { Paths, restartAtOnboarding } from '@/navigation/routes';
import { SoundProvider } from '@/sound';

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
  const ready = (fontsLoaded || fontError !== null) && settings !== undefined && profile !== undefined;

  // Before the first screen renders, so its strings are already in the chosen language.
  useMemo(() => {
    if (!settings) return;
    const language = settings.language;
    setAppLanguage(language !== null && isSupportedLanguage(language) ? language : null);
  }, [settings]);

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
          <AppStack needsOnboarding={needsOnboarding} />
        </StarfieldBackground>
      </SoundProvider>
    </DesignSystemProvider>
  );
}

function AppStack({ needsOnboarding }: { needsOnboarding: boolean }) {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const erase = useEraseStatus();

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

const styles = StyleSheet.create({
  fill: { flex: 1 },
  transparent: { backgroundColor: 'transparent' },
});
