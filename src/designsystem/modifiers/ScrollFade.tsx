import MaskedViewNative from '@react-native-masked-view/masked-view';
import { useState, type ComponentType, type ReactElement, type Ref } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ScrollViewInstance, type ScrollViewProps, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { OrtusSizes } from '../theme/dimens';

// The package ships pre-React-19 class typings (NativeMethods mixin); its runtime is a plain component.
const MaskedView = MaskedViewNative as unknown as ComponentType<ViewProps & { maskElement: ReactElement }>;

export type FadingScrollViewProps = Omit<ScrollViewProps, 'onScroll'> & {
  /** The inner ScrollView, for `scrollTo` / `scrollToEnd`. */
  readonly ref?: Ref<ScrollViewInstance>;
};

const OPAQUE = 'black';
const CLEAR = 'rgba(0, 0, 0, 0)';

function clamp01(value: number): number {
  'worklet';
  return Math.min(1, Math.max(0, value));
}

/** Writes only on change, so a long scroll past the fade zone costs no mask redraws. */
function setIfChanged(target: SharedValue<number>, value: number) {
  'worklet';
  if (target.get() !== value) target.set(value);
}

/**
 * A ScrollView whose content dissolves into the sky at its edges (Kotlin `Modifier.scrollFade`):
 * the leading edge fades once scrolled, the trailing one while more lies beyond, each growing
 * with the distance scrolled (up to `OrtusSizes.scrollFade`). Strengths are computed on the UI
 * thread. `style` sizes the masked frame; everything else goes to the ScrollView.
 */
export function FadingScrollView({
  ref,
  horizontal = false,
  style,
  onLayout,
  onContentSizeChange,
  ...rest
}: FadingScrollViewProps) {
  const [viewport, setViewport] = useState(0);
  const offset = useSharedValue(0);
  const content = useSharedValue(0);
  const length = useSharedValue(0);
  const leading = useSharedValue(0);
  const trailing = useSharedValue(0);
  const edge = Math.min(OrtusSizes.scrollFade, viewport / 2);

  const update = (scrolled: number, contentLength: number, viewportLength: number) => {
    'worklet';
    const fade = Math.min(OrtusSizes.scrollFade, viewportLength / 2);
    if (fade <= 0) return;
    const max = Math.max(0, contentLength - viewportLength);
    setIfChanged(leading, clamp01(scrolled / fade));
    setIfChanged(trailing, clamp01((max - scrolled) / fade));
  };

  const onScroll = useAnimatedScrollHandler((e) => {
    const scrolled = horizontal ? e.contentOffset.x : e.contentOffset.y;
    const contentLength = horizontal ? e.contentSize.width : e.contentSize.height;
    const viewportLength = horizontal ? e.layoutMeasurement.width : e.layoutMeasurement.height;
    offset.set(scrolled);
    content.set(contentLength);
    length.set(viewportLength);
    update(scrolled, contentLength, viewportLength);
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const viewportLength = horizontal ? width : height;
    setViewport(viewportLength);
    length.set(viewportLength);
    update(offset.get(), content.get(), viewportLength);
    onLayout?.(e);
  };

  const handleContentSize = (w: number, h: number) => {
    const contentLength = horizontal ? w : h;
    content.set(contentLength);
    update(offset.get(), contentLength, length.get());
    onContentSizeChange?.(w, h);
  };

  const leadBand = useAnimatedStyle(() =>
    horizontal
      ? { transform: [{ translateX: (leading.get() - 1) * edge }] }
      : { transform: [{ translateY: (leading.get() - 1) * edge }] },
  );
  const leadSolid = useAnimatedStyle(() =>
    horizontal ? { transform: [{ translateX: leading.get() * edge }] } : { transform: [{ translateY: leading.get() * edge }] },
  );
  const trailSolid = useAnimatedStyle(() =>
    horizontal
      ? { transform: [{ translateX: -trailing.get() * edge }] }
      : { transform: [{ translateY: -trailing.get() * edge }] },
  );
  const trailBand = useAnimatedStyle(() =>
    horizontal
      ? { transform: [{ translateX: (1 - trailing.get()) * edge }] }
      : { transform: [{ translateY: (1 - trailing.get()) * edge }] },
  );

  const bandSize = horizontal ? { width: edge } : { height: edge };
  const mask = (
    // Physical left/right in both directions: the scroll offset is measured from the left.
    <View style={[StyleSheet.absoluteFill, styles.ltr]}>
      <Animated.View
        style={[
          horizontal ? styles.leadH : styles.leadV,
          bandSize,
          { backgroundImage: `linear-gradient(${horizontal ? 'to right' : 'to bottom'}, ${CLEAR}, ${OPAQUE})` },
          leadBand,
        ]}
      />
      <Animated.View style={[horizontal ? styles.firstHalfH : styles.firstHalfV, leadSolid]} />
      <Animated.View style={[horizontal ? styles.secondHalfH : styles.secondHalfV, trailSolid]} />
      <Animated.View
        style={[
          horizontal ? styles.trailH : styles.trailV,
          bandSize,
          { backgroundImage: `linear-gradient(${horizontal ? 'to left' : 'to top'}, ${CLEAR}, ${OPAQUE})` },
          trailBand,
        ]}
      />
    </View>
  );

  return (
    <MaskedView style={style} maskElement={mask}>
      <Animated.ScrollView
        {...rest}
        ref={ref}
        horizontal={horizontal}
        style={styles.fill}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSize}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  ltr: { direction: 'ltr' },
  leadV: { position: 'absolute', top: 0, left: 0, right: 0 },
  trailV: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  firstHalfV: { position: 'absolute', top: 0, bottom: '50%', left: 0, right: 0, backgroundColor: OPAQUE },
  secondHalfV: { position: 'absolute', top: '50%', bottom: 0, left: 0, right: 0, backgroundColor: OPAQUE },
  leadH: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  trailH: { position: 'absolute', right: 0, top: 0, bottom: 0 },
  firstHalfH: { position: 'absolute', left: 0, right: '50%', top: 0, bottom: 0, backgroundColor: OPAQUE },
  secondHalfH: { position: 'absolute', left: '50%', right: 0, top: 0, bottom: 0, backgroundColor: OPAQUE },
});
