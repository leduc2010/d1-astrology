import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { OrtusText, type OrtusTypeVariant } from '../../designsystem';

export type WidestText = {
  /** Width in dp of the widest text on one line; 0 until measured. */
  readonly width: number;
  /** Invisible measuring layer; render it anywhere inside the screen. */
  readonly measurer: ReactElement;
};

/**
 * Width of the widest of [texts] set in [variant] on one line, to size a column of labels alike.
 * RN has no synchronous text measurer (Compose `rememberTextMeasurer`), so the texts are laid out
 * once off-screen and the width arrives on the next frame.
 */
export function useWidestText(texts: readonly string[], variant: OrtusTypeVariant): WidestText {
  const key = [variant, ...texts].join(KEY_SEPARATOR);
  const [measured, setMeasured] = useState<{ key: string; widths: readonly number[] }>({ key, widths: [] });
  const widths = measured.key === key ? measured.widths : [];

  const onWidth = useCallback(
    (index: number, width: number) =>
      setMeasured((prev) => {
        const base = prev.key === key ? prev.widths : [];
        if (base[index] === width) return prev;
        const next = [...base];
        next[index] = width;
        return { key, widths: next };
      }),
    [key],
  );

  const measurer = useMemo(
    () => (
      <View style={styles.layer} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {texts.map((text, index) => (
          <OrtusText
            key={`${index}:${text}`}
            variant={variant}
            numberOfLines={1}
            style={styles.text}
            onLayout={(e: LayoutChangeEvent) => onWidth(index, e.nativeEvent.layout.width)}
          >
            {text}
          </OrtusText>
        ))}
      </View>
    ),
    [texts, variant, onWidth],
  );

  const width = widths.reduce((max, w) => Math.max(max, w ?? 0), 0);
  return { width, measurer };
}

/** Wide enough that no label wraps while it is measured. */
const MEASURE_WIDTH = 10000;
const KEY_SEPARATOR = String.fromCharCode(0);

const styles = StyleSheet.create({
  // Off-screen and unbounded so no text wraps or shrinks while being measured.
  layer: { position: 'absolute', opacity: 0, start: 0, top: 0, width: MEASURE_WIDTH, alignItems: 'flex-start' },
  text: { alignSelf: 'flex-start' },
});
