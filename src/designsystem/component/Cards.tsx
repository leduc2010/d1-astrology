import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OrtusIcons } from '../icons/OrtusIcons';
import { glowStyle } from '../modifiers/glow';
import { OrtusPressable } from '../modifiers/OrtusPressable';
import { OrtusColors as c } from '../theme/colors';
import { OrtusGlow, OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusGradients } from '../theme/gradients';
import { OrtusRadii } from '../theme/shapes';
import { SectionLabel } from './Headers';

export type OrtusCardProps = {
  onPress?: () => void;
  /** Inner padding; defaults to `OrtusSpacing.cardPadding`. */
  contentPadding?: number;
  /** Space between children (Kotlin `verticalArrangement = spacedBy(...)`). */
  gap?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
  children?: ReactNode;
};

/** C08 normal card: translucent surface, hairline gold border; sinks on press when clickable. */
export function OrtusCard({
  onPress,
  contentPadding = OrtusSpacing.cardPadding,
  gap,
  style,
  accessibilityLabel,
  testID,
  children,
}: OrtusCardProps) {
  const body = [styles.card, { padding: contentPadding, gap }];
  if (!onPress) {
    return (
      <View style={[body, style]} accessibilityLabel={accessibilityLabel} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <OrtusPressable
      onPress={onPress}
      pressScale
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      outerStyle={[styles.cardOuter, style]}
      style={body}
    >
      {children}
    </OrtusPressable>
  );
}

export type OrtusSectionCardProps = {
  title: string;
  /** Optional note on the label line, at the end. */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** A titled section of a detail screen: gold label, then the content blocks one rhythm apart. */
export function OrtusSectionCard({ title, trailing, style, children }: OrtusSectionCardProps) {
  return (
    <OrtusCard gap={OrtusSpacing.sm} style={style}>
      <View style={styles.sectionHeader}>
        <SectionLabel text={title} style={styles.flex} />
        {trailing}
      </View>
      {children}
    </OrtusCard>
  );
}

export type OrtusGlowCardProps = {
  onPress?: () => void;
  showStar?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
  children?: ReactNode;
};

/**
 * C09 glow card, the hero of a screen (max one per screen): violet halo, gold border and a
 * four-point star in the top-end corner.
 */
export function OrtusGlowCard({ onPress, showStar = true, style, accessibilityLabel, testID, children }: OrtusGlowCardProps) {
  const content = (
    <>
      {showStar ? <OrtusIcons.Sparkle size={OrtusSizes.cardStar} color={c.glowCardStar} style={styles.star} /> : null}
      <View style={styles.glowContent}>{children}</View>
    </>
  );
  const outer = [styles.cardOuter, glowStyle(c.glowShadow, OrtusGlow.card, OrtusGlow.cardOffsetY), style];
  if (!onPress) {
    return (
      <View style={outer} accessibilityLabel={accessibilityLabel} testID={testID}>
        <View style={styles.glowBox}>{content}</View>
      </View>
    );
  }
  return (
    <OrtusPressable
      onPress={onPress}
      pressScale
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      outerStyle={outer}
      style={styles.glowBox}
    >
      {content}
    </OrtusPressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cardOuter: { borderRadius: OrtusRadii.card },
  card: {
    borderRadius: OrtusRadii.card,
    overflow: 'hidden',
    backgroundColor: c.surface,
    borderWidth: OrtusStroke.hairline,
    borderColor: c.cardBorder,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  glowBox: {
    flexGrow: 1,
    borderRadius: OrtusRadii.card,
    overflow: 'hidden',
    backgroundImage: OrtusGradients.glowCard,
    borderWidth: OrtusStroke.hairline,
    borderColor: c.glowBorder,
  },
  star: { position: 'absolute', top: OrtusSpacing.md, end: OrtusSpacing.md },
  glowContent: { padding: OrtusSpacing.cardPadding },
});
