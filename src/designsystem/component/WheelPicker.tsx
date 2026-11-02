import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { UiCue, useUiFeedback } from '../feedback/UiFeedback';
import { useReducedMotion } from '../theme/DesignSystemProvider';
import { OrtusColors as c } from '../theme/colors';
import { OrtusSizes, OrtusStroke } from '../theme/dimens';
import { OrtusRadii } from '../theme/shapes';
import { OrtusText } from './OrtusText';

/** Rows shown by a wheel: the picked one plus two on each side. */
const VISIBLE_ROWS = 5;
const SIDE_ROWS = Math.floor(VISIBLE_ROWS / 2);
const ROW = OrtusSizes.wheelRow;
/** A drag that ends without a fling settles here; a fling cancels it and commits on momentum end. */
const SETTLE_GRACE_MS = 80;

/**
 * Frame for one or more [OrtusWheelPicker]s side by side: draws the shared highlight band behind
 * the middle row, so every wheel lines its pick up inside it.
 */
export function OrtusWheelRow({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <View style={[styles.frame, style]}>
      <View style={styles.band} />
      <View style={styles.wheels}>{children}</View>
    </View>
  );
}

export type OrtusWheelPickerProps = {
  items: readonly string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Accessible name of the whole wheel ("Day"). */
  label: string;
  /** The bigger selected style of the time picker. */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));

/**
 * Snapping vertical wheel (C08). The value is committed once the wheel comes to rest, with a single
 * Select cue, so a long fling is one user action and one sound. Screen readers see one adjustable
 * control named [label] instead of a list of rows.
 */
export function OrtusWheelPicker({ items, selectedIndex, onSelect, label, large = false, style, testID }: OrtusWheelPickerProps) {
  if (items.length === 0) throw new Error('A wheel needs at least one item');
  const lastIndex = items.length - 1;
  const safeIndex = clamp(selectedIndex, lastIndex);
  const reduced = useReducedMotion();
  const feedback = useUiFeedback();
  const scroll = useRef<ScrollViewInstance>(null);
  const [centered, setCentered] = useState(safeIndex);
  const scrolling = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ safeIndex, onSelect, lastIndex, feedback });
  useEffect(() => {
    latest.current = { safeIndex, onSelect, lastIndex, feedback };
  });

  const indexAt = (y: number) => clamp(Math.round(y / ROW), latest.current.lastIndex);

  const commit = (y: number) => {
    scrolling.current = false;
    const picked = indexAt(y);
    const now = latest.current;
    if (picked !== now.safeIndex) {
      now.feedback.perform(UiCue.Select);
      now.onSelect(picked);
    }
  };

  const clearSettle = () => {
    if (settleTimer.current != null) clearTimeout(settleTimer.current);
    settleTimer.current = null;
  };

  useEffect(() => clearSettle, []);

  // Follow outside changes (a day clamped when the month gets shorter, a restored draft).
  useEffect(() => {
    if (scrolling.current) return;
    scroll.current?.scrollTo({ y: safeIndex * ROW, animated: !reduced });
    setCentered(safeIndex);
  }, [safeIndex, items.length, reduced]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = indexAt(e.nativeEvent.contentOffset.y);
    setCentered((prev) => (prev === next ? prev : next));
  };

  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    const step = e.nativeEvent.actionName === 'increment' ? 1 : e.nativeEvent.actionName === 'decrement' ? -1 : 0;
    const index = clamp(safeIndex + step, lastIndex);
    if (step === 0 || index === safeIndex) return;
    scroll.current?.scrollTo({ y: index * ROW, animated: false });
    onSelect(index);
  };

  return (
    <View
      style={[styles.wheel, style]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: lastIndex, now: safeIndex, text: items[safeIndex] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
      testID={testID}
    >
      <ScrollView
        ref={scroll}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: safeIndex * ROW }}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          clearSettle();
          scrolling.current = true;
        }}
        onScrollEndDrag={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          clearSettle();
          settleTimer.current = setTimeout(() => commit(y), SETTLE_GRACE_MS);
        }}
        onMomentumScrollBegin={clearSettle}
        onMomentumScrollEnd={(e) => {
          clearSettle();
          commit(e.nativeEvent.contentOffset.y);
        }}
      >
        {items.map((text, index) => (
          <WheelItem key={index} text={text} distance={Math.abs(index - centered)} large={large} />
        ))}
      </ScrollView>
    </View>
  );
}

function WheelItem({ text, distance, large }: { text: string; distance: number; large: boolean }) {
  const [variant, color] =
    distance === 0
      ? ([large ? 'wheelSelectedLarge' : 'wheelSelected', c.accentLight] as const)
      : distance === 1
        ? (['wheelNear', c.textSecondary] as const)
        : (['wheelFar', c.textMuted] as const);
  return (
    <View style={styles.row}>
      <OrtusText variant={variant} color={color} numberOfLines={1} style={styles.center}>
        {text}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: 'stretch', height: ROW * VISIBLE_ROWS, justifyContent: 'center' },
  band: {
    position: 'absolute',
    start: 0,
    end: 0,
    height: ROW,
    borderRadius: OrtusRadii.input,
    backgroundColor: c.surfaceRaised,
    borderWidth: OrtusStroke.hairline,
    borderColor: c.selectionBorder,
  },
  wheels: { ...StyleSheet.absoluteFill, flexDirection: 'row', alignItems: 'center' },
  wheel: { flex: 1, height: ROW * VISIBLE_ROWS },
  content: { paddingVertical: ROW * SIDE_ROWS },
  row: { height: ROW, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
