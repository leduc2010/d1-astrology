import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OrtusIcons, type OrtusIconComponent } from '../icons/OrtusIcons';
import { OrtusColors as c, type ToneColors } from '../theme/colors';
import { OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusGradients } from '../theme/gradients';
import { OrtusRadii } from '../theme/shapes';
import { OrtusText } from './OrtusText';

/** Small sunken label/value tile inside a card ("Month · Mau Tuat"). */
export function InfoTile({ label, value, style }: { label: string; value: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.infoTile, style]}>
      <OrtusText variant="footnote" color={c.textSecondary} numberOfLines={1}>
        {label}
      </OrtusText>
      <OrtusText variant="captionStrong" color={c.textPrimary} numberOfLines={1}>
        {value}
      </OrtusText>
    </View>
  );
}

export const CellState = { Plain: 'Plain', Highlighted: 'Highlighted', Current: 'Current' } as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- enum-like const + type
export type CellState = (typeof CellState)[keyof typeof CellState];

const CELL_LOOK: Record<CellState, { box: ViewStyle; title: string; caption: string }> = {
  Plain: { box: { backgroundColor: c.insetContainer }, title: c.textMuted, caption: c.textMuted },
  Highlighted: {
    box: { backgroundColor: c.goldCell.container, borderWidth: OrtusStroke.hairline, borderColor: c.goldCell.border },
    title: c.goldCell.content,
    caption: c.goldCellCaption,
  },
  Current: { box: { backgroundImage: OrtusGradients.gold }, title: c.onAccent, caption: c.onAccentMuted },
};

export type GridCellProps = {
  title: string;
  caption: string;
  state: CellState;
  /** Read by screen readers in place of the two lines. */
  description: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Compact two-line cell for grids such as the twelve double hours. Highlighted marks a good cell
 * with a gold wash; Current is the solid gold "now" cell.
 */
export function GridCell({ title, caption, state, description, style }: GridCellProps) {
  const look = CELL_LOOK[state];
  return (
    <View
      style={[styles.cell, look.box, style]}
      accessible
      accessibilityLabel={description}
      accessibilityState={state === CellState.Current ? { selected: true } : undefined}
    >
      <OrtusText
        variant={state === CellState.Plain ? 'caption' : 'captionStrong'}
        color={look.title}
        numberOfLines={1}
        style={styles.center}
      >
        {title}
      </OrtusText>
      <OrtusText variant="micro" color={look.caption} numberOfLines={1} style={styles.center}>
        {caption}
      </OrtusText>
    </View>
  );
}

/** Round colour sample (lucky colours). */
export function ColorSwatch({ color, style }: { color: string; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.swatch, { backgroundColor: color }, style]} />;
}

export type OrtusToneCardProps = {
  label: string;
  tone: ToneColors;
  icon?: OrtusIconComponent;
  contentPadding?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Card washed in a semantic tone (mystic message, good / avoid lists): tinted fill, tone hairline
 * and an upper-case label in the tone colour, optionally led by an icon.
 */
export function OrtusToneCard({ label, tone, icon: Icon, contentPadding = OrtusSpacing.cardPadding, style, children }: OrtusToneCardProps) {
  return (
    <View
      style={[styles.toneCard, { backgroundColor: tone.container, borderColor: tone.border, padding: contentPadding }, style]}
    >
      <View style={styles.toneHeader}>
        {Icon ? <Icon size={OrtusSizes.cardStar} color={tone.content} /> : null}
        <OrtusText variant="label" color={tone.content}>
          {label.toUpperCase()}
        </OrtusText>
      </View>
      {children}
    </View>
  );
}

/** Violet card for personal messages: a sparkle label above the content. */
export function OrtusMysticCard({ label, style, children }: { label: string; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <OrtusToneCard label={label} tone={c.mysticCard} icon={OrtusIcons.Sparkle} style={style}>
      {children}
    </OrtusToneCard>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  infoTile: {
    minHeight: OrtusSizes.infoTile,
    borderRadius: OrtusRadii.tile,
    backgroundColor: c.insetContainer,
    paddingHorizontal: OrtusSpacing.sm,
    paddingVertical: OrtusSpacing.tight,
    justifyContent: 'center',
  },
  cell: {
    minHeight: OrtusSizes.hourCell,
    borderRadius: OrtusRadii.cell,
    overflow: 'hidden',
    paddingHorizontal: OrtusSpacing.hair,
    paddingVertical: OrtusSpacing.tight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: OrtusSizes.swatch, height: OrtusSizes.swatch, borderRadius: OrtusRadii.pill },
  toneCard: { borderRadius: OrtusRadii.card, borderWidth: OrtusStroke.hairline, overflow: 'hidden', gap: OrtusSpacing.xs },
  toneHeader: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.xs },
});
