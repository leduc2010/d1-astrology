import { useState } from 'react';

import { Reveal } from '@/core/ui';
import type { Branch } from '@/engine';
import { useT } from '@/i18n';
import { goBack } from '@/navigation/routes';

import { ChartPage, type ReadyCharts } from './components/ChartFrame';
import { PalaceDetailSheet } from './components/PalaceDetailSheet';
import { PalaceGrid } from './components/PalaceGrid';
import { BoardCentre, LegendCard, NeedsTimeNotice, SelectedPalaceCard, TransformationsCard } from './components/ZiWeiCards';
import { palaceOf } from './model/chartViews';
import type { ChartsUiState } from './model/chartsModel';
import { useChartsModel } from './model/useChartsModel';

/** The Tử Vi route, wired to its own charts model. */
export function ZiWeiScreen() {
  const { state, onSelectPalace } = useChartsModel();
  return <ZiWeiContent state={state} onSelectPalace={onSelectPalace} onBack={goBack} />;
}

export type ZiWeiContentProps = {
  state: ChartsUiState;
  onSelectPalace: (branch: Branch) => void;
  onBack: () => void;
};

/** Tử Vi page: the twelve-palace board, the palace picked on it, and the year's four transformations. */
export function ZiWeiContent({ state, onSelectPalace, onBack }: ZiWeiContentProps) {
  const { tf } = useT();
  return (
    <ChartPage title={tf('charts_ziwei_title')} state={state} onBack={onBack}>
      {(ready) => <ZiWeiBody ready={ready} onSelectPalace={onSelectPalace} />}
    </ChartPage>
  );
}

function ZiWeiBody({ ready, onSelectPalace }: { ready: ReadyCharts; onSelectPalace: (branch: Branch) => void }) {
  // The palace itself is kept, not a flag, so the sheet shows the palace it was opened on.
  const [detailsFor, setDetailsFor] = useState<Branch | null>(null);
  const charts = ready.charts;
  const ziWei = charts.ziWei;
  if (ziWei === null) return <NeedsTimeNotice />;
  const selected = ready.selectedPalace ?? ziWei.lifeBranch;
  return (
    <>
      <Reveal index={0}>
        <PalaceGrid
          ziWei={ziWei}
          selected={selected}
          onSelect={onSelectPalace}
          centre={<BoardCentre charts={charts} ziWei={ziWei} />}
        />
      </Reveal>
      <Reveal index={1}>
        <SelectedPalaceCard ziWei={ziWei} selected={selected} onOpenDetails={() => setDetailsFor(selected)} />
      </Reveal>
      <Reveal index={2}>
        <TransformationsCard transformations={ziWei.transformations} />
      </Reveal>
      <Reveal index={3}>
        <LegendCard />
      </Reveal>
      {detailsFor !== null ? (
        <PalaceDetailSheet ziWei={ziWei} palace={palaceOf(ziWei, detailsFor)} onDismiss={() => setDetailsFor(null)} />
      ) : null}
    </>
  );
}
