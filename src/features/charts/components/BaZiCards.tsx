import { StyleSheet, View } from 'react-native';

import { elementColors, elementName, listText, stemBranchHan, stemBranchName, type UiText } from '@/core/ui';
import {
  OrtusColors as c,
  FadingScrollView,
  OrtusGradients,
  OrtusSectionCard,
  OrtusShapes,
  OrtusSizes,
  OrtusSpacing,
  OrtusStroke,
  OrtusText,
} from '@/designsystem';
import { ELEMENTS, stemElement, type Element, type LuckPillar } from '@/engine';
import { useT } from '@/i18n';

import { polarityText } from '../chartsText';
import { characterCount, PillarKind, type BaZiView, type BirthCharts } from '../model/chartViews';
import { CountBar } from './CountBar';

type Balance = BaZiView['balance'];

/** Count of each element over the eight characters, as bars that grow in on first show. */
export function BalanceCard({ baZi }: { baZi: BaZiView }) {
  const t = useT();
  const counts = new Map<Element, number>(baZi.balance.map(([element, count]) => [element, count]));
  const most = Math.max(1, ...counts.values());
  return (
    <OrtusSectionCard
      title={t.tf('charts_balance_label')}
      trailing={
        <OrtusText variant="caption" color={c.textMuted}>
          {t.tf('charts_balance_characters', characterCount(baZi))}
        </OrtusText>
      }
    >
      <View style={styles.bars}>
        {ELEMENTS.map((element, index) => (
          <CountBar
            key={element}
            name={elementName(t, element)}
            count={counts.get(element) ?? 0}
            most={most}
            index={index}
            color={elementColors(element).content}
          />
        ))}
      </View>
      <OrtusText variant="caption" color={c.textSecondary}>
        {t.tf('charts_balance_note', tiedNames(t, baZi.balance, true), tiedNames(t, baZi.balance, false))}
      </OrtusText>
    </OrtusSectionCard>
  );
}

/** Every element sharing the top (or bottom) count, so a tie never singles one out at random. */
export function tiedNames(t: UiText, balance: Balance, most: boolean): string {
  const values = balance.map(([, count]) => count);
  const edge = most ? Math.max(...values) : Math.min(...values);
  return listText(
    t,
    balance.filter(([, count]) => count === edge).map(([element]) => elementName(t, element)),
  );
}

/** Ten-year luck pillars in a sideways strip, opened at the one running now. */
export function LuckCard({ charts }: { charts: BirthCharts }) {
  const t = useT();
  const baZi = charts.baZi;
  const step = OrtusSizes.luckCardWidth + OrtusSpacing.xs;
  const opening = baZi.currentLuck === null ? 0 : Math.max(baZi.currentLuck - 1, 0) * step;
  const yearStem = baZi.columns.find((col) => col.kind === PillarKind.YEAR)?.pillar?.stem;
  return (
    <OrtusSectionCard title={t.tf('charts_luck_label', baZi.luckStartAge)}>
      {yearStem !== undefined ? (
        <OrtusText variant="caption" color={c.textSecondary}>
          {t.tf(baZi.luckForward ? 'charts_luck_forward' : 'charts_luck_backward', polarityText(t, yearStem, charts.gender))}
        </OrtusText>
      ) : null}
      <FadingScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: opening, y: 0 }}
        contentContainerStyle={styles.strip}
      >
        {baZi.luck.map((luck, index) => (
          <LuckTile key={luck.startAge} luck={luck} isCurrent={index === baZi.currentLuck} />
        ))}
      </FadingScrollView>
    </OrtusSectionCard>
  );
}

function LuckTile({ luck, isCurrent }: { luck: LuckPillar; isCurrent: boolean }) {
  const t = useT();
  const ages = t.tf(isCurrent ? 'charts_luck_ages_now' : 'charts_luck_ages', luck.startAge, luck.endAge);
  const name = stemBranchName(t, luck.pillar);
  return (
    <View
      style={[styles.tile, isCurrent ? styles.tileCurrent : styles.tileIdle]}
      accessible
      accessibilityLabel={t.tf('charts_luck_tile_description', ages, name)}
    >
      <OrtusText variant="micro" color={isCurrent ? c.accent : c.textMuted}>
        {ages}
      </OrtusText>
      <OrtusText variant="hanSmall" color={elementColors(stemElement(luck.pillar.stem)).content}>
        {stemBranchHan(luck.pillar)}
      </OrtusText>
      <OrtusText variant="micro" color={c.textSecondary}>
        {name}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { gap: OrtusSpacing.sm },
  strip: { flexDirection: 'row', gap: OrtusSpacing.xs },
  tile: {
    width: OrtusSizes.luckCardWidth,
    height: OrtusSizes.luckCardHeight,
    ...OrtusShapes.tile,
    overflow: 'hidden',
    borderWidth: OrtusStroke.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCurrent: { backgroundImage: OrtusGradients.selectedCell, borderColor: c.chart.selectedBorder },
  tileIdle: { backgroundColor: c.insetContainer, borderColor: c.cardBorder },
});
