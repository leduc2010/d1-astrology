import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Reveal } from '@/core/ui';
import {
  CalloutTone,
  OrtusBottomSheet,
  OrtusCallout,
  OrtusCard,
  OrtusCheckboxRow,
  OrtusColors as c,
  OrtusIcons,
  OrtusLinkButton,
  OrtusSpacing,
  OrtusStroke,
  OrtusText,
} from '@/designsystem';
import { useT } from '@/i18n';

import { canContinue, OnboardingStep, type OnboardingUiState } from './onboardingState';
import { ContinueButton, StepScaffold } from './StepScaffold';

export type ConsentStepProps = {
  state: OnboardingUiState;
  onTipsChange: (enabled: boolean) => void;
  onAnalyticsChange: (enabled: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
};

/** S01-02: what the app needs (always on) and what the user may allow. */
export function ConsentStep({ state, onTipsChange, onAnalyticsChange, onBack, onContinue }: ConsentStepProps) {
  const t = useT();
  const [showPrivacy, setShowPrivacy] = useState(false);
  return (
    <>
      <StepScaffold
        step={OnboardingStep.Consent}
        title={t.tf('onboarding_consent_title')}
        subtitle={t.tf('onboarding_consent_body')}
        onBack={onBack}
        bottomBar={
          <ContinueButton onPress={onContinue} enabled={canContinue(state)} text={t.tf('onboarding_consent_cta')} />
        }
      >
        <Reveal index={2}>
          <OrtusCard contentPadding={OrtusSpacing.md}>
            <OrtusCheckboxRow
              title={t.tf('onboarding_consent_chart_title')}
              checked
              onCheckedChange={null}
              description={t.tf('onboarding_consent_chart_body')}
              badge={t.tf('onboarding_consent_required')}
            />
            <View style={styles.divider} />
            <OrtusCheckboxRow
              title={t.tf('onboarding_consent_tips_title')}
              checked={state.personalizedTips}
              onCheckedChange={onTipsChange}
              description={t.tf('onboarding_consent_tips_body')}
            />
            <View style={styles.divider} />
            <OrtusCheckboxRow
              title={t.tf('onboarding_consent_analytics_title')}
              checked={state.analytics}
              onCheckedChange={onAnalyticsChange}
              description={t.tf('onboarding_consent_analytics_body')}
            />
          </OrtusCard>
        </Reveal>
        <Reveal index={3}>
          <OrtusCallout text={t.tf('onboarding_consent_privacy_note')} tone={CalloutTone.Info} />
        </Reveal>
        <Reveal index={4}>
          <OrtusLinkButton
            text={t.tf('onboarding_consent_privacy_link')}
            onPress={() => setShowPrivacy(true)}
            trailingIcon={OrtusIcons.ChevronRight}
          />
        </Reveal>
      </StepScaffold>
      {showPrivacy && (
        <OrtusBottomSheet onDismiss={() => setShowPrivacy(false)} title={t.tf('onboarding_consent_privacy_link')}>
          <OrtusText variant="body" color={c.textSecondary} style={styles.sheetBody}>
            {t.tf('onboarding_consent_privacy_body')}
          </OrtusText>
        </OrtusBottomSheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  divider: { height: OrtusStroke.hairline, backgroundColor: c.divider },
  sheetBody: { paddingBottom: OrtusSpacing.xl },
});
