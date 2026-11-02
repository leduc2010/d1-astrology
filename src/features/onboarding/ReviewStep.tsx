import { StyleSheet, View } from 'react-native';

import { type ResolvedBirth, VIETNAM_ZONE } from '@/core/data';
import { minutesOfDay } from '@/core/model';
import { clockText, hourName, lunarDateShortText, Reveal, solarDateText, type UiText } from '@/core/ui';
import {
  ButtonStyle,
  CalloutTone,
  OrtusButton,
  OrtusCallout,
  OrtusCard,
  OrtusColors as c,
  OrtusGlowCard,
  OrtusSpacing,
  OrtusText,
  UiCue,
} from '@/designsystem';
import { useT } from '@/i18n';

import { genderText, placeTitle, utcOffsetText } from './onboardingText';
import { canContinue, OnboardingStep, type OnboardingUiState } from './onboardingState';
import { InfoRow, StepScaffold } from './StepScaffold';

/** Years when North and South Vietnam kept different clocks; the review explains the correction. */
const SPLIT_CLOCK_FIRST_YEAR = 1945;
const SPLIT_CLOCK_LAST_YEAR = 1975;

export type ReviewStepProps = {
  state: OnboardingUiState;
  onBack: () => void;
  onEdit: () => void;
  onBuild: () => void;
};

/** S01-07: everything entered, the time zone and true solar time the chart will use. */
export function ReviewStep({ state, onBack, onEdit, onBuild }: ReviewStepProps) {
  const t = useT();
  const birth = state.review;
  const year = birth?.solarDate.year ?? 0;
  const splitClock =
    birth !== null &&
    birth.profile.place.zoneId === VIETNAM_ZONE &&
    year >= SPLIT_CLOCK_FIRST_YEAR &&
    year <= SPLIT_CLOCK_LAST_YEAR;
  return (
    <StepScaffold
      step={OnboardingStep.Review}
      title={t.tf('onboarding_review_title')}
      onBack={onBack}
      bottomBar={
        <View style={styles.buttons}>
          <OrtusButton
            text={t.tf('onboarding_review_edit')}
            onPress={onEdit}
            variant={ButtonStyle.Outline}
            style={styles.flex}
          />
          <OrtusButton
            text={t.tf('onboarding_review_build')}
            onPress={onBuild}
            enabled={canContinue(state)}
            cue={UiCue.Success}
            style={styles.flex}
          />
        </View>
      }
    >
      {birth !== null && (
        <>
          <Reveal index={2}>
            <ProfileCard birth={birth} />
          </Reveal>
          <Reveal index={3}>
            <ZoneCard birth={birth} />
          </Reveal>
          {splitClock && (
            <Reveal index={4}>
              <OrtusCallout text={t.tf('onboarding_review_history_note')} tone={CalloutTone.Info} />
            </Reveal>
          )}
        </>
      )}
    </StepScaffold>
  );
}

function ProfileCard({ birth }: { birth: ResolvedBirth }) {
  const t = useT();
  const { profile } = birth;
  const branch = birth.hourBranch;
  return (
    <OrtusCard gap={OrtusSpacing.md}>
      <InfoRow
        label={t.tf('onboarding_review_name')}
        value={t.tf('onboarding_review_pair', profile.name, genderText(t, profile.gender))}
      />
      <InfoRow
        label={t.tf('onboarding_review_date')}
        value={solarDateText(birth.solarDate, t.language)}
        detail={lunarDateShortText(t, birth.lunarDate)}
      />
      <InfoRow
        label={t.tf('onboarding_review_time')}
        value={
          profile.clock === null
            ? t.tf('onboarding_review_time_unknown')
            : clockText(minutesOfDay(profile.clock), t.language)
        }
        detail={branch === null ? null : hourName(t, branch)}
      />
      <InfoRow label={t.tf('onboarding_review_place')} value={placeTitle(t, profile.place)} />
    </OrtusCard>
  );
}

function ZoneCard({ birth }: { birth: ResolvedBirth }) {
  const t = useT();
  return (
    <OrtusGlowCard>
      <View style={styles.zoneColumn}>
        <OrtusText variant="label" color={c.accent}>
          {t.tf('onboarding_review_zone')}
        </OrtusText>
        <View style={styles.zoneRow}>
          <OrtusText variant="figure" color={c.textPrimary}>
            {t.tf('onboarding_utc_offset', utcOffsetText(birth.utcOffsetMinutes))}
          </OrtusText>
          {birth.trueSolarMinutes !== null && (
            <OrtusText variant="caption" color={c.accentLight}>
              {t.tf('onboarding_review_solar_time', clockText(birth.trueSolarMinutes, t.language))}
            </OrtusText>
          )}
        </View>
        <OrtusText variant="caption" color={c.textSecondary}>
          {zoneExplanation(t, birth)}
        </OrtusText>
      </View>
    </OrtusGlowCard>
  );
}

function zoneExplanation(t: UiText, birth: ResolvedBirth): string {
  const branch = birth.hourBranch;
  if (branch === null) return t.tf('onboarding_review_no_time_body');
  return t.tf(
    'onboarding_review_solar_body',
    placeTitle(t, birth.profile.place),
    solarDateText(birth.solarDate, t.language),
    hourName(t, branch),
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', gap: OrtusSpacing.sm },
  flex: { flex: 1 },
  zoneColumn: { gap: OrtusSpacing.xs },
  zoneRow: { flexDirection: 'row', alignItems: 'flex-end', gap: OrtusSpacing.xs },
});
