import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

import { UiCue } from '../feedback/UiFeedback';
import { OrtusPressable } from '../modifiers/OrtusPressable';
import { useAnimatedValue } from '../modifiers/useAnimatedValue';
import { OrtusColors as c, type ToneColors } from '../theme/colors';
import { OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusGradients } from '../theme/gradients';
import { TRANSPARENT } from '../theme/palette';
import { OrtusRadii } from '../theme/shapes';
import { OrtusTypography } from '../theme/typography';
import { OrtusText } from './OrtusText';

/** C05 tag tones. Element tones take their hue from the five-element palette. */
export const TagTone = {
  Auspicious: 'Auspicious',
  Inauspicious: 'Inauspicious',
  Ai: 'Ai',
  Neutral: 'Neutral',
  NeutralOnGlow: 'NeutralOnGlow',
  Gold: 'Gold',
  Metal: 'Metal',
  Wood: 'Wood',
  Water: 'Water',
  Fire: 'Fire',
  Earth: 'Earth',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- enum-like const + type
export type TagTone = (typeof TagTone)[keyof typeof TagTone];

const TAG_TONES: Record<TagTone, ToneColors> = {
  Auspicious: c.auspicious,
  Inauspicious: c.inauspicious,
  Ai: c.ai,
  Neutral: c.neutralTag,
  NeutralOnGlow: c.neutralTagOnGlow,
  Gold: c.goldChip,
  Metal: c.elements.metal,
  Wood: c.elements.wood,
  Water: c.elements.water,
  Fire: c.elements.fire,
  Earth: c.elements.earth,
};

/** The colors of a tag tone (Kotlin `OrtusColors.tone(TagTone)`). */
export function tagToneColors(tone: TagTone): ToneColors {
  return TAG_TONES[tone];
}

export type OrtusTagProps = {
  text: string;
  tone: TagTone;
  /** Han character shown before the label (element tags). */
  han?: string;
  style?: StyleProp<ViewStyle>;
};

/** C05 tag (h24, r7). */
export function OrtusTag({ text, tone, han, style }: OrtusTagProps) {
  const colors = TAG_TONES[tone];
  return (
    <View style={[styles.tag, { backgroundColor: colors.container }, style]}>
      {han ? (
        <OrtusText variant="hanTag" color={colors.content}>
          {han}
        </OrtusText>
      ) : null}
      <OrtusText variant="tag" color={colors.content} numberOfLines={1}>
        {text}
      </OrtusText>
    </View>
  );
}

/** C05 premium tag: gold gradient, bold tracked label. */
export function PremiumTag({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.premium, style]}>
      <OrtusText variant="label" color={c.onAccent}>
        {text.toUpperCase()}
      </OrtusText>
    </View>
  );
}

/** Which reading system an insight is "based on" (C04 source chip). */
export const InsightSource = { TuVi: 'TuVi', BatTu: 'BatTu', Astrology: 'Astrology' } as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- enum-like const + type
export type InsightSource = (typeof InsightSource)[keyof typeof InsightSource];

const SOURCE_TONES: Record<InsightSource, ToneColors> = {
  TuVi: c.sourceTuVi,
  BatTu: c.sourceBatTu,
  Astrology: c.sourceAstrology,
};

const SOURCE_MARKS: Record<InsightSource, string> = {
  TuVi: c.sourceMarkTuVi,
  BatTu: c.sourceMarkBatTu,
  Astrology: c.sourceMarkAstrology,
};

/** The colour naming a system on its own, as a heading above what it sees (Kotlin `markColor`). */
export function insightSourceMarkColor(source: InsightSource): string {
  return SOURCE_MARKS[source];
}

export type SourceChipProps = { text: string; source: InsightSource; style?: StyleProp<ViewStyle> };

/** C04 "based on" chip: states the source of an insight so readings stay transparent. */
export function SourceChip({ text, source, style }: SourceChipProps) {
  const tone = SOURCE_TONES[source];
  return (
    <View style={[styles.sourceChip, { backgroundColor: tone.container, borderColor: tone.border }, style]}>
      <OrtusText variant="tag" color={tone.content} numberOfLines={1}>
        {text}
      </OrtusText>
    </View>
  );
}

export type OrtusChipProps = {
  text: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** C04 selectable chip: solid gold when selected, translucent outline otherwise; fades between. */
export function OrtusChip({ text, selected, onPress, style, testID }: OrtusChipProps) {
  const progress = useAnimatedValue(selected ? 1 : 0);
  const animated = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [c.surfaceRaised, c.accent]),
    borderColor: interpolateColor(progress.get(), [0, 1], [c.outline, TRANSPARENT]),
  }));
  return (
    <OrtusPressable
      onPress={onPress}
      cue={UiCue.Select}
      pressScale
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      testID={testID}
      hitSlop={(OrtusSizes.minTouch - OrtusSizes.chipHeight) / 2}
      outerStyle={[styles.chipOuter, style]}
      style={styles.chipClip}
    >
      <Animated.View style={[styles.chip, animated]}>
        <Text
          numberOfLines={1}
          style={[selected ? OrtusTypography.captionStrong : OrtusTypography.caption, { color: selected ? c.onAccent : c.textPrimary }]}
        >
          {text}
        </Text>
      </Animated.View>
    </OrtusPressable>
  );
}

export type ColorDotProps = { color: string; size?: number; style?: StyleProp<ViewStyle> };

/** Small round colour key: legends, star rows, status marks. */
export function ColorDot({ color, size = OrtusSizes.dot, style }: ColorDotProps) {
  return <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    height: OrtusSizes.tagHeight,
    borderRadius: OrtusRadii.tag,
    paddingHorizontal: OrtusSpacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: OrtusSpacing.xxs,
  },
  premium: {
    alignSelf: 'flex-start',
    borderRadius: OrtusRadii.tag,
    backgroundImage: OrtusGradients.gold,
    paddingHorizontal: OrtusSpacing.xs,
    paddingVertical: OrtusSpacing.xxs,
  },
  sourceChip: {
    alignSelf: 'flex-start',
    height: OrtusSizes.sourceChipHeight,
    borderRadius: OrtusRadii.pill,
    borderWidth: OrtusStroke.hairline,
    paddingHorizontal: OrtusSpacing.sm,
    justifyContent: 'center',
  },
  chipOuter: { alignSelf: 'flex-start', height: OrtusSizes.chipHeight, borderRadius: OrtusRadii.pill },
  chipClip: { borderRadius: OrtusRadii.pill },
  chip: {
    flexGrow: 1,
    borderRadius: OrtusRadii.pill,
    borderWidth: OrtusStroke.hairline,
    paddingHorizontal: OrtusSpacing.md,
    justifyContent: 'center',
  },
});
