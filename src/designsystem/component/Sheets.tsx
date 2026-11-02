import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useT } from "@/i18n";

import { UiCue, useUiFeedback } from "../feedback/UiFeedback";
import { OrtusPressable } from "../modifiers/OrtusPressable";
import { useReducedMotion } from "../theme/DesignSystemProvider";
import { OrtusColors as c } from "../theme/colors";
import { OrtusSizes, OrtusSpacing, OrtusStroke } from "../theme/dimens";
import { OrtusMotion } from "../theme/motion";
import { OrtusRadii, OrtusShapes } from "../theme/shapes";
import { OrtusText } from "./OrtusText";

/** Off-screen start for the slide; the real height replaces it after the first layout. */
const OFFSCREEN = 2000;
/** Drag past this share of the sheet's height (or flick faster than [FLING_VELOCITY]) to close. */
const DISMISS_FRACTION = 0.3;
const FLING_VELOCITY = 1000;

export type OrtusBottomSheetProps = {
  /** Called after the sheet has slid away (scrim tap, back, drag or `close()`). */
  onDismiss: () => void;
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  /** Content, or a function receiving `close` that animates out before [onDismiss]. */
  children?: ReactNode | ((close: () => void) => ReactNode);
};

/**
 * C16 bottom sheet: serif title, optional subtitle, the app's handle and scrim. Render it to show
 * it, unmount it after [onDismiss]. Slides up with the emphasized settle and plays the Open cue.
 */
export function OrtusBottomSheet({
  onDismiss,
  title,
  subtitle,
  style,
  children,
}: OrtusBottomSheetProps) {
  const reduced = useReducedMotion();
  const feedback = useUiFeedback();
  const insets = useSafeAreaInsets();
  const { tf } = useT();
  const [height, setHeight] = useState(OFFSCREEN);
  const offset = useSharedValue(OFFSCREEN);
  const scrim = useSharedValue(0);
  // A shared value rather than a ref, so `close` can be handed to children during render.
  const closing = useSharedValue(false);

  useEffect(() => {
    feedback.perform(UiCue.Open);
    // One cue when the sheet first opens, like Kotlin's LaunchedEffect(Unit).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closing.get()) return;
    closing.set(true);
    const spec = reduced
      ? { duration: 0 }
      : { duration: OrtusMotion.STANDARD, easing: OrtusMotion.exit };
    scrim.set(withTiming(0, spec));
    offset.set(
      withTiming(height, spec, (finished) => {
        if (finished) scheduleOnRN(onDismiss);
      }),
    );
  }, [closing, height, offset, onDismiss, reduced, scrim]);

  const onLayout = (h: number) => {
    if (h === height) return;
    setHeight(h);
    if (closing.get()) return;
    offset.set(h);
    offset.set(withTiming(0, OrtusMotion.emphasized(reduced)));
    scrim.set(withTiming(1, OrtusMotion.standard(reduced)));
  };

  const settleBack = OrtusMotion.standard(reduced);
  const drag = usePanGesture({
    onUpdate: (e) => {
      "worklet";
      offset.set(Math.max(0, offset.get() + e.changeY));
    },
    onDeactivate: (e) => {
      "worklet";
      if (
        offset.get() > height * DISMISS_FRACTION ||
        e.velocityY > FLING_VELOCITY
      ) {
        scheduleOnRN(close);
      } else {
        offset.set(withTiming(0, settleBack));
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.get() }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.get() }));
  const label = tf("sheet_close");

  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={close}
    >
      {/* The top inset pads the root, so a tall sheet stops below the status bar (Kotlin
          `contentWindowInsets = safeDrawing.only(Top)`); a margin on the sheet would overflow. */}
      <GestureHandlerRootView style={[styles.root, { paddingTop: insets.top }]}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessible={false}
            importantForAccessibility="no"
          />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, styles.sheetMax, sheetStyle, style]}
          onLayout={(e) => onLayout(e.nativeEvent.layout.height)}
          accessibilityViewIsModal
        >
          <GestureDetector gesture={drag}>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityActions={[{ name: "escape", label }]}
              onAccessibilityAction={close}
              style={styles.handleTouch}
            >
              <View style={styles.handle} />
            </Pressable>
          </GestureDetector>
          <View
            style={[
              styles.body,
              { paddingBottom: insets.bottom + OrtusSpacing.lg },
            ]}
          >
            <View style={styles.header}>
              <OrtusText
                variant="h2"
                color={c.textPrimary}
                accessibilityRole="header"
              >
                {title}
              </OrtusText>
              {subtitle ? (
                <OrtusText variant="caption" color={c.textSecondary}>
                  {subtitle}
                </OrtusText>
              ) : null}
            </View>
            {typeof children === "function" ? children(close) : children}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

export type OrtusRadioOptionProps = {
  text: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** C16 radio option row (h54) used inside sheets. */
export function OrtusRadioOption({
  text,
  selected,
  onPress,
  style,
  testID,
}: OrtusRadioOptionProps) {
  return (
    <OrtusPressable
      onPress={onPress}
      cue={UiCue.Select}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      testID={testID}
      outerStyle={[styles.optionOuter, style]}
      style={[
        styles.option,
        { borderColor: selected ? c.outlineStrong : c.outline },
      ]}
    >
      <OrtusText variant="body" color={c.textPrimary} style={styles.flex}>
        {text}
      </OrtusText>
      <RadioDot selected={selected} />
    </OrtusPressable>
  );
}

/** The 20dp radio mark: gold disc with a dark centre when selected, muted ring otherwise. */
export function RadioDot({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.radio, selected ? styles.radioOn : styles.radioOff]}>
      {selected ? <View style={styles.radioDot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  flex: { flex: 1 },
  scrim: { backgroundColor: c.scrim },
  sheetMax: { maxHeight: "100%" },
  sheet: {
    ...OrtusShapes.sheet,
    backgroundColor: c.surfaceSolid,
    borderWidth: OrtusStroke.hairline,
    borderBottomWidth: 0,
    borderColor: c.sheetBorder,
    alignItems: "center",
    overflow: "hidden",
  },
  handleTouch: {
    paddingVertical: OrtusSpacing.sm,
    paddingHorizontal: OrtusSpacing.md,
  },
  handle: {
    width: OrtusSizes.sheetHandleWidth,
    height: OrtusSizes.sheetHandleHeight,
    borderRadius: OrtusRadii.pill,
    backgroundColor: c.sheetHandle,
  },
  // Shrinks so a ScrollView child scrolls inside a full-height sheet instead of overflowing it.
  body: {
    alignSelf: "stretch",
    flexShrink: 1,
    paddingHorizontal: OrtusSpacing.screen,
    gap: OrtusSpacing.md,
  },
  header: { gap: OrtusSpacing.xxs },
  optionOuter: {
    alignSelf: "stretch",
    height: OrtusSizes.radioOptionHeight,
    borderRadius: OrtusRadii.input,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: OrtusRadii.input,
    backgroundColor: c.surfaceRaised,
    borderWidth: OrtusStroke.hairline,
    paddingHorizontal: OrtusSpacing.md,
  },
  radio: {
    width: OrtusSizes.radio,
    height: OrtusSizes.radio,
    borderRadius: OrtusRadii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { backgroundColor: c.accent },
  radioOff: { borderWidth: OrtusStroke.control, borderColor: c.textMuted },
  radioDot: {
    width: OrtusSizes.radioDot,
    height: OrtusSizes.radioDot,
    borderRadius: OrtusRadii.pill,
    backgroundColor: c.onAccent,
  },
});
