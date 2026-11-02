import { useState } from 'react';

import { Reveal } from '@/core/ui';
import { OrtusColors as c, OrtusCard, OrtusText } from '@/designsystem';
import type { Planet } from '@/engine';
import { useT } from '@/i18n';
import { goBack } from '@/navigation/routes';

import { moonAndRising, sunHeadline } from './chartsText';
import { ChartFootnote, ChartPage, type ReadyCharts } from './components/ChartFrame';
import { AspectsCard, BigThree, ElementsCard, PlanetsCard } from './components/NatalCards';
import { PlanetSheet, RisingSheet } from './components/NatalSheets';
import { NatalWheel } from './components/NatalWheel';
import type { ChartsUiState } from './model/chartsModel';
import { useChartsModel } from './model/useChartsModel';

/** The natal chart route, wired to its own charts model. */
export function NatalScreen() {
  const { state } = useChartsModel();
  return <NatalContent state={state} onBack={goBack} />;
}

/** Natal chart page: the wheel, the big three, planets with houses, aspects and the element balance. */
export function NatalContent({ state, onBack }: { state: ChartsUiState; onBack: () => void }) {
  const { tf } = useT();
  return (
    <ChartPage title={tf('charts_natal_title')} state={state} onBack={onBack}>
      {(ready) => <NatalBody ready={ready} />}
    </ChartPage>
  );
}

function NatalBody({ ready }: { ready: ReadyCharts }) {
  const t = useT();
  const [planet, setPlanet] = useState<Planet | null>(null);
  const [showRising, setShowRising] = useState(false);
  const natal = ready.charts.natal;
  const chart = natal.chart;
  return (
    <>
      <Reveal index={0}>
        <OrtusCard>
          <NatalWheel
            chart={chart}
            description={t.tf('charts_wheel_description', sunHeadline(t, chart), moonAndRising(t, natal))}
            ascendantLabel={t.tf('charts_ascendant_short')}
          />
          {!natal.hasTime ? (
            <OrtusText variant="caption" color={c.textSecondary}>
              {t.tf('charts_natal_no_time')}
            </OrtusText>
          ) : null}
        </OrtusCard>
      </Reveal>
      <Reveal index={1}>
        <BigThree natal={natal} onPlanet={setPlanet} onRising={() => setShowRising(true)} />
      </Reveal>
      <Reveal index={2}>
        <PlanetsCard natal={natal} onPlanet={setPlanet} />
      </Reveal>
      {chart.aspects.length > 0 ? (
        <Reveal index={3}>
          <AspectsCard aspects={chart.aspects} />
        </Reveal>
      ) : null}
      <Reveal index={4}>
        <ElementsCard chart={chart} />
      </Reveal>
      <Reveal index={5}>
        <ChartFootnote text={t.tf('charts_natal_footnote')} />
      </Reveal>
      {planet !== null ? <PlanetSheet natal={natal} planet={planet} onDismiss={() => setPlanet(null)} /> : null}
      {showRising ? <RisingSheet natal={natal} onDismiss={() => setShowRising(false)} /> : null}
    </>
  );
}
