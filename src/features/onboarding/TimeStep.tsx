import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { BirthTimeWheels, branchHan, hourName, hourSpan, Reveal } from '@/core/ui';
import {
  CalloutTone,
  OrtusAlpha,
  OrtusCallout,
  OrtusCard,
  OrtusListRow,
  OrtusMotion,
  OrtusSpacing,
  OrtusTag,
  RowTrailing,
  TagTone,
  useAnimatedValue,
} from '@/designsystem';
import { hourBranch } from '@/engine';
import { useT } from '@/i18n';

import { canContinue, OnboardingStep, type OnboardingUiState } from './onboardingState';
import { ContinueButton, StepScaffold } from './StepScaffold';

const OPAQUE = 1;

export type TimeStepProps = {
  state: OnboardingUiState;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onUnknownChange: (unknown: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
};

/** S01-04: hour and minute wheels, the double-hour they fall in, or "I don't know". */
export function TimeStep({ state, onHourChange, onMinuteChange, onUnknownChange, onBack, onContinue }: TimeStepProps) {
  const t = useT();
  const wheelAlpha = useAnimatedValue(state.isTimeUnknown ? OrtusAlpha.DIMMED : OPAQUE, OrtusMotion.standard);
  const dimmed = useAnimatedStyle(() => ({ opacity: wheelAlpha.value }));
  const branch = hourBranch(state.clock.hour);
  return (
    <StepScaffold
      step={OnboardingStep.Time}
      title={t.tf('onboarding_time_title')}
      subtitle={t.tf('onboarding_time_body')}
      onBack={onBack}
      bottomBar={<ContinueButton onPress={onContinue} enabled={canContinue(state)} />}
    >
      <Reveal index={2}>
        <Animated.View style={dimmed}>
          <BirthTimeWheels clock={state.clock} onHourChange={onHourChange} onMinuteChange={onMinuteChange} large />
        </Animated.View>
      </Reveal>
      {!state.isTimeUnknown && (
        <View style={styles.center}>
          <OrtusTag
            text={t.tf('onboarding_review_pair', hourName(t, branch), hourSpan(t, branch))}
            tone={TagTone.Gold}
            han={branchHan(branch)}
          />
        </View>
      )}
      <Reveal index={3}>
        <OrtusCard contentPadding={OrtusSpacing.xs}>
          <OrtusListRow
            title={t.tf('onboarding_time_unknown')}
            subtitle={t.tf('onboarding_time_unknown_body')}
            trailing={RowTrailing.toggle(state.isTimeUnknown, onUnknownChange)}
          />
        </OrtusCard>
      </Reveal>
      {state.isTimeUnknown && <OrtusCallout text={t.tf('onboarding_time_warning')} tone={CalloutTone.Warning} />}
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
});
