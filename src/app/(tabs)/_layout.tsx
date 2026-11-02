import { Redirect, Tabs } from 'expo-router';

import { usePrimaryProfile, useSettings } from '@/core/data';
import { OrtusRouterTabBar } from '@/designsystem';
import { Paths } from '@/navigation/routes';

/** The five tabs; one copy of each, and Back from any tab returns to Today. */
export default function TabsLayout() {
  const settings = useSettings();
  const profile = usePrimaryProfile();
  // The root layout restarts onboarding too; this stops Today flashing before it does.
  if (settings && (!settings.onboardingCompleted || profile === null)) return <Redirect href={Paths.onboarding} />;

  return (
    <Tabs
      backBehavior="initialRoute"
      tabBar={(props) => <OrtusRouterTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, animation: 'none' }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="charts" />
      <Tabs.Screen name="ai" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
