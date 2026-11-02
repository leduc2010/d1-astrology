import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { festivalName, listText, lunarDateShortText, solarTermName, visibleFestivals, type UiText } from '@/core/ui';
import { DateBadge, OrtusCard, OrtusListRow, OrtusSpacing, SectionLabel } from '@/designsystem';
import { type CivilDate, type DayAlmanac, isoDate } from '@/engine';
import { useT } from '@/i18n';
import { datePattern, weekdayText } from './dateText';

const MAX_UPCOMING = 4;

export type UpcomingListProps = {
  days: readonly DayAlmanac[];
  onOpenDay: (date: CivilDate) => void;
  style?: StyleProp<ViewStyle>;
};

/** The next few festivals and solar terms, each opening its day page. */
export function UpcomingList({ days, onOpenDay, style }: UpcomingListProps) {
  const t = useT();
  const rows = days
    .map((day) => ({ day, names: eventNames(t, day) }))
    .filter((row) => row.names.length > 0)
    .slice(0, MAX_UPCOMING);
  if (rows.length === 0) return null;
  return (
    <View style={[styles.column, style]}>
      <SectionLabel text={t.tf('calendar_upcoming')} />
      <OrtusCard contentPadding={OrtusSpacing.none}>
        {rows.map(({ day, names }, i) => (
          <OrtusListRow
            key={isoDate(day.date)}
            title={listText(t, names)}
            subtitle={`${weekdayText(day.date, t.language)} · ${lunarDateShortText(t, day.lunar)}`}
            leading={
              <DateBadge day={String(day.date.day)} month={datePattern(t, 'date_month_short_pattern', day.date)} />
            }
            showDivider={i < rows.length - 1}
            onPress={() => onOpenDay(day.date)}
          />
        ))}
      </OrtusCard>
    </View>
  );
}

/** Festivals the reader's language shows, then the solar term if one begins that day. */
function eventNames(t: UiText, day: DayAlmanac): string[] {
  const festivals = visibleFestivals(day.festivals, t.language).map((f) => festivalName(t, f));
  return day.isTermStart ? [...festivals, solarTermName(t, day.solarTerm)] : festivals;
}

const styles = StyleSheet.create({
  column: { gap: OrtusSpacing.xs },
});
