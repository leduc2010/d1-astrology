import Svg, { Circle, Line } from 'react-native-svg';

import { OrtusColors as c, OrtusSizes, OrtusSpacing, OrtusStroke, withAlpha } from '@/designsystem';

/* Figma S04-01 natal tile, on a 60-unit square: rings, a zodiac band, two aspects, the sun and a planet. */
const UNITS = 60;
const RING_ALPHA = 0.5;
const INNER_RING_ALPHA = 0.35;
const BAND_ALPHA = 0.12;
const ASPECT_ALPHA = 0.8;

/** Drawn inside the hub's art box, inset like the Kotlin canvas padding. */
const ART_SIZE = OrtusSizes.chartArt - 2 * OrtusSpacing.xs;

/** Small emblem of a natal wheel for the Charts hub card, in the same weight as the Han tiles beside it. */
export function NatalArt() {
  const u = ART_SIZE / UNITS;
  // Strokes are given in dp, so convert them into the 60-unit view box.
  const hair = OrtusStroke.hairline / u;
  const icon = OrtusStroke.icon / u;
  const mid = UNITS / 2;
  return (
    <Svg
      width={ART_SIZE}
      height={ART_SIZE}
      viewBox={`0 0 ${UNITS} ${UNITS}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle cx={mid} cy={mid} r={24} stroke={withAlpha(c.accent, BAND_ALPHA)} strokeWidth={12} fill="none" />
      <Circle cx={mid} cy={mid} r={30 - hair / 2} stroke={withAlpha(c.accent, RING_ALPHA)} strokeWidth={hair} fill="none" />
      <Circle cx={mid} cy={mid} r={18} stroke={withAlpha(c.accent, RING_ALPHA)} strokeWidth={hair} fill="none" />
      <Circle cx={mid} cy={mid} r={12} stroke={withAlpha(c.accent, INNER_RING_ALPHA)} strokeWidth={hair} fill="none" />
      <Line x1={18} y1={16} x2={42} y2={38} stroke={withAlpha(c.chart.aspectSoft, ASPECT_ALPHA)} strokeWidth={hair} />
      <Line x1={18} y1={16} x2={26} y2={38} stroke={withAlpha(c.chart.aspectHard, ASPECT_ALPHA)} strokeWidth={hair} />
      <Line x1={0} y1={30} x2={8} y2={30} stroke={c.accentLight} strokeWidth={icon} />
      <Circle cx={27.5} cy={7.5} r={2.5} fill={c.accentLight} />
      <Circle cx={50} cy={42} r={2} fill={c.textPrimary} />
    </Svg>
  );
}
