import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  aspectColor,
  aspectName,
  planetGlyph,
  planetName,
  zodiacElementColor,
  zodiacElementName,
  zodiacGlyph,
  zodiacSignName,
} from '@/core/ui';
import {
  OrtusColors as c,
  OrtusCard,
  OrtusFontFamily,
  OrtusPressable,
  OrtusRadii,
  OrtusSectionCard,
  OrtusSizes,
  OrtusSpacing,
  OrtusText,
  OrtusTypography,
} from '@/designsystem';
import {
  houseOfPosition,
  Planet,
  PLANETS,
  ZODIAC_ELEMENTS,
  zodiacElementBalance,
  type Aspect,
  type NatalChart,
  type ZodiacPosition,
} from '@/engine';
import { useT } from '@/i18n';

import { moonSignText } from '../chartsText';
import { isMoonCertain, type NatalView } from '../model/chartViews';
import { CountBar } from './CountBar';

/** Sun, Moon and rising sign side by side; rising shows a dash without a birth time. Tap one to read it. */
export function BigThree({ natal, onPlanet, onRising }: { natal: NatalView; onPlanet: (p: Planet) => void; onRising: () => void }) {
  const t = useT();
  const chart = natal.chart;
  // A Moon that may be in either of two signs shows both names and no degree.
  const certain = isMoonCertain(natal);
  const moon = certain ? (chart.planets.get(Planet.MOON) ?? null) : null;
  const moonText = certain ? null : moonSignText(t, natal);
  return (
    <View style={styles.bigThree}>
      <BigThreeTile
        mark={<Mark text={planetGlyph(Planet.SUN)} color={c.accentLight} />}
        label={planetName(t, Planet.SUN)}
        chart={chart}
        position={chart.planets.get(Planet.SUN) ?? null}
        onPress={() => onPlanet(Planet.SUN)}
      />
      <BigThreeTile
        mark={<Mark text={planetGlyph(Planet.MOON)} color={c.textPrimary} />}
        label={planetName(t, Planet.MOON)}
        chart={chart}
        position={moon}
        value={moonText}
        onPress={() => onPlanet(Planet.MOON)}
      />
      <BigThreeTile
        mark={
          <OrtusText variant="label" color={c.accentLight} style={styles.ascendantMark}>
            {t.tf('charts_ascendant_short')}
          </OrtusText>
        }
        label={t.tf('charts_rising')}
        chart={chart}
        position={chart.ascendant}
        onPress={chart.ascendant !== null ? onRising : undefined}
      />
    </View>
  );
}

const Mark = ({ text, color }: { text: string; color: string }) => (
  <OrtusText variant="astroGlyph" color={color}>
    {text}
  </OrtusText>
);

type BigThreeTileProps = {
  mark: ReactNode;
  label: string;
  chart: NatalChart;
  position: ZodiacPosition | null;
  /** Shown when there is no single [position]; null reads as unknown. */
  value?: string | null;
  onPress?: () => void;
};

function BigThreeTile({ mark, label, chart, position, value = null, onPress }: BigThreeTileProps) {
  const t = useT();
  const house = position === null ? null : houseOfPosition(chart, position);
  const text = position !== null ? t.tf('charts_sign_degree', zodiacSignName(t, position.longitude), position.degree) : value;
  return (
    <OrtusCard onPress={onPress} contentPadding={OrtusSpacing.sm} style={styles.tile}>
      <View style={styles.tileColumn}>
        {/* Every mark sits in a slot one glyph line tall, so the small "AC" keeps the three tiles level. */}
        <View style={styles.markSlot}>{mark}</View>
        <OrtusText variant="footnote" color={c.textSecondary} style={styles.centred}>
          {label}
        </OrtusText>
        <OrtusText variant="title" color={text !== null ? c.textPrimary : c.textMuted} style={styles.centred}>
          {text ?? t.tf('charts_unknown')}
        </OrtusText>
        {house !== null ? (
          <OrtusText variant="footnote" color={c.textBody}>
            {t.tf('charts_house', house)}
          </OrtusText>
        ) : null}
      </View>
    </OrtusCard>
  );
}

export function PlanetsCard({ natal, onPlanet }: { natal: NatalView; onPlanet: (p: Planet) => void }) {
  const t = useT();
  const chart = natal.chart;
  const uncertainMoon = isMoonCertain(natal) ? null : moonSignText(t, natal);
  return (
    <OrtusSectionCard title={t.tf('charts_planets_label')}>
      <View style={styles.rows}>
        {PLANETS.map((planet) => {
          const position = chart.planets.get(planet);
          if (!position) return null;
          return (
            <PlanetRow
              key={planet}
              planet={planet}
              position={position}
              house={houseOfPosition(chart, position)}
              signText={planet === Planet.MOON ? uncertainMoon : null}
              onPress={() => onPlanet(planet)}
            />
          );
        })}
      </View>
    </OrtusSectionCard>
  );
}

type PlanetRowProps = {
  planet: Planet;
  position: ZodiacPosition;
  house: number | null;
  signText: string | null;
  onPress: () => void;
};

function PlanetRow({ planet, position, house, signText, onPress }: PlanetRowProps) {
  const t = useT();
  const sign = signText ?? t.tf('charts_sign_degree', zodiacSignName(t, position.longitude), position.degree);
  const houseText = house === null ? null : t.tf('charts_house', house);
  const name = planetName(t, planet);
  const spoken = [name, sign, houseText].filter((s): s is string => s !== null).join(', ');
  return (
    <OrtusPressable onPress={onPress} cue={null} accessibilityLabel={spoken} style={styles.planetRow}>
      <OrtusText variant="title" color={c.accent} style={styles.planetGlyph}>
        {planetGlyph(planet)}
      </OrtusText>
      <OrtusText variant="body" color={c.textPrimary} style={styles.flex}>
        {name}
      </OrtusText>
      {signText === null ? (
        <OrtusText variant="caption" color={zodiacElementColor(position.element)}>
          {zodiacGlyph(position.sign)}
        </OrtusText>
      ) : null}
      <OrtusText variant="caption" color={c.textBody}>
        {sign}
      </OrtusText>
      {houseText !== null ? (
        <OrtusText variant="caption" color={c.textMuted}>
          {houseText}
        </OrtusText>
      ) : null}
    </OrtusPressable>
  );
}

export function AspectsCard({ aspects }: { aspects: readonly Aspect[] }) {
  const t = useT();
  const sorted = [...aspects].sort((a, b) => a.orb - b.orb);
  return (
    <OrtusSectionCard title={t.tf('charts_aspects_label')}>
      <View style={styles.rows}>
        {sorted.map((aspect) => (
          <View key={`${aspect.first}-${aspect.second}`} style={styles.aspectRow}>
            <View style={[styles.dot, { backgroundColor: aspectColor(aspect.kind) }]} />
            <OrtusText variant="caption" color={c.textBody} style={styles.flex}>
              {t.tf('charts_aspect_pair', planetName(t, aspect.first), aspectName(t, aspect.kind), planetName(t, aspect.second))}
            </OrtusText>
            <OrtusText variant="caption" color={c.textMuted}>
              {t.tf('charts_orb', Math.round(aspect.orb))}
            </OrtusText>
          </View>
        ))}
      </View>
    </OrtusSectionCard>
  );
}

/** How many of the seven planets sit in fire, earth, air and water signs, as bars (Figma S04-06). */
export function ElementsCard({ chart }: { chart: NatalChart }) {
  const t = useT();
  const balance = zodiacElementBalance(chart);
  const most = Math.max(0, ...balance.values());
  return (
    <OrtusSectionCard title={t.tf('charts_elements_label')}>
      <View style={styles.bars}>
        {ZODIAC_ELEMENTS.map((element, index) => (
          <CountBar
            key={element}
            name={zodiacElementName(t, element)}
            count={balance.get(element) ?? 0}
            most={most}
            index={index}
            color={zodiacElementColor(element)}
          />
        ))}
      </View>
      <OrtusText variant="footnote" color={c.textMuted}>
        {t.tf('charts_elements_note')}
      </OrtusText>
    </OrtusSectionCard>
  );
}

const styles = StyleSheet.create({
  bigThree: { flexDirection: 'row', gap: OrtusSpacing.xs },
  tile: { flex: 1 },
  tileColumn: { alignItems: 'center' },
  markSlot: { height: OrtusTypography.astroGlyph.lineHeight, alignItems: 'center', justifyContent: 'center' },
  ascendantMark: { fontFamily: OrtusFontFamily.beVietnamBold },
  centred: { textAlign: 'center' },
  rows: { gap: OrtusSpacing.xs },
  bars: { gap: OrtusSpacing.sm },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OrtusSpacing.sm,
    minHeight: OrtusSizes.minTouch,
    borderRadius: OrtusRadii.input,
  },
  planetGlyph: { width: OrtusSizes.listIconBox },
  flex: { flex: 1 },
  aspectRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.sm },
  dot: { width: OrtusSizes.dot, height: OrtusSizes.dot, borderRadius: OrtusRadii.pill },
});
