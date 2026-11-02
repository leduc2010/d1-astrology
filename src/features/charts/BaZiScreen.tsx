import { Reveal, StrengthCard, useResumedOnly } from '@/core/ui';
import { useT } from '@/i18n';
import { goBack } from '@/navigation/routes';

import { BalanceCard, LuckCard } from './components/BaZiCards';
import { ChartFootnote, ChartPage } from './components/ChartFrame';
import { PillarTable } from './components/PillarTable';
import type { ChartsUiState } from './model/chartsModel';
import { useChartsModel } from './model/useChartsModel';

/** The Bát Tự route, wired to its own charts model. */
export function BaZiScreen() {
  const { state } = useChartsModel();
  const back = useResumedOnly(goBack);
  return <BaZiContent state={state} onBack={back} />;
}

/** Bát Tự page: the four-pillar table, the five-element balance, day master strength and the luck pillars. */
export function BaZiContent({ state, onBack }: { state: ChartsUiState; onBack: () => void }) {
  const { tf } = useT();
  return (
    <ChartPage title={tf('charts_bazi_title')} state={state} onBack={onBack}>
      {({ charts }) => (
        <>
          <Reveal index={0}>
            <PillarTable baZi={charts.baZi} />
          </Reveal>
          <Reveal index={1}>
            <BalanceCard baZi={charts.baZi} />
          </Reveal>
          <Reveal index={2}>
            <StrengthCard strength={charts.baZi.strength} />
          </Reveal>
          <Reveal index={3}>
            <LuckCard charts={charts} />
          </Reveal>
          <Reveal index={4}>
            <ChartFootnote text={tf('charts_bazi_footnote')} />
          </Reveal>
        </>
      )}
    </ChartPage>
  );
}
