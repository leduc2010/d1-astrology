import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { UiCue } from '../feedback/UiFeedback';
import { OrtusIcons } from '../icons/OrtusIcons';
import { OrtusPressable } from '../modifiers/OrtusPressable';
import { useAnimatedValue } from '../modifiers/useAnimatedValue';
import { OrtusAlpha } from '../theme/alpha';
import { OrtusColors as c } from '../theme/colors';
import { OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusGradients } from '../theme/gradients';
import { OrtusMotion } from '../theme/motion';
import { OrtusRadii } from '../theme/shapes';
import { OrtusText } from './OrtusText';
import { OrtusTag, TagTone } from './TagsAndChips';

export type OrtusCheckboxRowProps = {
  title: string;
  checked: boolean;
  /** Null locks the row: always shown in its state, not toggleable, announced as disabled. */
  onCheckedChange: ((checked: boolean) => void) | null;
  description?: string;
  /** Small neutral tag under the title (e.g. "Required"). */
  badge?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Consent-style checkbox row (S01-02): 22dp gold box, title, optional badge and description. */
export function OrtusCheckboxRow({ title, checked, onCheckedChange, description, badge, style, testID }: OrtusCheckboxRowProps) {
  const locked = onCheckedChange == null;
  const content = (
    <>
      <CheckBox checked={checked} locked={locked} />
      <View style={styles.texts}>
        <OrtusText variant="title" color={c.textPrimary}>
          {title}
        </OrtusText>
        {badge ? <OrtusTag text={badge} tone={TagTone.Neutral} style={styles.badge} /> : null}
        {description ? (
          <OrtusText variant="caption" color={c.textSecondary}>
            {description}
          </OrtusText>
        ) : null}
      </View>
    </>
  );
  if (locked) {
    return (
      <View
        accessible
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled: true }}
        testID={testID}
        style={[styles.row, style]}
      >
        {content}
      </View>
    );
  }
  return (
    <OrtusPressable
      onPress={() => onCheckedChange(!checked)}
      cue={UiCue.Toggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      testID={testID}
      outerStyle={[styles.outer, style]}
      style={styles.row}
    >
      {content}
    </OrtusPressable>
  );
}

function CheckBox({ checked, locked }: { checked: boolean; locked: boolean }) {
  const fill = useAnimatedValue(checked ? 1 : 0, OrtusMotion.quick);
  const fillStyle = useAnimatedStyle(() => ({ opacity: fill.get() }));
  return (
    <View style={[styles.box, locked && styles.locked]}>
      <Animated.View style={[styles.fill, fillStyle]}>
        <OrtusIcons.Check size={OrtusSizes.checkGlyph} color={c.onAccent} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignSelf: 'stretch' },
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    paddingVertical: OrtusSpacing.md,
    gap: OrtusSpacing.sm + OrtusSpacing.hair,
  },
  texts: { flex: 1, gap: OrtusSpacing.xxs },
  badge: { marginVertical: OrtusSpacing.xxs },
  box: {
    width: OrtusSizes.checkbox,
    height: OrtusSizes.checkbox,
    borderRadius: OrtusRadii.tag,
    overflow: 'hidden',
    backgroundColor: c.surfaceRaised,
    borderWidth: OrtusStroke.hairline,
    borderColor: c.controlBorder,
  },
  locked: { opacity: OrtusAlpha.LOCKED },
  fill: {
    position: 'absolute',
    top: -OrtusStroke.hairline,
    bottom: -OrtusStroke.hairline,
    start: -OrtusStroke.hairline,
    end: -OrtusStroke.hairline,
    backgroundImage: OrtusGradients.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
