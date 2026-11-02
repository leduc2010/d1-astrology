import { useEffect, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { OrtusIcons } from '../icons/OrtusIcons';
import { OrtusPressable } from '../modifiers/OrtusPressable';
import { useReducedMotion } from '../theme/DesignSystemProvider';
import { OrtusColors as c } from '../theme/colors';
import { OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusGradients } from '../theme/gradients';
import { OrtusMotion } from '../theme/motion';
import { OrtusRadii, OrtusShapes } from '../theme/shapes';
import { OrtusTypography } from '../theme/typography';
import { OrtusText } from './OrtusText';

const TYPING_DOTS = 3;
const TYPING_DIM = 0.3;

/** Leaves room on the far side so a bubble never spans the whole row. */
const BUBBLE_INSET = OrtusSpacing.xxxl;

/** The owner's question: a gold-washed bubble on the end side. */
export function QuestionBubble({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  const tone = c.chatQuestion;
  return (
    <View style={[styles.questionRow, style]}>
      <View style={[styles.bubble, OrtusShapes.bubbleQuestion, { backgroundColor: tone.container, borderColor: tone.border }]}>
        <OrtusText variant="body" color={tone.content}>
          {text}
        </OrtusText>
      </View>
    </View>
  );
}

/** An answer: the AI avatar beside a raised bubble; children are laid out in a column. */
export function AnswerBubble({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const tone = c.chatAnswer;
  return (
    <View style={[styles.answerRow, style]}>
      <AiAvatar />
      <View
        style={[
          styles.bubble,
          styles.answerBubble,
          OrtusShapes.bubbleAnswer,
          { backgroundColor: tone.container, borderColor: tone.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/** 30dp mystic orb with a sparkle: marks what the AI says. */
export function AiAvatar({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.avatar, style]}>
      <OrtusIcons.Sparkle size={OrtusSizes.iconTiny} color={c.textPrimary} />
    </View>
  );
}

/** Three dots breathing in turn while an answer is being written; still under reduced motion. */
export function TypingDots({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.dots, style]}>
      {Array.from({ length: TYPING_DOTS }, (_, i) => (
        <TypingDot key={i} index={i} />
      ))}
    </View>
  );
}

function TypingDot({ index }: { index: number }) {
  const reduced = useReducedMotion();
  const alpha = useSharedValue(reduced ? 1 : TYPING_DIM);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(alpha);
      alpha.set(1);
      return;
    }
    alpha.set(TYPING_DIM);
    alpha.set(
      withDelay(
        OrtusMotion.STAGGER * 2 * index,
        withRepeat(withTiming(1, { duration: OrtusMotion.EMPHASIZED, easing: OrtusMotion.glide }), -1, true),
      ),
    );
    return () => cancelAnimation(alpha);
  }, [alpha, index, reduced]);
  const fade = useAnimatedStyle(() => ({ opacity: alpha.get() }));
  return <Animated.View style={[styles.dot, fade]} />;
}

/** Small counter pill, e.g. "Free 2/3"; [highlighted] marks the allowance in use right now. */
export function QuotaPill({ text, highlighted, style }: { text: string; highlighted: boolean; style?: StyleProp<ViewStyle> }) {
  const tone = highlighted ? c.mysticCard : c.neutralTag;
  return (
    <View
      style={[styles.quota, { backgroundColor: tone.container, borderColor: highlighted ? tone.border : c.outline }, style]}
    >
      {highlighted ? <View style={styles.quotaDot} /> : null}
      <OrtusText variant="captionSmall" color={highlighted ? c.textPrimary : c.textSecondary} numberOfLines={1}>
        {text}
      </OrtusText>
    </View>
  );
}

/** A ready-made question to tap: mystic-washed, with a sparkle, so it reads as "ask this". */
export function PromptCard({ text, onPress, style }: { text: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const tone = c.mysticCard;
  return (
    <OrtusPressable
      onPress={onPress}
      outerStyle={[styles.promptOuter, style]}
      style={[styles.prompt, { backgroundColor: tone.container, borderColor: tone.border }]}
    >
      <OrtusIcons.Sparkle size={OrtusSizes.iconSmall} color={tone.content} />
      <OrtusText variant="callout" color={c.textPrimary} style={styles.flex}>
        {text}
      </OrtusText>
    </OrtusPressable>
  );
}

export type ChatComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onSend: () => void;
  canSend: boolean;
  /** Accessible label of the send button. */
  sendAccessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Composer: a pill field and a round send button that lights up once [canSend]. */
export function ChatComposer({
  value,
  onChangeText,
  placeholder,
  onSend,
  canSend,
  sendAccessibilityLabel,
  style,
  testID,
}: ChatComposerProps) {
  return (
    <View style={[styles.composer, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        accessibilityLabel={placeholder}
        cursorColor={c.mysticLight}
        selectionColor={c.mysticLight}
        returnKeyType="send"
        submitBehavior="submit"
        onSubmitEditing={() => {
          if (canSend) onSend();
        }}
        testID={testID}
        style={[OrtusTypography.body, styles.composerInput]}
      />
      <SendButton onSend={onSend} enabled={canSend} accessibilityLabel={sendAccessibilityLabel} />
    </View>
  );
}

export type SendButtonProps = { onSend: () => void; enabled: boolean; accessibilityLabel: string };

/** Round send button: mystic-to-gold when enabled, raised surface otherwise. */
export function SendButton({ onSend, enabled, accessibilityLabel }: SendButtonProps) {
  return (
    <OrtusPressable
      onPress={onSend}
      disabled={!enabled}
      pressScale
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !enabled }}
      outerStyle={styles.sendOuter}
      style={[styles.send, enabled ? styles.sendOn : styles.sendOff]}
    >
      <OrtusIcons.Send size={OrtusSizes.iconSmall} color={enabled ? c.onAccent : c.textMuted} />
    </OrtusPressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  questionRow: { alignSelf: 'stretch', paddingStart: BUBBLE_INSET, alignItems: 'flex-end' },
  bubble: {
    borderWidth: OrtusStroke.hairline,
    overflow: 'hidden',
    paddingHorizontal: OrtusSpacing.md,
    paddingVertical: OrtusSpacing.sm,
  },
  answerRow: { alignSelf: 'stretch', flexDirection: 'row', gap: OrtusSpacing.sm },
  answerBubble: { flex: 1, gap: OrtusSpacing.xs },
  avatar: {
    width: OrtusSizes.chatAvatar,
    height: OrtusSizes.chatAvatar,
    borderRadius: OrtusRadii.pill,
    overflow: 'hidden',
    backgroundImage: OrtusGradients.aiAvatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: OrtusSpacing.xxs },
  dot: { width: OrtusSizes.dot, height: OrtusSizes.dot, borderRadius: OrtusRadii.pill, backgroundColor: c.mysticLight },
  quota: {
    alignSelf: 'flex-start',
    height: OrtusSizes.quotaPillHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: OrtusSpacing.tight,
    paddingHorizontal: OrtusSpacing.sm,
    borderRadius: OrtusRadii.pill,
    borderWidth: OrtusStroke.hairline,
  },
  quotaDot: { width: OrtusSizes.dot, height: OrtusSizes.dot, borderRadius: OrtusRadii.pill, backgroundColor: c.mystic },
  promptOuter: { alignSelf: 'stretch', borderRadius: OrtusRadii.prompt },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OrtusSpacing.sm,
    borderRadius: OrtusRadii.prompt,
    borderWidth: OrtusStroke.hairline,
    paddingHorizontal: OrtusSpacing.md,
    paddingVertical: OrtusSpacing.sm,
  },
  composer: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.xs },
  composerInput: {
    flex: 1,
    height: OrtusSizes.chatInputHeight,
    color: c.textPrimary,
    borderRadius: OrtusRadii.pill,
    backgroundColor: c.surfaceRaised,
    borderWidth: OrtusStroke.hairline,
    borderColor: c.mysticCard.border,
    paddingHorizontal: OrtusSpacing.lg,
    paddingVertical: 0,
  },
  sendOuter: { width: OrtusSizes.chatSend, height: OrtusSizes.chatSend, borderRadius: OrtusRadii.pill },
  send: { borderRadius: OrtusRadii.pill, alignItems: 'center', justifyContent: 'center' },
  sendOn: { backgroundImage: OrtusGradients.aiSend },
  sendOff: { backgroundColor: c.surfaceRaised },
});
