import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { OrtusColors, OrtusGlowCard, OrtusSpacing, OrtusText, SectionLabel } from '../../designsystem';
import { Reveal } from './reveal';

export type PlaceholderSectionProps = {
  label: string;
  title: string;
  body: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Hero card used while a tab is still being built: a label, a serif title and a short body.
 * Keeps unfinished tabs on-brand instead of showing an empty screen.
 */
export function PlaceholderSection({ label, title, body, style }: PlaceholderSectionProps) {
  return (
    <Reveal index={0} style={[styles.fill, style]}>
      <OrtusGlowCard>
        <SectionLabel text={label} />
        <OrtusText variant="h2" color={OrtusColors.textPrimary} style={styles.title}>
          {title}
        </OrtusText>
        <OrtusText variant="body" color={OrtusColors.textSecondary} style={styles.body}>
          {body}
        </OrtusText>
      </OrtusGlowCard>
    </Reveal>
  );
}

const styles = StyleSheet.create({
  fill: { alignSelf: 'stretch' },
  title: { paddingTop: OrtusSpacing.xs },
  body: { paddingTop: OrtusSpacing.sm },
});
