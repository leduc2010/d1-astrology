import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { CellState, GridCell, OrtusColors, OrtusSpacing, OrtusText, SectionLabel } from '../../designsystem';
import { type Branch, BRANCHES } from '../../engine';
import { useT } from '../../i18n';
import { hourRange, hourShortName, listText } from './almanacText';
import { branchName } from './ganZhiText';
import type { UiText } from './uiText';

const CELLS_PER_ROW = 6;

/** The twelve double hours as rows of [CELLS_PER_ROW], Tý first. */
const HOUR_ROWS: readonly (readonly Branch[])[] = Array.from(
  { length: BRANCHES.length / CELLS_PER_ROW },
  (_, row) => BRANCHES.slice(row * CELLS_PER_ROW, (row + 1) * CELLS_PER_ROW),
);

export type HoursProps = {
  auspicious: readonly Branch[];
  /** The current double hour, when the grid shows today. */
  now: Branch | null;
  style?: StyleProp<ViewStyle>;
};

/** "Auspicious hours" label, the current hour on the right (when [now] is set) and the grid. */
export function HoursSection({ auspicious, now, style }: HoursProps) {
  const t = useT();
  return (
    <View style={[styles.section, style]}>
      <View style={styles.header}>
        <SectionLabel text={t.tf('hours_title')} style={styles.fill} />
        {now !== null ? (
          <OrtusText variant="captionSmall" color={OrtusColors.textSecondary}>
            {t.tf('hours_now', hourShortName(t, now))}
          </OrtusText>
        ) : null}
      </View>
      <HoursGrid auspicious={auspicious} now={now} />
    </View>
  );
}

/**
 * The twelve double hours in two rows, Tý first. Auspicious hours carry a gold wash and [now]
 * (when the grid shows today) is solid gold.
 */
export function HoursGrid({ auspicious, now, style }: HoursProps) {
  const t = useT();
  return (
    <View style={[styles.grid, style]}>
      {HOUR_ROWS.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map((branch) => (
            <HourGridCell
              key={branch}
              t={t}
              branch={branch}
              isGood={auspicious.includes(branch)}
              isNow={branch === now}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/** What a screen reader says for one hour cell: "Tý hour, 23:00–00:59, auspicious, now". */
export function hourCellDescription(t: UiText, branch: Branch, isGood: boolean, isNow: boolean): string {
  const states = [isGood ? t.tf('hour_state_good') : null, isNow ? t.tf('hour_state_now') : null].filter(
    (s): s is string => s !== null,
  );
  return listText(t, [hourShortName(t, branch), hourRange(t, branch), ...states]);
}

type HourGridCellProps = { t: UiText; branch: Branch; isGood: boolean; isNow: boolean };

function HourGridCell({ t, branch, isGood, isNow }: HourGridCellProps) {
  const state = isNow ? CellState.Current : isGood ? CellState.Highlighted : CellState.Plain;
  return (
    <GridCell
      title={branchName(t, branch)}
      caption={hourRange(t, branch)}
      state={state}
      description={hourCellDescription(t, branch, isGood, isNow)}
      style={styles.fill}
    />
  );
}

const styles = StyleSheet.create({
  section: { alignSelf: 'stretch', gap: OrtusSpacing.sm },
  header: { flexDirection: 'row', alignItems: 'center' },
  grid: { alignSelf: 'stretch', gap: OrtusSpacing.tight },
  row: { flexDirection: 'row', gap: OrtusSpacing.tight },
  fill: { flex: 1 },
});
