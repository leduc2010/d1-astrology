import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useT } from '@/i18n';

import { OrtusIcons, type OrtusIconComponent } from '../icons/OrtusIcons';
import { glowStyle } from '../modifiers/glow';
import { useAnimatedValue } from '../modifiers/useAnimatedValue';
import { OrtusColors as c, type ToneColors } from '../theme/colors';
import { OrtusGlow, OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusGradients } from '../theme/gradients';
import { OrtusMotion } from '../theme/motion';
import { OrtusRadii } from '../theme/shapes';
import { OrtusText } from './OrtusText';

export type OrtusProgressBarProps = {
  /** 0..1; values outside are clamped. */
  progress: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** C10 progress bar with label and percentage, formatted in the app language. */
export function OrtusProgressBar({ progress, label, style }: OrtusProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const animated = useAnimatedValue(clamped, OrtusMotion.emphasized);
  const { language } = useT();
  const percent = useMemo(() => new Intl.NumberFormat(language, { style: 'percent' }).format(clamped), [clamped, language]);
  const fill = useAnimatedStyle(() => ({ width: `${animated.get() * 100}%` }));
  return (
    <View style={[styles.progress, style]}>
      {label ? (
        <View style={styles.progressLabels}>
          <OrtusText variant="caption" color={c.textSecondary} style={styles.flex}>
            {label}
          </OrtusText>
          <OrtusText variant="captionStrong" color={c.accent}>
            {percent}
          </OrtusText>
        </View>
      ) : null}
      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100), text: percent }}
      >
        <Animated.View style={[styles.fill, fill]} />
      </View>
    </View>
  );
}

export type StepIndicatorProps = {
  /** Segments filled gold. */
  done: number;
  total: number;
  /** 0-based segment that also glows. */
  current?: number;
  style?: StyleProp<ViewStyle>;
};

/** C10 step dots: [total] segments, the first [done] filled gold; the [current] one also glows. */
export function StepIndicator({ done, total, current, style }: StepIndicatorProps) {
  return (
    <View
      style={[styles.steps, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: Math.min(total, Math.max(done, (current ?? -1) + 1)) }}
    >
      {Array.from({ length: Math.max(0, total) }, (_, index) => {
        const isCurrent = index === current;
        return (
          <View
            key={index}
            style={[
              styles.step,
              { backgroundColor: index < done || isCurrent ? c.accent : c.surfaceRaised },
              isCurrent && glowStyle(c.accentGlowStrong, OrtusGlow.step),
            ]}
          />
        );
      })}
    </View>
  );
}

export const CalloutTone = { Info: 'Info', Warning: 'Warning', Good: 'Good' } as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- enum-like const + type
export type CalloutTone = (typeof CalloutTone)[keyof typeof CalloutTone];

const CALLOUTS: Record<CalloutTone, { colors: ToneColors; icon: OrtusIconComponent; tint: string }> = {
  Info: { colors: c.noteInfo, icon: OrtusIcons.Info, tint: c.mystic },
  Warning: { colors: c.noteWarning, icon: OrtusIcons.Warning, tint: c.danger },
  Good: { colors: c.noteGood, icon: OrtusIcons.Check, tint: c.success },
};

export type OrtusCalloutProps = { text: string; tone: CalloutTone; style?: StyleProp<ViewStyle> };

/** C11 note/callout. */
export function OrtusCallout({ text, tone, style }: OrtusCalloutProps) {
  const { colors, icon: Icon, tint } = CALLOUTS[tone];
  return (
    <View style={[styles.callout, { backgroundColor: colors.container, borderColor: colors.border }, style]}>
      <Icon size={OrtusSizes.calloutIcon} color={tint} />
      <OrtusText variant="caption" color={colors.content} style={styles.flexShrink}>
        {text}
      </OrtusText>
    </View>
  );
}

/** C12 disclaimer line at the bottom of reading / match / AI screens. */
export function Disclaimer({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.disclaimer, style]}>
      <OrtusIcons.Info size={OrtusSizes.disclaimerIcon} color={c.textMuted} />
      <OrtusText variant="captionSmall" color={c.textMuted} style={styles.disclaimerText}>
        {text}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  progress: { alignSelf: 'stretch', gap: OrtusSpacing.xs },
  progressLabels: { flexDirection: 'row' },
  track: {
    height: OrtusSizes.progressHeight,
    borderRadius: OrtusRadii.pill,
    overflow: 'hidden',
    backgroundColor: c.surfaceRaised,
  },
  fill: {
    height: '100%',
    borderRadius: OrtusRadii.pill,
    backgroundImage: OrtusGradients.goldProgress,
    ...glowStyle(c.accentGlowStrong, OrtusGlow.progress),
  },
  steps: { alignSelf: 'stretch', flexDirection: 'row', gap: OrtusSpacing.tight },
  step: { flex: 1, height: OrtusSizes.stepHeight, borderRadius: OrtusRadii.pill },
  callout: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: OrtusSpacing.sm,
    borderRadius: OrtusRadii.note,
    borderWidth: OrtusStroke.hairline,
    paddingHorizontal: OrtusSpacing.md,
    paddingVertical: OrtusSpacing.sm,
  },
  disclaimer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: OrtusSpacing.sm,
  },
  disclaimerText: { textAlign: 'center', paddingStart: OrtusSpacing.xxs, flexShrink: 1 },
});
