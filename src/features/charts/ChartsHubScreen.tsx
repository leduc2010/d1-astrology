import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { branchHan, elementColors, OrtusScreen, ReadingDisclaimer, Reveal, stemHan, useResumedOnly } from '@/core/ui';
import {
  OrtusColors as c,
  OrtusCard,
  OrtusIcons,
  OrtusListRow,
  OrtusRootHeader,
  OrtusShapes,
  OrtusSizes,
  OrtusSpacing,
  OrtusStroke,
  OrtusText,
  SectionLabel,
} from '@/designsystem';
import { branchElement, stemElement } from '@/engine';
import { useT } from '@/i18n';
import { navigateToChart, navigateToMatch, navigateToReadings, type ChartKind } from '@/navigation/routes';

import { balanceSummary, dayMasterText, moonAndRising, palaceHeadline, sunHeadline, ziWeiSummary } from './chartsText';
import { NoProfileNotice, UnavailableNotice } from './components/ChartFrame';
import { NatalArt } from './components/NatalArt';
import { lifePalaceOf, type BirthCharts, type PillarColumn } from './model/chartViews';
import type { ChartsUiState } from './model/chartsModel';
import { useChartsModel } from './model/useChartsModel';

/** The Charts tab, wired to its model and the app's navigation. */
export function ChartsHubScreen() {
  const { state } = useChartsModel();
  const openChart = useResumedOnly(navigateToChart);
  const openReadings = useResumedOnly(navigateToReadings);
  const openMatch = useResumedOnly(navigateToMatch);
  return <ChartsHubContent state={state} onOpenChart={openChart} onOpenReadings={openReadings} onOpenMatch={openMatch} />;
}

export type ChartsHubContentProps = {
  state: ChartsUiState;
  onOpenChart: (kind: ChartKind) => void;
  onOpenReadings: () => void;
  onOpenMatch: () => void;
};

/** One card per chart system, each summing up the owner's chart in a line. */
export function ChartsHubContent({ state, onOpenChart, onOpenReadings, onOpenMatch }: ChartsHubContentProps) {
  const { tf } = useT();
  return (
    <OrtusScreen header={<OrtusRootHeader label={tf('charts_header_label')} title={tf('charts_header_title')} />}>
      {state.kind === 'noProfile' ? <NoProfileNotice /> : null}
      {state.kind === 'unavailable' ? <UnavailableNotice /> : null}
      {state.kind === 'ready' ? (
        <>
          <Reveal index={0}>
            <ZiWeiEntry charts={state.charts} onOpen={() => onOpenChart('ziwei')} />
          </Reveal>
          <Reveal index={1}>
            <BaZiEntry charts={state.charts} onOpen={() => onOpenChart('bazi')} />
          </Reveal>
          <Reveal index={2}>
            <NatalEntry charts={state.charts} onOpen={() => onOpenChart('natal')} />
          </Reveal>
          <Reveal index={3}>
            <ExploreEntries onOpenReadings={onOpenReadings} onOpenMatch={onOpenMatch} />
          </Reveal>
          <Reveal index={4}>
            <ReadingDisclaimer />
          </Reveal>
        </>
      ) : null}
    </OrtusScreen>
  );
}

type EntryProps = { charts: BirthCharts; onOpen: () => void };

function ZiWeiEntry({ charts, onOpen }: EntryProps) {
  const t = useT();
  const ziWei = charts.ziWei;
  return (
    <ChartEntry
      label={t.tf('charts_ziwei_label')}
      title={ziWei ? palaceHeadline(t, lifePalaceOf(ziWei)) : t.tf('charts_needs_time_title')}
      subtitle={ziWei ? ziWeiSummary(t, ziWei) : t.tf('charts_needs_time_body')}
      onPress={ziWei ? onOpen : undefined}
    >
      <OrtusText variant="hanMedium" color={c.accent}>
        {t.tf('charts_ziwei_han_short')}
      </OrtusText>
    </ChartEntry>
  );
}

function BaZiEntry({ charts, onOpen }: EntryProps) {
  const t = useT();
  return (
    <ChartEntry
      label={t.tf('charts_bazi_label')}
      title={dayMasterText(t, charts.baZi.dayMaster)}
      subtitle={balanceSummary(t, charts.baZi.balance)}
      onPress={onOpen}
    >
      <EightCharacters columns={charts.baZi.columns} />
    </ChartEntry>
  );
}

function NatalEntry({ charts, onOpen }: EntryProps) {
  const t = useT();
  return (
    <ChartEntry
      label={t.tf('charts_natal_label')}
      title={sunHeadline(t, charts.natal.chart)}
      subtitle={moonAndRising(t, charts.natal)}
      onPress={onOpen}
    >
      <NatalArt />
    </ChartEntry>
  );
}

/** "Explore": the topic readings drawn from all three charts, and matching two people. */
function ExploreEntries({ onOpenReadings, onOpenMatch }: { onOpenReadings: () => void; onOpenMatch: () => void }) {
  const { tf } = useT();
  return (
    <View style={styles.explore}>
      <SectionLabel text={tf('charts_explore_label')} />
      <OrtusCard contentPadding={OrtusSpacing.none}>
        <OrtusListRow
          title={tf('charts_readings_title')}
          subtitle={tf('charts_readings_subtitle')}
          icon={OrtusIcons.Sparkle}
          showDivider
          onPress={onOpenReadings}
        />
        <OrtusListRow
          title={tf('charts_match_title')}
          subtitle={tf('charts_match_subtitle')}
          icon={OrtusIcons.Heart}
          onPress={onOpenMatch}
        />
      </OrtusCard>
    </View>
  );
}

/** The eight characters in two rows (stems over branches), each tinted by its element. */
function EightCharacters({ columns }: { columns: readonly PillarColumn[] }) {
  return (
    <View style={styles.characters}>
      <View style={styles.characterRow}>
        {columns.map((col) => {
          const stem = col.pillar?.stem;
          return (
            <HanGlyph
              key={col.kind}
              han={stem === undefined ? null : stemHan(stem)}
              color={stem === undefined ? null : elementColors(stemElement(stem)).content}
            />
          );
        })}
      </View>
      <View style={styles.characterRow}>
        {columns.map((col) => {
          const branch = col.pillar?.branch;
          return (
            <HanGlyph
              key={col.kind}
              han={branch === undefined ? null : branchHan(branch)}
              color={branch === undefined ? null : elementColors(branchElement(branch)).content}
            />
          );
        })}
      </View>
    </View>
  );
}

function HanGlyph({ han, color }: { han: string | null; color: string | null }) {
  const { tf } = useT();
  return (
    <OrtusText variant="hanTag" color={color ?? c.textMuted}>
      {han ?? tf('charts_unknown')}
    </OrtusText>
  );
}

type ChartEntryProps = {
  label: string;
  title: string;
  subtitle: string;
  onPress: (() => void) | undefined;
  children: ReactNode;
};

/** Hub card: art box, upper-case system name, a headline and a summary line, then a chevron. */
function ChartEntry({ label, title, subtitle, onPress, children }: ChartEntryProps) {
  return (
    <OrtusCard onPress={onPress}>
      <View style={styles.entryRow}>
        <View style={styles.artBox}>{children}</View>
        <View style={styles.entryTexts}>
          <SectionLabel text={label} />
          <OrtusText variant="title" color={c.textPrimary}>
            {title}
          </OrtusText>
          <OrtusText variant="caption" color={c.textSecondary}>
            {subtitle}
          </OrtusText>
        </View>
        {onPress ? <OrtusIcons.ChevronRight size={OrtusSizes.iconSmall} color={c.textMuted} /> : null}
      </View>
    </OrtusCard>
  );
}

const styles = StyleSheet.create({
  explore: { gap: OrtusSpacing.cardGap },
  characters: { gap: OrtusSpacing.hair },
  characterRow: { flexDirection: 'row', gap: OrtusSpacing.hair },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.md },
  artBox: {
    width: OrtusSizes.chartArt,
    height: OrtusSizes.chartArt,
    ...OrtusShapes.tile,
    overflow: 'hidden',
    backgroundColor: c.insetContainer,
    borderWidth: OrtusStroke.hairline,
    borderColor: c.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTexts: { flex: 1, gap: OrtusSpacing.xxs },
});
