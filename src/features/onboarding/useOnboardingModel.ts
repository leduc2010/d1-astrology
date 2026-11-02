import { useEffect, useState, useSyncExternalStore } from 'react';

import { civilOfEpochDay, useServices } from '@/core/data';
import { todayEpochDay } from '@/core/model';

import { OnboardingController } from './onboardingModel';
import type { OnboardingUiState } from './onboardingState';

/**
 * The onboarding controller for this screen (Kotlin `viewModel { OnboardingViewModel(...) }`) and
 * its current state. The controller lives as long as the screen; a running build stops when it goes.
 */
export function useOnboardingModel(isEditing = false): readonly [OnboardingController, OnboardingUiState] {
  const { settings, profile } = useServices();
  const [controller] = useState(
    () => new OnboardingController({ settings, profile, isEditing, today: civilOfEpochDay(todayEpochDay()) }),
  );
  useEffect(() => {
    controller.resume();
    return () => controller.dispose();
  }, [controller]);
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  return [controller, state] as const;
}
