import { useState, type ReactNode } from 'react';
import {
  I18nManager,
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

import { UiCue } from '../feedback/UiFeedback';
import type { OrtusIconComponent } from '../icons/OrtusIcons';
import { glowStyle } from '../modifiers/glow';
import { OrtusPressable } from '../modifiers/OrtusPressable';
import { useAnimatedValue } from '../modifiers/useAnimatedValue';
import { OrtusColors as c } from '../theme/colors';
import { OrtusGlow, OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusGradients } from '../theme/gradients';
import { TRANSPARENT } from '../theme/palette';
import { OrtusRadii } from '../theme/shapes';
import { OrtusTypography } from '../theme/typography';
import { OrtusText } from './OrtusText';

/** translateX that follows the reading direction, like Compose `Modifier.offset`. */
const DIRECTION = I18nManager.isRTL ? -1 : 1;

/** The quiet label above a form control. */
export function OrtusFieldLabel({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <OrtusText variant="caption" color={c.textSecondary}>
        {text}
      </OrtusText>
    </View>
  );
}

/** A form field that is not a text box (date wheels, chips, toggles): label over its controls. */
export function OrtusField({ label, style, children }: { label: string; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <View style={[styles.field, style]}>
      <OrtusFieldLabel text={label} />
      {children}
    </View>
  );
}

export type OrtusTextFieldProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'style' | 'placeholder' | 'placeholderTextColor' | 'multiline'
> & {
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  placeholder?: string;
  helper?: string;
  /** Shows a cinnabar border and replaces the helper. */
  error?: string;
  singleLine?: boolean;
  leadingIcon?: OrtusIconComponent;
  style?: StyleProp<ViewStyle>;
};

const BORDER_IDLE = 0;
const BORDER_FOCUSED = 1;
const BORDER_ERROR = 2;

/**
 * C02 text field: label above, surface2 field, gold border and soft glow when focused,
 * cinnabar border and helper when [error] is set.
 */
export function OrtusTextField({
  value,
  onChangeText,
  label,
  placeholder,
  helper,
  error,
  singleLine = true,
  leadingIcon: Leading,
  style,
  onFocus,
  onBlur,
  accessibilityLabel,
  ...rest
}: OrtusTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasError = error != null;
  const state = useAnimatedValue(hasError ? BORDER_ERROR : focused ? BORDER_FOCUSED : BORDER_IDLE);
  const border = useAnimatedStyle(() => ({
    borderColor: interpolateColor(state.get(), [BORDER_IDLE, BORDER_FOCUSED, BORDER_ERROR], [c.outline, c.accent, c.danger]),
  }));
  const supporting = error ?? helper;
  return (
    <View style={[styles.field, style]}>
      <OrtusFieldLabel text={label} />
      <Animated.View
        style={[
          styles.inputBox,
          !singleLine && styles.multiline,
          focused && !hasError && glowStyle(c.accentGlowSoft, OrtusGlow.field),
          border,
        ]}
      >
        {Leading ? <Leading size={OrtusSizes.iconSmall} color={c.textMuted} /> : null}
        <TextInput
          {...rest}
          value={value}
          onChangeText={onChangeText}
          multiline={!singleLine}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          cursorColor={c.accent}
          selectionColor={c.accent}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={supporting}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[OrtusTypography.body, styles.input, !singleLine && styles.inputMultiline]}
        />
      </Animated.View>
      {supporting != null ? (
        <OrtusText variant="captionSmall" color={hasError ? c.danger : c.textSecondary}>
          {supporting}
        </OrtusText>
      ) : null}
    </View>
  );
}

export type OrtusSegmentedControlProps = {
  options: readonly string[];
  /** Outside the options = no selection yet (an explicit choice is required). */
  selectedIndex: number;
  onSelect: (index: number) => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * C03 segmented control. The gold pill slides between options instead of jumping, which keeps
 * the motion calm and legible.
 */
export function OrtusSegmentedControl({ options, selectedIndex, onSelect, compact = false, style, testID }: OrtusSegmentedControlProps) {
  if (options.length === 0) throw new Error('Segmented control needs at least one option');
  const [width, setWidth] = useState(0);
  const segmentWidth = width / options.length;
  const hasSelection = selectedIndex >= 0 && selectedIndex < options.length;
  const index = useAnimatedValue(Math.min(options.length - 1, Math.max(0, selectedIndex)));
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: DIRECTION * index.get() * segmentWidth }] }));
  const height = compact ? OrtusSizes.segmentedHeightSmall : OrtusSizes.segmentedHeight;
  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(e.nativeEvent.layout.width - 2 * (OrtusSizes.segmentedInset + OrtusStroke.hairline));
  return (
    <View style={[styles.segmented, { height }, style]} accessibilityRole="tablist" testID={testID} onLayout={onLayout}>
      {hasSelection && width > 0 ? <Animated.View style={[styles.segmentPill, { width: segmentWidth }, indicator]} /> : null}
      {options.map((option, i) => (
        <Segment key={`${i}:${option}`} text={option} selected={i === selectedIndex} onPress={() => onSelect(i)} />
      ))}
    </View>
  );
}

function Segment({ text, selected, onPress }: { text: string; selected: boolean; onPress: () => void }) {
  const progress = useAnimatedValue(selected ? 1 : 0);
  const color = useAnimatedStyle(() => ({
    color: interpolateColor(progress.get(), [0, 1], [c.textSecondary, c.onAccent]),
  }));
  return (
    <OrtusPressable
      onPress={onPress}
      cue={UiCue.Select}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      outerStyle={styles.segmentOuter}
      style={styles.segment}
    >
      <Animated.Text
        numberOfLines={1}
        style={[selected ? OrtusTypography.buttonSmall : OrtusTypography.caption, styles.segmentText, color]}
      >
        {text}
      </Animated.Text>
    </OrtusPressable>
  );
}

export type OrtusSwitchProps = {
  checked: boolean;
  /** Null when a parent row owns the toggle: the switch is then purely visual. */
  onCheckedChange: ((checked: boolean) => void) | null;
  /** Spoken state, e.g. "On" / "Off" from strings. */
  stateDescription?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const THUMB_OFF_X = OrtusSizes.switchThumbInset;
const THUMB_ON_X = OrtusSizes.switchWidth - OrtusSizes.switchThumbOn - OrtusSizes.switchThumbInset;

/** C06 switch 51x31: gold gradient track when on, thumb glides across. */
export function OrtusSwitch({ checked, onCheckedChange, stateDescription, accessibilityLabel, style, testID }: OrtusSwitchProps) {
  const track = <SwitchTrack checked={checked} />;
  if (!onCheckedChange) {
    return (
      <View style={style} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden testID={testID}>
        {track}
      </View>
    );
  }
  return (
    <OrtusPressable
      onPress={() => onCheckedChange(!checked)}
      cue={UiCue.Toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={stateDescription ? { text: stateDescription } : undefined}
      hitSlop={(OrtusSizes.minTouch - OrtusSizes.switchHeight) / 2}
      testID={testID}
      outerStyle={[styles.switchOuter, style]}
      style={styles.switchClip}
    >
      {track}
    </OrtusPressable>
  );
}

/** The visual switch alone; rows that own the toggle can place it directly. */
export function SwitchTrack({ checked }: { checked: boolean }) {
  const progress = useAnimatedValue(checked ? 1 : 0);
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: DIRECTION * (THUMB_OFF_X + (THUMB_ON_X - THUMB_OFF_X) * progress.get()) }],
    backgroundColor: interpolateColor(progress.get(), [0, 1], [c.textSecondary, c.onAccent]),
  }));
  const thumbSize = checked ? OrtusSizes.switchThumbOn : OrtusSizes.switchThumbOff;
  return (
    <View style={[styles.track, checked ? styles.trackOn : styles.trackOff]}>
      <Animated.View style={[styles.thumb, { width: thumbSize, height: thumbSize }, thumb]} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { alignSelf: 'stretch', gap: OrtusSpacing.xs },
  inputBox: {
    height: OrtusSizes.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: OrtusSpacing.sm,
    paddingHorizontal: OrtusSpacing.md,
    borderRadius: OrtusRadii.input,
    backgroundColor: c.surfaceRaised,
    borderWidth: OrtusStroke.hairline,
  },
  multiline: { height: undefined, minHeight: OrtusSizes.inputHeight, alignItems: 'flex-start' },
  input: { flex: 1, color: c.textPrimary, padding: 0, textAlignVertical: 'center' },
  inputMultiline: { paddingVertical: OrtusSpacing.sm, textAlignVertical: 'top' },
  segmented: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    borderRadius: OrtusRadii.pill,
    backgroundColor: c.surfaceRaised,
    borderWidth: OrtusStroke.hairline,
    borderColor: c.outline,
    padding: OrtusSizes.segmentedInset,
  },
  segmentPill: {
    position: 'absolute',
    top: OrtusSizes.segmentedInset,
    bottom: OrtusSizes.segmentedInset,
    start: OrtusSizes.segmentedInset,
    borderRadius: OrtusRadii.pill,
    backgroundImage: OrtusGradients.gold,
  },
  segmentOuter: { flex: 1, borderRadius: OrtusRadii.pill },
  segment: { borderRadius: OrtusRadii.pill, alignItems: 'center', justifyContent: 'center' },
  segmentText: { textAlign: 'center' },
  switchOuter: { width: OrtusSizes.switchWidth, height: OrtusSizes.switchHeight, borderRadius: OrtusRadii.pill },
  switchClip: { borderRadius: OrtusRadii.pill },
  track: {
    width: OrtusSizes.switchWidth,
    height: OrtusSizes.switchHeight,
    borderRadius: OrtusRadii.pill,
    borderWidth: OrtusStroke.hairline,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trackOn: { backgroundImage: OrtusGradients.gold, borderColor: TRANSPARENT },
  trackOff: { backgroundColor: c.surfaceRaised, borderColor: c.outline },
  // Offsets are measured from the outer edge, as in Compose; the border sits inside the box.
  thumb: { position: 'absolute', start: -OrtusStroke.hairline, borderRadius: OrtusRadii.pill },
});
