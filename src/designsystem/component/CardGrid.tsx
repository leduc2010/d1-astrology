import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OrtusColors as c } from '../theme/colors';
import { OrtusSpacing } from '../theme/dimens';
import { OrtusCard } from './Cards';
import { SectionLabel } from './Headers';
import { OrtusText } from './OrtusText';

/**
 * Cards side by side at equal height (two-up fact grids). Give each child `style={{ flex: 1 }}`:
 * the row stretches short cards to match the tallest.
 */
export function OrtusCardRow({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export type OrtusFactCardProps = {
  label: string;
  value: string;
  hint?: string;
  /** Shown after the value on the same line. */
  valueTrailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** A single fact in a grid: gold uppercase label, then a value and an optional hint. */
export function OrtusFactCard({ label, value, hint, valueTrailing, style }: OrtusFactCardProps) {
  return (
    <OrtusCard contentPadding={OrtusSpacing.md} style={style}>
      <SectionLabel text={label} />
      <View style={styles.valueRow}>
        <OrtusText variant="subtitle" color={c.textPrimary} style={styles.value}>
          {value}
        </OrtusText>
        {valueTrailing}
      </View>
      {hint ? (
        <OrtusText variant="captionSmall" color={c.textSecondary}>
          {hint}
        </OrtusText>
      ) : null}
    </OrtusCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', alignSelf: 'stretch', gap: OrtusSpacing.cardGap },
  valueRow: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: OrtusSpacing.xxs, gap: OrtusSpacing.tight },
  value: { flexShrink: 1 },
});
