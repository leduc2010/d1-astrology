import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Reveal } from '@/core/ui';
import {
  FadingScrollView,
  OrtusColors as c,
  OrtusIconButton,
  OrtusIcons,
  OrtusSpacing,
  OrtusText,
  OrtusWideButton,
  StepIndicator,
  UiCue,
} from '@/designsystem';
import { useT } from '@/i18n';

import { INPUT_STEPS, type OnboardingStep, stepNumber } from './onboardingState';

export type StepScaffoldProps = {
  step: OnboardingStep;
  title: string;
  subtitle?: string;
  onBack: () => void;
  /** Actions pinned at the bottom, above the keyboard. */
  bottomBar: ReactNode;
  children?: ReactNode;
};

/**
 * Frame of every input step (S01-02…S01-07): back button, "Step n/4" with the step bar, a serif
 * title, scrolling content and the actions pinned at the bottom.
 */
export function StepScaffold({ step, title, subtitle, onBack, bottomBar, children }: StepScaffoldProps) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const number = stepNumber(step);
  return (
    <View
      style={[
        styles.fill,
        { paddingTop: insets.top, paddingBottom: insets.bottom, paddingStart: insets.left, paddingEnd: insets.right },
      ]}
    >
      <View style={styles.backRow}>
        <OrtusIconButton icon={OrtusIcons.Back} accessibilityLabel={t.tf('onboarding_back')} onPress={onBack} />
      </View>
      <FadingScrollView style={styles.fill} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {number !== null && (
          <Reveal index={0} style={styles.tightColumn}>
            <OrtusText variant="label" color={c.accent}>
              {t.tf('onboarding_step', number, INPUT_STEPS)}
            </OrtusText>
            <StepIndicator done={number - 1} total={INPUT_STEPS} current={number - 1} />
          </Reveal>
        )}
        <Reveal index={1} style={styles.tightColumn}>
          <OrtusText variant="h1" color={c.textPrimary}>
            {title}
          </OrtusText>
          {subtitle !== undefined && (
            <OrtusText variant="body" color={c.textSecondary}>
              {subtitle}
            </OrtusText>
          )}
        </Reveal>
        {children}
      </FadingScrollView>
      <View style={styles.bottomBar}>{bottomBar}</View>
    </View>
  );
}

/** The usual single call to action at the bottom of a step. */
export function ContinueButton({ onPress, enabled, text }: { onPress: () => void; enabled: boolean; text?: string }) {
  const t = useT();
  return (
    <OrtusWideButton text={text ?? t.tf('onboarding_continue')} onPress={onPress} enabled={enabled} cue={UiCue.Select} />
  );
}

export type InfoRowProps = { label: string; value: string; detail?: string | null; han?: string | null };

/** Label beside a value, with an optional secondary line — the rows of the cross-check and review cards. */
export function InfoRow({ label, value, detail, han }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <OrtusText variant="caption" color={c.textSecondary} style={styles.infoLabel}>
        {label}
      </OrtusText>
      <View style={styles.infoValue}>
        <View style={styles.valueRow}>
          <OrtusText variant="bodyMedium" color={c.textPrimary} style={styles.endText}>
            {value}
          </OrtusText>
          {han != null && (
            <OrtusText variant="hanSmall" color={c.hanGlyph}>
              {han}
            </OrtusText>
          )}
        </View>
        {detail != null && (
          <OrtusText variant="caption" color={c.textMuted} style={styles.endText}>
            {detail}
          </OrtusText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: OrtusSpacing.md,
    paddingVertical: OrtusSpacing.xs,
  },
  content: {
    paddingHorizontal: OrtusSpacing.screen,
    paddingVertical: OrtusSpacing.xs,
    gap: OrtusSpacing.cardGap,
  },
  tightColumn: { gap: OrtusSpacing.xs },
  bottomBar: {
    paddingHorizontal: OrtusSpacing.screen,
    paddingVertical: OrtusSpacing.md,
    gap: OrtusSpacing.sm,
  },
  infoRow: { flexDirection: 'row', gap: OrtusSpacing.md },
  infoLabel: { flex: 1 },
  infoValue: { flex: 2, alignItems: 'flex-end' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.tight, flexShrink: 1 },
  endText: { textAlign: 'right', flexShrink: 1 },
});
