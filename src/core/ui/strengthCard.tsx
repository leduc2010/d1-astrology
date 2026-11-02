import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OrtusColors as c, OrtusSectionCard, OrtusShapes, OrtusSpacing, OrtusText } from '../../designsystem';
import type { DayMasterStrength, Element } from '../../engine';
import { useT } from '../../i18n';
import { elementName } from './almanacText';
import { elementColors } from './elementStyle';
import { itemOf } from './uiText';

export type StrengthCardProps = {
  strength: DayMasterStrength;
  style?: StyleProp<ViewStyle>;
};

/**
 * How strong the day master stands and the element that brings the chart back to balance (Dụng
 * thần), with its helper and the one to go easy on, then colours, directions and fields for it.
 */
export function StrengthCard({ strength, style }: StrengthCardProps) {
  const t = useT();
  const { tf, ta } = t;
  const level = strength.level;
  const useful = strength.useful;
  return (
    <OrtusSectionCard title={tf('strength_label')} style={style}>
      <OrtusText variant="subtitle" color={c.textPrimary}>
        {itemOf(ta('strength_levels'), level)}
      </OrtusText>
      <OrtusText variant="body" color={c.textBody}>
        {itemOf(ta('strength_bodies'), level)}
      </OrtusText>
      <View style={styles.roles}>
        <ElementRole label={tf('strength_useful')} element={strength.useful} />
        <ElementRole label={tf('strength_favorable')} element={strength.favorable} />
        <ElementRole label={tf('strength_unfavorable')} element={strength.unfavorable} />
      </View>
      <OrtusText variant="caption" color={c.textSecondary}>
        {tf(
          'strength_useful_why',
          elementName(t, strength.useful),
          elementName(t, strength.favorable),
          elementName(t, strength.unfavorable),
        )}
      </OrtusText>
      <View style={styles.insights}>
        <InsightLine label={tf('strength_colors')} value={itemOf(ta('useful_colors'), useful)} />
        <InsightLine label={tf('strength_directions')} value={itemOf(ta('useful_directions'), useful)} />
        <InsightLine label={tf('strength_fields')} value={itemOf(ta('useful_fields'), useful)} />
        <InsightLine label={tf('strength_habits')} value={itemOf(ta('useful_habits'), useful)} />
      </View>
      <OrtusText variant="footnote" color={c.textMuted}>
        {tf('strength_footnote')}
      </OrtusText>
    </OrtusSectionCard>
  );
}

/** A role label over the element's name in its own colour. */
function ElementRole({ label, element }: { label: string; element: Element }) {
  return (
    <View style={styles.role}>
      <OrtusText variant="footnote" color={c.textSecondary}>
        {label}
      </OrtusText>
      <ElementPill element={element} />
    </View>
  );
}

/** An element's name on its tinted container, e.g. "Metal" in silver. */
export function ElementPill({ element, style }: { element: Element; style?: StyleProp<ViewStyle> }) {
  const t = useT();
  const tone = elementColors(element);
  return (
    <View style={[styles.pill, { backgroundColor: tone.container }, style]}>
      <OrtusText variant="tag" color={tone.content} numberOfLines={1}>
        {elementName(t, element)}
      </OrtusText>
    </View>
  );
}

/** A small caption label over a line of body text. */
export function InsightLine({ label, value, style }: { label: string; value: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <OrtusText variant="footnote" color={c.textSecondary}>
        {label}
      </OrtusText>
      <OrtusText variant="body" color={c.textBody}>
        {value}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  roles: { flexDirection: 'row', gap: OrtusSpacing.sm },
  role: { flex: 1, gap: OrtusSpacing.xxs, alignItems: 'flex-start' },
  insights: { gap: OrtusSpacing.xs },
  pill: {
    ...OrtusShapes.tag,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: OrtusSpacing.xs,
    paddingVertical: OrtusSpacing.hair,
  },
});
