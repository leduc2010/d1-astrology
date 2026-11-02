import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { OrtusStroke } from '../theme/dimens';

export type DashedBorderProps = {
  color: string;
  /** Corner radius of the shape being outlined (a value from `OrtusRadii`). */
  radius?: number;
};

/**
 * A dashed hairline following the parent's shape (Kotlin `Modifier.dashedBorder`): dash 4,
 * gap 3. Render it as the last child of a view; it fills the parent and ignores touches.
 * RN's own `borderStyle: 'dashed'` cannot set dash lengths, hence the SVG.
 */
export function DashedBorder({ color, radius = 0 }: DashedBorderProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };
  const inset = OrtusStroke.hairline / 2;
  const r = Math.max(0, Math.min(radius, size.width / 2, size.height / 2) - inset);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout} importantForAccessibility="no-hide-descendants">
      {size.width > 0 && size.height > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Rect
            x={inset}
            y={inset}
            width={size.width - OrtusStroke.hairline}
            height={size.height - OrtusStroke.hairline}
            rx={r}
            ry={r}
            fill="none"
            stroke={color}
            strokeWidth={OrtusStroke.hairline}
            strokeDasharray={[OrtusStroke.dash, OrtusStroke.dashGap]}
          />
        </Svg>
      ) : null}
    </View>
  );
}
