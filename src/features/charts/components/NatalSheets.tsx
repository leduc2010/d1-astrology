import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  houseArea,
  planetInHouse,
  planetInSign,
  planetName,
  planetNature,
  ReadingDisclaimer,
  risingInSign,
  zodiacSignNameOf,
} from '@/core/ui';
import { OrtusColors as c, OrtusBottomSheet, OrtusSpacing, OrtusText, SectionLabel } from '@/designsystem';
import { houseOfPosition, Planet } from '@/engine';
import { useT } from '@/i18n';

import type { NatalView } from '../model/chartViews';

const FIRST_HOUSE = 1;

/**
 * One planet read in full: what it stands for, its sign and, with a birth time, its house. A Moon
 * that changed sign on an unknown-time birthday reads both signs.
 */
export function PlanetSheet({ natal, planet, onDismiss }: { natal: NatalView; planet: Planet; onDismiss: () => void }) {
  const t = useT();
  const chart = natal.chart;
  const position = chart.planets.get(planet);
  if (!position) return null;
  const signs = planet === Planet.MOON ? natal.moonSigns : [position.sign];
  const house = houseOfPosition(chart, position);
  const subtitle = [
    signs.map((s) => zodiacSignNameOf(t, s)).join(t.tf('charts_or')),
    house === null ? null : t.tf('charts_house', house),
  ]
    .filter((s): s is string => s !== null)
    .join(t.tf('charts_dot_separator'));
  return (
    <NatalSheet title={planetName(t, planet)} subtitle={subtitle} onDismiss={onDismiss}>
      <ReadingBlock label={t.tf('charts_planet_nature')} body={planetNature(t, planet)} />
      {signs.map((sign) => (
        <ReadingBlock
          key={sign}
          label={t.tf('charts_in_sign', zodiacSignNameOf(t, sign))}
          body={planetInSign(t, planet, sign)}
        />
      ))}
      {house !== null ? (
        <ReadingBlock label={t.tf('charts_house', house)} body={planetInHouse(t, planet, house)} note={houseArea(t, house)} />
      ) : null}
    </NatalSheet>
  );
}

/** The rising sign read in full; only reachable with a birth time. */
export function RisingSheet({ natal, onDismiss }: { natal: NatalView; onDismiss: () => void }) {
  const t = useT();
  const ascendant = natal.chart.ascendant;
  if (!ascendant) return null;
  const sign = zodiacSignNameOf(t, ascendant.sign);
  return (
    <NatalSheet title={t.tf('charts_rising')} subtitle={sign} onDismiss={onDismiss}>
      <ReadingBlock label={t.tf('charts_in_sign', sign)} body={risingInSign(t, ascendant.sign)} />
      <ReadingBlock label={t.tf('charts_house', FIRST_HOUSE)} body={houseArea(t, FIRST_HOUSE)} />
    </NatalSheet>
  );
}

type NatalSheetProps = { title: string; subtitle: string; onDismiss: () => void; children: ReactNode };

function NatalSheet({ title, subtitle, onDismiss, children }: NatalSheetProps) {
  return (
    <OrtusBottomSheet onDismiss={onDismiss} title={title} subtitle={subtitle}>
      <ScrollView contentContainerStyle={styles.column}>
        {children}
        <ReadingDisclaimer />
      </ScrollView>
    </OrtusBottomSheet>
  );
}

function ReadingBlock({ label, body, note }: { label: string; body: string; note?: string }) {
  return (
    <View style={styles.block}>
      <SectionLabel text={label} />
      <OrtusText variant="body" color={c.textBody}>
        {body}
      </OrtusText>
      {note !== undefined ? (
        <OrtusText variant="caption" color={c.textSecondary}>
          {note}
        </OrtusText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: OrtusSpacing.md },
  block: { gap: OrtusSpacing.xxs },
});
