import { StyleSheet } from 'react-native';

import {
  BirthDateWheels,
  CalendarMode,
  type DateCheck,
  lunarDateText,
  Reveal,
  solarDateText,
  stemBranchHan,
  stemBranchName,
} from '@/core/ui';
import {
  CalloutTone,
  OrtusCallout,
  OrtusCard,
  OrtusColors as c,
  OrtusListRow,
  OrtusSegmentedControl,
  OrtusSpacing,
  OrtusText,
  RowTrailing,
} from '@/designsystem';
import { yearPillar } from '@/engine';
import { useT } from '@/i18n';

import { canContinue, OnboardingStep, type OnboardingUiState } from './onboardingState';
import { ContinueButton, InfoRow, StepScaffold } from './StepScaffold';

const MODES: readonly CalendarMode[] = [CalendarMode.Solar, CalendarMode.Lunar];

export type DateStepProps = {
  state: OnboardingUiState;
  onModeChange: (mode: CalendarMode) => void;
  onDayChange: (day: number) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onLeapMonthChange: (isLeapMonth: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
};

/** S01-03: the birth date on wheels, in either calendar, cross-checked in the other. */
export function DateStep(props: DateStepProps) {
  const { state, onModeChange, onLeapMonthChange, onBack, onContinue } = props;
  const t = useT();
  const { date, dateCheck: check, years } = state;
  return (
    <StepScaffold
      step={OnboardingStep.Date}
      title={t.tf('onboarding_date_title')}
      onBack={onBack}
      bottomBar={<ContinueButton onPress={onContinue} enabled={canContinue(state)} />}
    >
      <Reveal index={2}>
        <OrtusSegmentedControl
          options={[t.tf('onboarding_calendar_solar'), t.tf('onboarding_calendar_lunar')]}
          selectedIndex={MODES.indexOf(date.mode)}
          onSelect={(index) => onModeChange(MODES[index] ?? CalendarMode.Solar)}
        />
      </Reveal>
      <Reveal index={3}>
        <BirthDateWheels
          date={date}
          firstYear={years[0] ?? date.year}
          lastYear={years[years.length - 1] ?? date.year}
          daysInMonth={state.daysInMonth}
          onDayChange={props.onDayChange}
          onMonthChange={props.onMonthChange}
          onYearChange={props.onYearChange}
        />
      </Reveal>
      {date.mode === CalendarMode.Lunar && check?.leapMonth === date.month && (
        <OrtusCard contentPadding={OrtusSpacing.xs}>
          <OrtusListRow
            title={t.tf('onboarding_leap_month')}
            subtitle={t.tf('onboarding_leap_month_body', date.month)}
            trailing={RowTrailing.toggle(date.isLeapMonth, onLeapMonthChange)}
          />
        </OrtusCard>
      )}
      {check !== null && (
        <Reveal index={4}>
          <DateCheckCard check={check} mode={date.mode} />
        </Reveal>
      )}
      {check?.leapMonth != null && (
        <Reveal index={5}>
          <OrtusCallout
            text={t.tf(
              'onboarding_date_leap_note',
              stemBranchName(t, yearPillar(date.year)),
              date.year,
              check.leapMonth,
            )}
            tone={CalloutTone.Info}
          />
        </Reveal>
      )}
      {check?.isFuture === true && <OrtusCallout text={t.tf('onboarding_date_future')} tone={CalloutTone.Warning} />}
    </StepScaffold>
  );
}

/** The entered day in the other calendar and its day pillar — a quick sanity check. */
function DateCheckCard({ check, mode }: { check: DateCheck; mode: CalendarMode }) {
  const t = useT();
  return (
    <OrtusCard gap={OrtusSpacing.sm}>
      <OrtusText variant="label" color={c.accent} style={styles.label}>
        {t.tf('onboarding_date_check')}
      </OrtusText>
      {mode === CalendarMode.Solar ? (
        <InfoRow label={t.tf('onboarding_date_lunar')} value={lunarDateText(t, check.lunar)} />
      ) : (
        <InfoRow label={t.tf('onboarding_date_solar')} value={solarDateText(check.solar, t.language)} />
      )}
      <InfoRow
        label={t.tf('onboarding_date_day_pillar')}
        value={stemBranchName(t, check.dayPillar)}
        han={stemBranchHan(check.dayPillar)}
      />
    </OrtusCard>
  );
}

const styles = StyleSheet.create({
  label: { alignSelf: 'flex-start' },
});
