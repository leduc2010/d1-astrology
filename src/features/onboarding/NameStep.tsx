import { StyleSheet } from 'react-native';

import { Gender } from '@/core/model';
import { Reveal } from '@/core/ui';
import {
  CalloutTone,
  OrtusCallout,
  OrtusSegmentedControl,
  OrtusSpacing,
  OrtusTextField,
  SectionLabel,
} from '@/designsystem';
import { useT } from '@/i18n';

import { genderText } from './onboardingText';
import { canContinue, OnboardingStep, type OnboardingUiState } from './onboardingState';
import { ContinueButton, StepScaffold } from './StepScaffold';

const GENDERS: readonly Gender[] = [Gender.MALE, Gender.FEMALE];

export type NameStepProps = {
  state: OnboardingUiState;
  onNameChange: (name: string) => void;
  onGenderChange: (gender: Gender) => void;
  onBack: () => void;
  onContinue: () => void;
};

/** S01-06: what to call the user, and the gender Tử Vi needs for the direction of its decades. */
export function NameStep({ state, onNameChange, onGenderChange, onBack, onContinue }: NameStepProps) {
  const t = useT();
  return (
    <StepScaffold
      step={OnboardingStep.Name}
      title={t.tf('onboarding_name_title')}
      onBack={onBack}
      bottomBar={<ContinueButton onPress={onContinue} enabled={canContinue(state)} />}
    >
      <Reveal index={2}>
        <OrtusTextField
          value={state.name}
          onChangeText={onNameChange}
          label={t.tf('onboarding_name_label')}
          helper={t.tf('onboarding_name_helper')}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </Reveal>
      <Reveal index={3} style={styles.column}>
        <SectionLabel text={t.tf('onboarding_gender_label')} />
        <OrtusSegmentedControl
          options={GENDERS.map((gender) => genderText(t, gender))}
          selectedIndex={state.gender === null ? -1 : GENDERS.indexOf(state.gender)}
          onSelect={(index) => {
            const gender = GENDERS[index];
            if (gender !== undefined) onGenderChange(gender);
          }}
        />
      </Reveal>
      <Reveal index={4}>
        <OrtusCallout text={t.tf('onboarding_gender_note')} tone={CalloutTone.Info} />
      </Reveal>
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  column: { gap: OrtusSpacing.xs },
});
