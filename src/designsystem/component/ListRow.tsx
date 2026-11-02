import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

import { UiCue } from '../feedback/UiFeedback';
import { OrtusIcons, type OrtusIconComponent } from '../icons/OrtusIcons';
import { OrtusPressable } from '../modifiers/OrtusPressable';
import { useAnimatedValue } from '../modifiers/useAnimatedValue';
import { OrtusColors as c } from '../theme/colors';
import { OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusRadii } from '../theme/shapes';
import { SwitchTrack } from './Inputs';
import { OrtusText } from './OrtusText';

/** What sits at the end of an [OrtusListRow] (Kotlin sealed `RowTrailing`). */
export type RowTrailing =
  | { readonly kind: 'Chevron' }
  | { readonly kind: 'Value'; readonly text: string }
  | { readonly kind: 'Toggle'; readonly checked: boolean; readonly onCheckedChange: (checked: boolean) => void }
  /** A gold check: this row is the picked option in a list. */
  | { readonly kind: 'Selected' }
  | { readonly kind: 'None' };

// eslint-disable-next-line @typescript-eslint/no-redeclare -- factories share the type's name
export const RowTrailing = {
  Chevron: { kind: 'Chevron' } as RowTrailing,
  Selected: { kind: 'Selected' } as RowTrailing,
  None: { kind: 'None' } as RowTrailing,
  value: (text: string): RowTrailing => ({ kind: 'Value', text }),
  toggle: (checked: boolean, onCheckedChange: (checked: boolean) => void): RowTrailing => ({
    kind: 'Toggle',
    checked,
    onCheckedChange,
  }),
} as const;

export type OrtusListRowProps = {
  title: string;
  subtitle?: string;
  icon?: OrtusIconComponent;
  /** Replaces the icon box (e.g. a [DateBadge]). */
  leading?: ReactNode;
  trailing?: RowTrailing;
  showDivider?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * C07 list row. Rows live inside an `OrtusCard` with zero padding; dividers are drawn between.
 * A toggle row is one switch for accessibility: the whole row toggles and announces its state.
 */
export function OrtusListRow({
  title,
  subtitle,
  icon,
  leading,
  trailing = RowTrailing.Chevron,
  showDivider = false,
  onPress,
  style,
  testID,
}: OrtusListRowProps) {
  const isSelected = trailing.kind === 'Selected';
  const body = (
    <>
      {leading ?? (icon ? <IconBox icon={icon} isSelected={isSelected} /> : null)}
      <View style={styles.texts}>
        {/* A lone setting reads as plain text; a title over a subtitle names a thing and stands out. */}
        <OrtusText variant={subtitle == null ? 'body' : 'title'} color={c.textPrimary} numberOfLines={1}>
          {title}
        </OrtusText>
        {subtitle != null ? (
          <OrtusText variant="captionSmall" color={c.textSecondary} numberOfLines={2}>
            {subtitle}
          </OrtusText>
        ) : null}
      </View>
      <TrailingSlot trailing={trailing} />
    </>
  );

  let row: ReactNode;
  if (trailing.kind === 'Toggle') {
    row = (
      <OrtusPressable
        onPress={() => trailing.onCheckedChange(!trailing.checked)}
        cue={UiCue.Toggle}
        accessibilityRole="switch"
        accessibilityState={{ checked: trailing.checked }}
        testID={testID}
        style={styles.row}
      >
        {body}
      </OrtusPressable>
    );
  } else if (onPress) {
    row = (
      <OrtusPressable onPress={onPress} accessibilityState={isSelected ? { selected: true } : undefined} testID={testID} style={styles.row}>
        {body}
      </OrtusPressable>
    );
  } else {
    row = (
      <View style={styles.row} accessible accessibilityState={isSelected ? { selected: true } : undefined} testID={testID}>
        {body}
      </View>
    );
  }

  return (
    <View style={style}>
      {row}
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

function TrailingSlot({ trailing }: { trailing: RowTrailing }) {
  switch (trailing.kind) {
    case 'Chevron':
      return <OrtusIcons.ChevronRight size={OrtusSizes.iconSmall} color={c.textMuted} />;
    case 'Value':
      return (
        <OrtusText variant="buttonSmall" color={c.accentLight}>
          {trailing.text}
        </OrtusText>
      );
    case 'Toggle':
      return <SwitchTrack checked={trailing.checked} />;
    case 'Selected':
      return <OrtusIcons.Check size={OrtusSizes.iconSmall} color={c.accent} />;
    case 'None':
      return null;
  }
}

/** Leading date for a list row: a gold serif day over a short month ("7" / "NOV"). */
export function DateBadge({ day, month, style }: { day: string; month: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.dateBadge, style]}>
      <OrtusText variant="dateBadge" color={c.accentLight} numberOfLines={1}>
        {day}
      </OrtusText>
      <OrtusText variant="micro" color={c.textSecondary} numberOfLines={1}>
        {month.toUpperCase()}
      </OrtusText>
    </View>
  );
}

export type IconBoxProps = { icon: OrtusIconComponent; isSelected?: boolean; style?: StyleProp<ViewStyle> };

/** 36dp rounded box holding a gold line icon (C07); gold-washed when its row is the picked one. */
export function IconBox({ icon: Icon, isSelected = false, style }: IconBoxProps) {
  const progress = useAnimatedValue(isSelected ? 1 : 0);
  const wash = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [c.surfaceRaised, c.accentGlowSoft]),
  }));
  return (
    <Animated.View style={[styles.iconBox, wash, style]}>
      <Icon size={OrtusSizes.iconSmall} color={c.accent} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'stretch',
    minHeight: OrtusSizes.listRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: OrtusSpacing.sm,
    paddingHorizontal: OrtusSpacing.md,
    paddingVertical: OrtusSpacing.sm,
  },
  texts: { flex: 1 },
  divider: { height: OrtusStroke.hairline, marginHorizontal: OrtusSpacing.md, backgroundColor: c.divider },
  dateBadge: { minWidth: OrtusSizes.listIconBox, alignItems: 'center' },
  iconBox: {
    width: OrtusSizes.listIconBox,
    height: OrtusSizes.listIconBox,
    borderRadius: OrtusRadii.iconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
