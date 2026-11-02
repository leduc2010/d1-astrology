import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { OrtusScreen, PlaceholderSection, ReadingDisclaimer } from '@/core/ui';
import { OrtusColors as c, OrtusText, OrtusTopBar } from '@/designsystem';
import { useT } from '@/i18n';

import type { ChartsUiState } from '../model/chartsModel';

export type ReadyCharts = Extract<ChartsUiState, { kind: 'ready' }>;

export type ChartPageProps = {
  title: string;
  state: ChartsUiState;
  onBack: () => void;
  /** Runs only once the charts are ready. */
  children: (state: ReadyCharts) => ReactNode;
};

/**
 * Frame shared by the three chart pages: top bar, the no-profile notice, and the disclaimer
 * closing every reading.
 */
export function ChartPage({ title, state, onBack, children }: ChartPageProps) {
  const { tf } = useT();
  return (
    <OrtusScreen header={<OrtusTopBar title={title} onBack={onBack} backAccessibilityLabel={tf('charts_back')} />}>
      <ChartsStateContent state={state}>
        {(ready) => (
          <>
            {children(ready)}
            <ReadingDisclaimer />
          </>
        )}
      </ChartsStateContent>
    </OrtusScreen>
  );
}

/** Nothing while loading, a notice without charts, otherwise [children]. */
export function ChartsStateContent({
  state,
  children,
}: {
  state: ChartsUiState;
  children: (state: ReadyCharts) => ReactNode;
}) {
  switch (state.kind) {
    case 'loading':
      return null;
    case 'noProfile':
      return <NoProfileNotice />;
    case 'unavailable':
      return <UnavailableNotice />;
    case 'ready':
      return children(state);
  }
}

export function NoProfileNotice({ style }: { style?: StyleProp<ViewStyle> }) {
  const { tf } = useT();
  return (
    <PlaceholderSection
      label={tf('charts_no_profile_label')}
      title={tf('charts_no_profile_title')}
      body={tf('charts_no_profile_body')}
      style={style}
    />
  );
}

export function UnavailableNotice({ style }: { style?: StyleProp<ViewStyle> }) {
  const { tf } = useT();
  return (
    <PlaceholderSection
      label={tf('charts_unavailable_label')}
      title={tf('charts_unavailable_title')}
      body={tf('charts_unavailable_body')}
      style={style}
    />
  );
}

/** Small print under a chart: how it was worked out. */
export function ChartFootnote({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  return (
    <OrtusText variant="footnote" color={c.textMuted} style={style}>
      {text}
    </OrtusText>
  );
}
