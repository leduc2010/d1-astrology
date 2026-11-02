import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { asCard, OrtusColors, OrtusShapes, OrtusSpacing, OrtusStroke, OrtusText } from '../../designsystem';
import { type StemBranch, stemElement } from '../../engine';
import { useT } from '../../i18n';
import { elementColors } from './elementStyle';
import { stemBranchHan, stemBranchName } from './ganZhiText';

export type PillarTileProps = {
  label: string;
  pillar: StemBranch;
  style?: StyleProp<ViewStyle>;
};

/** One pillar (day, month or year): label, Han glyphs tinted by the stem's element, and its name. */
export function PillarTile({ label, pillar, style }: PillarTileProps) {
  const t = useT();
  const element = elementColors(stemElement(pillar.stem));
  const tone = asCard(element, element.content);
  const name = stemBranchName(t, pillar);
  return (
    <View
      style={[styles.tile, { backgroundColor: tone.container, borderColor: tone.border }, style]}
      // One stop for screen readers: the Han glyphs would be read letter by letter.
      accessible
      accessibilityLabel={`${label}, ${name}`}
    >
      <OrtusText variant="footnote" color={OrtusColors.textSecondary}>
        {label}
      </OrtusText>
      <OrtusText variant="han" color={tone.content}>
        {stemBranchHan(pillar)}
      </OrtusText>
      <OrtusText variant="captionStrong" color={OrtusColors.textPrimary} style={styles.name}>
        {name}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    ...OrtusShapes.tile,
    overflow: 'hidden',
    borderWidth: OrtusStroke.hairline,
    paddingVertical: OrtusSpacing.sm,
    paddingHorizontal: OrtusSpacing.xs,
    alignItems: 'center',
    gap: OrtusSpacing.xxs,
  },
  name: { textAlign: 'center' },
});
