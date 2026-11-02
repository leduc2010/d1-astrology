import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { OrtusScreen, ReadingDisclaimer, Reveal, useResumedOnly } from '@/core/ui';
import { OrtusCard, OrtusIconButton, OrtusIcons, OrtusListRow, OrtusRootHeader, OrtusSpacing } from '@/designsystem';
import type { CivilDate } from '@/engine';
import { useT } from '@/i18n';
import { navigateToDay, navigateToTab } from '@/navigation/routes';
import { DayCard } from './DayCard';
import { PersonalGrid, PersonalMessage } from './PersonalCards';
import type { TodayUiState } from './todayModel';
import { useTodayModel } from './useTodayModel';
import { YearCard, YearSheet } from './YearCards';

const openCalendar = () => navigateToTab('calendar');
const openCharts = () => navigateToTab('charts');

/** The Today tab, wired to its model and the app's navigation. */
export function TodayScreen() {
  const state = useTodayModel();
  const openDay = useResumedOnly(navigateToDay);
  return <TodayContent state={state} onOpenCalendar={openCalendar} onOpenDay={openDay} onOpenCharts={openCharts} />;
}

export type TodayContentProps = {
  state: TodayUiState;
  onOpenCalendar: () => void;
  onOpenDay: (date: CivilDate) => void;
  onOpenCharts: () => void;
};

export function TodayContent({ state, onOpenCalendar, onOpenDay, onOpenCharts }: TodayContentProps) {
  const t = useT();
  const [showYear, setShowYear] = useState(false);
  const openDay = () => onOpenDay(state.day.date);
  const personal = state.personal;
  const year = personal?.year ?? null;
  return (
    <OrtusScreen
      header={
        <OrtusRootHeader
          label={fullDateText(state.day.date, t.language)}
          title={t.tf('today_title')}
          actions={
            <OrtusIconButton
              icon={OrtusIcons.Calendar}
              accessibilityLabel={t.tf('today_open_calendar')}
              onPress={onOpenCalendar}
            />
          }
        />
      }
    >
      <Reveal index={0}>
        <DayCard day={state.day} nowHour={state.nowHour} onPress={openDay} />
      </Reveal>
      {personal ? (
        <>
          <Reveal index={1}>
            <PersonalMessage personal={personal} dayPillar={state.day.dayPillar} />
          </Reveal>
          <Reveal index={2}>
            <PersonalGrid personal={personal} direction={state.goodDirection} />
          </Reveal>
          {year ? (
            <Reveal index={3}>
              <YearCard year={year} onPress={() => setShowYear(true)} />
            </Reveal>
          ) : null}
        </>
      ) : null}
      {/* No ad here: spec §16.3 keeps native ads to the calendar pages, away from personal readings. */}
      <Reveal index={4}>
        <TodayLinks onOpenDay={openDay} onOpenCharts={onOpenCharts} />
      </Reveal>
      <Reveal index={5}>
        <ReadingDisclaimer />
      </Reveal>
      {year && showYear ? <YearSheet year={year} onDismiss={() => setShowYear(false)} /> : null}
    </OrtusScreen>
  );
}

function TodayLinks({
  onOpenDay,
  onOpenCharts,
  style,
}: {
  onOpenDay: () => void;
  onOpenCharts: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  return (
    <OrtusCard contentPadding={OrtusSpacing.none} style={style}>
      <OrtusListRow
        title={t.tf('today_link_day')}
        subtitle={t.tf('today_link_day_hint')}
        icon={OrtusIcons.Calendar}
        showDivider
        onPress={onOpenDay}
      />
      <OrtusListRow
        title={t.tf('today_link_chart')}
        subtitle={t.tf('today_link_chart_hint')}
        icon={OrtusIcons.Chart}
        onPress={onOpenCharts}
      />
    </OrtusCard>
  );
}

/**
 * "Sunday, 1 November 2026" in the app's language (Java `FormatStyle.FULL`).
 * Shared-layer request: core/ui has `solarDateText` with long/medium only.
 */
function fullDateText(date: CivilDate, language: string): string {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  utc.setUTCFullYear(date.year);
  return new Intl.DateTimeFormat(language, { dateStyle: 'full', timeZone: 'UTC' }).format(utc);
}
