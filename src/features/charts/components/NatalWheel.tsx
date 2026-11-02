import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import { aspectColor, planetGlyph, zodiacElementColor, zodiacGlyph } from '@/core/ui';
import {
  OrtusColors as c,
  OrtusMotion,
  OrtusSizes,
  OrtusStroke,
  OrtusTypography,
  useReducedMotion,
  type OrtusTypeVariant,
} from '@/designsystem';
import type { NatalChart, ZodiacElement } from '@/engine';

import { HALF_SIGN, placePlanets, SIGN_ARC, SIGNS, WheelRings as R, wheelPoint } from '../model/natalWheelLayout';

const ASPECT_ALPHA = 0.7;
/** The wheel turns this far into place as it is drawn. */
const INTRO_TURN = -24;
const SIGN_INDICES = Array.from({ length: SIGNS }, (_, i) => i);
const ELEMENT_COUNT = 4;

export type NatalWheelProps = { chart: NatalChart; description: string; ascendantLabel: string };

/**
 * Western natal wheel: zodiac band tinted by element, whole-sign houses from the ascendant on the
 * left, planets, and aspect lines through the middle. It turns gently into place when first shown.
 */
export function NatalWheel({ chart, description, ascendantLabel }: NatalWheelProps) {
  const reduced = useReducedMotion();
  const [size, setSize] = useState(0);
  const progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(1, OrtusMotion.ceremonial(reduced)));
    // Replays only for a new chart, like Kotlin LaunchedEffect(chart).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);
  const turn = useAnimatedStyle(() => ({ transform: [{ rotate: `${-INTRO_TURN * (1 - progress.get())}deg` }] }));
  const fade = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const onLayout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout.width);

  return (
    <View style={styles.frame} onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={description}>
      {size > 0 ? (
        <>
          <Animated.View style={[StyleSheet.absoluteFill, turn]}>
            <Rings chart={chart} size={size} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, turn, fade]}>
            <Marks chart={chart} size={size} ascendantLabel={ascendantLabel} />
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

/** The wheel's frame at rest: centre, outer radius, and the longitude that sits at nine o'clock. */
function frameOf(chart: NatalChart, size: number) {
  const mid = size / 2;
  const radius = mid * R.WHEEL_FILL;
  const anchor = chart.ascendant?.longitude ?? 0;
  return { at: (longitude: number, fraction: number) => wheelPoint(mid, mid, radius, anchor, longitude, fraction), mid, radius };
}

/** Rings and sign spokes, drawn at full strength from the first frame. */
function Rings({ chart, size }: { chart: NatalChart; size: number }) {
  const { at, mid, radius } = frameOf(chart, size);
  const hasHouses = chart.ascendant !== null;
  const rings = [1, R.SIGN_INNER, ...(hasHouses ? [R.HOUSE_INNER] : []), R.ASPECT_RING];
  const spokeInner = hasHouses ? R.HOUSE_INNER : R.SIGN_INNER;
  const line = { stroke: c.chart.gridLine, strokeWidth: OrtusStroke.hairline };
  return (
    <Svg width={size} height={size}>
      {rings.map((f) => (
        <Circle key={f} cx={mid} cy={mid} r={radius * f} fill="none" {...line} />
      ))}
      {SIGN_INDICES.map((sign) => {
        const from = at(sign * SIGN_ARC, spokeInner);
        const to = at(sign * SIGN_ARC, 1);
        return <Line key={sign} x1={from.x} y1={from.y} x2={to.x} y2={to.y} {...line} />;
      })}
    </Svg>
  );
}

/** Sign glyphs, house numbers, the ascendant, aspects and planets; these fade in as the wheel turns. */
function Marks({ chart, size, ascendantLabel }: { chart: NatalChart; size: number; ascendantLabel: string }) {
  const { at } = frameOf(chart, size);
  const placed = useMemo(() => placePlanets(chart), [chart]);
  const asc = chart.ascendant;
  return (
    <Svg width={size} height={size}>
      {SIGN_INDICES.map((sign) => (
        <Glyph
          key={`s${sign}`}
          text={zodiacGlyph(sign)}
          at={at(sign * SIGN_ARC + HALF_SIGN, (1 + R.SIGN_INNER) / 2)}
          variant="caption"
          color={zodiacElementColor((sign % ELEMENT_COUNT) as ZodiacElement)}
        />
      ))}
      {asc !== null ? (
        <G>
          {SIGN_INDICES.map((house) => (
            <Glyph
              key={`h${house}`}
              text={String(house + 1)}
              at={at((asc.sign + house) * SIGN_ARC + HALF_SIGN, (R.SIGN_INNER + R.HOUSE_INNER) / 2)}
              variant="nano"
              color={c.textMuted}
            />
          ))}
          <Segment from={at(asc.longitude, R.ASPECT_RING)} to={at(asc.longitude, 1)} color={c.accent} width={OrtusStroke.control} />
          <Glyph text={ascendantLabel} at={at(asc.longitude, R.LABEL_RING)} variant="nano" color={c.accent} />
        </G>
      ) : null}
      {chart.aspects.map((aspect) => {
        const from = chart.planets.get(aspect.first);
        const to = chart.planets.get(aspect.second);
        if (!from || !to) return null;
        return (
          <Segment
            key={`${aspect.first}-${aspect.second}`}
            from={at(from.longitude, R.ASPECT_RING)}
            to={at(to.longitude, R.ASPECT_RING)}
            color={aspectColor(aspect.kind)}
            width={OrtusStroke.hairline}
            opacity={ASPECT_ALPHA}
          />
        );
      })}
      {placed.map((p) => (
        <Glyph
          key={`p${p.planet}`}
          text={planetGlyph(p.planet)}
          at={at(p.longitude, p.inner ? R.PLANET_TRACK_INNER : R.PLANET_TRACK)}
          variant="title"
          color={c.textPrimary}
        />
      ))}
    </Svg>
  );
}

type Pt = { x: number; y: number };

function Segment({ from, to, color, width, opacity }: { from: Pt; to: Pt; color: string; width: number; opacity?: number }) {
  return <Line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={width} strokeOpacity={opacity} />;
}

/** Text centred on [at], set in a type-scale [variant]. */
function Glyph({ text, at, variant, color }: { text: string; at: Pt; variant: OrtusTypeVariant; color: string }) {
  const type = OrtusTypography[variant];
  return (
    <SvgText
      x={at.x}
      y={at.y}
      fill={color}
      fontFamily={type.fontFamily}
      fontSize={type.fontSize}
      textAnchor="middle"
      alignmentBaseline="central"
    >
      {text}
    </SvgText>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', maxWidth: OrtusSizes.natalWheel, aspectRatio: 1, alignSelf: 'center' },
});
