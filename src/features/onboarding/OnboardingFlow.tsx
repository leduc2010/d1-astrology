import { useEffect, useState } from 'react';
import { BackHandler, I18nManager, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { OrtusMotion, useReducedMotion } from '@/designsystem';

import { BuildingStep } from './BuildingStep';
import { ConsentStep } from './ConsentStep';
import { DateStep } from './DateStep';
import { NameStep } from './NameStep';
import type { OnboardingController } from './onboardingModel';
import { firstStep, OnboardingStep, type OnboardingUiState } from './onboardingState';
import { PlaceStep } from './PlaceStep';
import { ReviewStep } from './ReviewStep';
import { TimeStep } from './TimeStep';
import { WelcomeStep } from './WelcomeStep';

/** Steps glide in by a small fraction of the width — a drift, not a page swipe. */
const DRIFT_FRACTION = 8;
const HIDDEN = 0;
const SHOWN = 1;

export type OnboardingFlowProps = {
  controller: OnboardingController;
  state: OnboardingUiState;
  eraseFailed: boolean;
  onRetryErase: () => void;
  /** Back from the first step: leaves the editor (first launch lets the system close the app). */
  onExit?: () => void;
};

/** Hosts the first-launch steps; one at a time, with direction-aware drift between them. */
export function OnboardingFlow({ controller, state, eraseFailed, onRetryErase, onExit }: OnboardingFlowProps) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const { step } = state;
  const atFirstStep = step === firstStep(state);

  // On the building step the controller swallows back while the chart is being saved.
  useEffect(() => {
    if (atFirstStep) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      controller.back();
      return true;
    });
    return () => subscription.remove();
  }, [atFirstStep, controller]);

  // Direction of the last step change, worked out while rendering (React's "adjust state on prop change").
  const [drift, setDrift] = useState({ step, forward: true });
  if (drift.step !== step) setDrift({ step, forward: step >= drift.step });

  // Forward drifts toward the reading start: from the right in LTR, from the left in RTL.
  const direction = (drift.forward ? 1 : -1) * (I18nManager.isRTL ? -1 : 1);
  const offset = (direction * width) / DRIFT_FRACTION;
  const entering = reduced
    ? undefined
    : new Keyframe({
        0: { opacity: HIDDEN, transform: [{ translateX: offset }] },
        100: { opacity: SHOWN, transform: [{ translateX: 0 }], easing: OrtusMotion.settle },
      }).duration(OrtusMotion.EMPHASIZED);
  const exiting = reduced
    ? undefined
    : new Keyframe({
        0: { opacity: SHOWN, transform: [{ translateX: 0 }] },
        100: { opacity: HIDDEN, transform: [{ translateX: -offset }], easing: OrtusMotion.exit },
      }).duration(OrtusMotion.QUICK);

  const back = () => {
    if (!controller.back()) onExit?.();
  };
  return (
    <Animated.View key={step} entering={entering} exiting={exiting} style={styles.fill}>
      <StepContent controller={controller} state={state} eraseFailed={eraseFailed} onRetryErase={onRetryErase} back={back} />
    </Animated.View>
  );
}

type StepContentProps = Omit<OnboardingFlowProps, 'onExit'> & { back: () => void };

function StepContent({ controller: m, state, eraseFailed, onRetryErase, back }: StepContentProps) {
  switch (state.step) {
    case OnboardingStep.Welcome:
      return <WelcomeStep onBegin={m.next} eraseFailed={eraseFailed} onRetryErase={onRetryErase} />;
    case OnboardingStep.Consent:
      return (
        <ConsentStep
          state={state}
          onTipsChange={m.setPersonalizedTips}
          onAnalyticsChange={m.setAnalytics}
          onBack={back}
          onContinue={m.next}
        />
      );
    case OnboardingStep.Date:
      return (
        <DateStep
          state={state}
          onModeChange={m.setCalendarMode}
          onDayChange={m.setDay}
          onMonthChange={m.setMonth}
          onYearChange={m.setYear}
          onLeapMonthChange={m.setLeapMonth}
          onBack={back}
          onContinue={m.next}
        />
      );
    case OnboardingStep.Time:
      return (
        <TimeStep
          state={state}
          onHourChange={m.setHour}
          onMinuteChange={m.setMinute}
          onUnknownChange={m.setTimeUnknown}
          onBack={back}
          onContinue={m.next}
        />
      );
    case OnboardingStep.Place:
      return (
        <PlaceStep
          state={state}
          onQueryChange={m.setPlaceQuery}
          onPlaceSelect={m.selectPlace}
          onCoordinates={m.setCoordinates}
          onBack={back}
          onContinue={m.next}
        />
      );
    case OnboardingStep.Name:
      return (
        <NameStep state={state} onNameChange={m.setName} onGenderChange={m.setGender} onBack={back} onContinue={m.next} />
      );
    case OnboardingStep.Review:
      return <ReviewStep state={state} onBack={back} onEdit={m.edit} onBuild={m.next} />;
    case OnboardingStep.Building:
      return <BuildingStep state={state} onRetry={m.retrySave} />;
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
