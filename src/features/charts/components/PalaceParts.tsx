import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { branchName, listText, palaceRoleName, transformationColors, transformationName, type UiText } from '@/core/ui';
import { OrtusColors as c, OrtusShapes, OrtusSpacing, OrtusTag, OrtusText, TagTone } from '@/designsystem';
import type { Transformation } from '@/engine';
import { useT } from '@/i18n';

import type { PalaceView } from '../model/chartViews';

/* Pieces shared by the selected-palace card and the palace sheet. */

/** "Wealth (Ngọ), Career (Tuất)". */
export const palacesText = (t: UiText, palaces: readonly PalaceView[]): string =>
  listText(
    t,
    palaces.map((p) => t.tf('charts_palace_ref', palaceRoleName(t, p.role), branchName(t, p.branch))),
  );

export function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <OrtusText variant="captionStrong" color={c.textSecondary}>
        {label}
      </OrtusText>
      <OrtusText variant="caption" color={c.textBody} style={styles.flex}>
        {value}
      </OrtusText>
    </View>
  );
}

/** Thân / Tuần / Triệt tags when they fall on [palace]; nothing otherwise. */
export function PalaceMarks({ palace, neutral = TagTone.Neutral }: { palace: PalaceView; neutral?: TagTone }) {
  const { tf } = useT();
  const marks = [
    palace.isBody ? ([tf('charts_mark_body'), TagTone.Gold] as const) : null,
    palace.isVoid ? ([tf('charts_mark_void'), neutral] as const) : null,
    palace.isCut ? ([tf('charts_mark_cut'), neutral] as const) : null,
  ].filter((mark): mark is readonly [string, TagTone] => mark !== null);
  if (marks.length === 0) return null;
  return (
    <View style={styles.marks}>
      {marks.map(([text, tone]) => (
        <OrtusTag key={text} text={text} tone={tone} />
      ))}
    </View>
  );
}

/** A Tứ Hóa name on its own tone, e.g. "Lộc" in green. */
export function TransformationTag({
  transformation,
  style,
}: {
  transformation: Transformation;
  style?: StyleProp<TextStyle & ViewStyle>;
}) {
  const t = useT();
  const tone = transformationColors(transformation);
  return (
    <OrtusText
      variant="tag"
      color={tone.content}
      numberOfLines={1}
      style={[styles.tag, { backgroundColor: tone.container }, style]}
    >
      {transformationName(t, transformation)}
    </OrtusText>
  );
}

const styles = StyleSheet.create({
  detail: { flexDirection: 'row', gap: OrtusSpacing.xs },
  flex: { flex: 1 },
  marks: { flexDirection: 'row', gap: OrtusSpacing.xs },
  tag: {
    ...OrtusShapes.tag,
    overflow: 'hidden',
    textAlign: 'center',
    paddingHorizontal: OrtusSpacing.xs,
    paddingVertical: OrtusSpacing.hair,
  },
});
