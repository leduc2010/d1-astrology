import { useEffect } from 'react';

import { EraseStatus, useEraseStatus, useServices } from '@/core/data';
import { useResumedOnly } from '@/core/ui';
import { finishOnboarding, goBack } from '@/navigation/routes';

import { OnboardingFlow } from './OnboardingFlow';
import { useOnboardingModel } from './useOnboardingModel';

const NO_ERASE_RETRY = (): void => undefined;

/** First launch: the onboarding steps, then on to Today once the profile is saved. */
export function OnboardingScreen() {
  const { eraser } = useServices();
  const erase = useEraseStatus();
  const [controller, state] = useOnboardingModel();
  useEffect(() => {
    if (state.isFinished) finishOnboarding();
  }, [state.isFinished]);
  // An erase-all that cleared the profile but not every setting lands here: say so and offer a retry.
  return (
    <OnboardingFlow
      controller={controller}
      state={state}
      eraseFailed={erase === EraseStatus.Failed}
      onRetryErase={() => void eraser.eraseAll()}
    />
  );
}

/** The owner correcting their saved birth details, reusing the onboarding steps; leaves saved or not. */
export function EditBirthScreen() {
  const [controller, state] = useOnboardingModel(true);
  const onExit = useResumedOnly(goBack);
  useEffect(() => {
    if (state.isFinished) goBack();
  }, [state.isFinished]);
  return (
    <OnboardingFlow
      controller={controller}
      state={state}
      eraseFailed={false}
      onRetryErase={NO_ERASE_RETRY}
      onExit={onExit}
    />
  );
}
