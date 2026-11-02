import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { OrtusIcons } from '../icons/OrtusIcons';
import { OrtusPressable } from '../modifiers/OrtusPressable';
import { OrtusColors as c } from '../theme/colors';
import { OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusRadii } from '../theme/shapes';
import { OrtusIconButton } from './Buttons';
import { OrtusText } from './OrtusText';

export type OrtusTopBarProps = {
  title: string;
  /** Shows the back button when set. */
  onBack?: () => void;
  /** Accessible label of the back button (e.g. the `cd_back` string). */
  backAccessibilityLabel?: string;
  /** Trailing icon actions. */
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** C15 child-screen header: back button, centred serif title, optional trailing actions. */
export function OrtusTopBar({ title, onBack, backAccessibilityLabel, actions, style }: OrtusTopBarProps) {
  return (
    <View style={[styles.topBar, style]}>
      <OrtusText
        variant="headerTitle"
        color={c.textPrimary}
        numberOfLines={1}
        ellipsizeMode="tail"
        accessibilityRole="header"
        style={styles.topTitle}
      >
        {title}
      </OrtusText>
      {onBack ? (
        <OrtusIconButton
          icon={OrtusIcons.Back}
          accessibilityLabel={backAccessibilityLabel ?? title}
          onPress={onBack}
          style={styles.topStart}
        />
      ) : null}
      {actions ? <View style={[styles.actions, styles.topEnd]}>{actions}</View> : null}
    </View>
  );
}

export type OrtusRootHeaderProps = {
  /** Small gold label above the title (the date). */
  label: string;
  /** H1 greeting. */
  title: string;
  /** Profile name; its first letter is shown in a round monogram. */
  monogram?: string;
  onMonogramPress?: () => void;
  monogramAccessibilityLabel?: string;
  labelColor?: string;
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** C15 tab-root header: small gold date label, H1 greeting, then icon actions or the monogram. */
export function OrtusRootHeader({
  label,
  title,
  monogram,
  onMonogramPress,
  monogramAccessibilityLabel,
  labelColor = c.accent,
  actions,
  style,
}: OrtusRootHeaderProps) {
  return (
    <View style={[styles.rootHeader, style]}>
      <View style={styles.flex}>
        <SectionLabel text={label} color={labelColor} />
        <OrtusText
          variant="h1"
          color={c.textPrimary}
          numberOfLines={2}
          ellipsizeMode="tail"
          accessibilityRole="header"
          style={styles.rootTitle}
        >
          {title}
        </OrtusText>
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
      {monogram != null ? (
        <Monogram text={monogram} onPress={onMonogramPress} accessibilityLabel={monogramAccessibilityLabel} />
      ) : null}
    </View>
  );
}

function Monogram({ text, onPress, accessibilityLabel }: { text: string; onPress?: () => void; accessibilityLabel?: string }) {
  const letter = (
    <OrtusText variant="monogram" color={c.accentLight}>
      {Array.from(text)[0]?.toUpperCase() ?? ''}
    </OrtusText>
  );
  if (!onPress) {
    return (
      <View style={[styles.monogramOuter, styles.monogram]} accessibilityLabel={accessibilityLabel}>
        {letter}
      </View>
    );
  }
  return (
    <OrtusPressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      outerStyle={styles.monogramOuter}
      style={styles.monogram}
    >
      {letter}
    </OrtusPressable>
  );
}

export type SectionLabelProps = {
  text: string;
  /** Gold, or the mark color of the system a card speaks for. */
  color?: string;
  style?: StyleProp<TextStyle>;
};

/** The small uppercase label that introduces a section or card. */
export function SectionLabel({ text, color = c.accent, style }: SectionLabelProps) {
  return (
    <OrtusText variant="label" color={color} style={style}>
      {text.toUpperCase()}
    </OrtusText>
  );
}

const TITLE_INSET = OrtusSizes.headerButton + OrtusSpacing.sm;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    alignSelf: 'stretch',
    height: OrtusSizes.headerHeight,
    paddingHorizontal: OrtusSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { textAlign: 'center', paddingHorizontal: TITLE_INSET },
  topStart: { position: 'absolute', start: OrtusSpacing.md - (OrtusSizes.minTouch - OrtusSizes.headerButton) / 2 },
  topEnd: { position: 'absolute', end: OrtusSpacing.md },
  actions: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.xs },
  rootHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: OrtusSpacing.screen,
    paddingVertical: OrtusSpacing.sm,
  },
  rootTitle: { marginTop: OrtusSpacing.xxs },
  monogramOuter: { marginStart: OrtusSpacing.sm, width: OrtusSizes.avatar, height: OrtusSizes.avatar, borderRadius: OrtusRadii.pill },
  monogram: {
    flexGrow: 1,
    borderRadius: OrtusRadii.pill,
    backgroundColor: c.surfaceRaised,
    borderWidth: OrtusStroke.hairline,
    borderColor: c.glowBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
