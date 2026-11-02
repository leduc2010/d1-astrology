import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  daySpiritText,
  DayQualityTag,
  HoursSection,
  lunarDateShortText,
  mansionName,
  officerAdvice,
  officerName,
  stemBranchHan,
  stemBranchName,
} from '@/core/ui';
import { InfoTile, OrtusColors as c, OrtusGlowCard, OrtusSpacing, OrtusText, SectionLabel } from '@/designsystem';
import type { Branch, DayAlmanac } from '@/engine';
import { useT } from '@/i18n';

export type DayCardProps = {
  day: DayAlmanac;
  nowHour: Branch;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** The hero card: today's pillar, quality, officer and mansion, advice and the twelve hours. */
export function DayCard({ day, nowHour, onPress, style }: DayCardProps) {
  return (
    <OrtusGlowCard onPress={onPress} style={style}>
      <View style={styles.column}>
        <DayTitle day={day} />
        <DayTiles day={day} />
        <DayAdvice day={day} />
        <HoursSection auspicious={day.auspiciousHours} now={nowHour} />
      </View>
    </OrtusGlowCard>
  );
}

function DayTitle({ day }: { day: DayAlmanac }) {
  const t = useT();
  const tone = day.isAuspiciousDay ? c.auspicious : c.inauspicious;
  return (
    <View style={styles.title}>
      <View style={styles.qualityRow}>
        <OrtusText variant="caption" color={c.textSecondary}>
          {lunarDateShortText(t, day.lunar)}
        </OrtusText>
        <DayQualityTag isAuspicious={day.isAuspiciousDay} />
      </View>
      <View style={styles.nameRow}>
        <OrtusText variant="display" color={c.textPrimary} style={styles.shrink}>
          {t.tf('today_day_name', stemBranchName(t, day.dayPillar))}
        </OrtusText>
        <OrtusText variant="hanMedium" color={c.accentLight}>
          {stemBranchHan(day.dayPillar)}
        </OrtusText>
      </View>
      <OrtusText variant="captionStrong" color={tone.content}>
        {daySpiritText(t, day.daySpirit)}
      </OrtusText>
    </View>
  );
}

function DayTiles({ day }: { day: DayAlmanac }) {
  const t = useT();
  return (
    <View style={styles.tiles}>
      <InfoTile label={t.tf('today_tile_month')} value={stemBranchName(t, day.monthPillar)} style={styles.flex} />
      <InfoTile label={t.tf('today_tile_officer')} value={officerName(t, day.officer)} style={styles.flex} />
      <InfoTile label={t.tf('today_tile_mansion')} value={mansionName(t, day.mansion)} style={styles.flex} />
    </View>
  );
}

function DayAdvice({ day }: { day: DayAlmanac }) {
  const t = useT();
  return (
    <View style={styles.advice}>
      <SectionLabel text={t.tf('today_advice_label')} />
      <OrtusText variant="body" color={c.textBody}>
        {officerAdvice(t, day.officer)}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: OrtusSpacing.md },
  title: { gap: OrtusSpacing.xxs },
  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: OrtusSpacing.xs },
  shrink: { flexShrink: 1 },
  tiles: { flexDirection: 'row', gap: OrtusSpacing.xs },
  flex: { flex: 1 },
  advice: { gap: OrtusSpacing.xxs },
});
