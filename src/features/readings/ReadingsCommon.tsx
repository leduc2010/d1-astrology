import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Topic } from '@/core/reading';
import { OrtusScreen, PlaceholderSection, ReadingDisclaimer } from '@/core/ui';
import { OrtusIcons, OrtusTopBar, type OrtusIconComponent } from '@/designsystem';
import { useT } from '@/i18n';

import type { ReadingsReady, ReadingsUiState } from './readingsModel';

export type ReadingsPageProps = {
  title: string;
  state: ReadingsUiState;
  onBack: () => void;
  /** Runs only once the readings are ready. */
  children: (ready: ReadingsReady) => ReactNode;
};

/**
 * Frame shared by the readings pages: top bar, the state notices, and the disclaimer closing
 * every reading.
 */
export function ReadingsPage({ title, state, onBack, children }: ReadingsPageProps) {
  const { tf } = useT();
  return (
    <OrtusScreen header={<OrtusTopBar title={title} onBack={onBack} backAccessibilityLabel={tf('readings_back')} />}>
      <ReadingsStateNotice state={state} />
      {state.kind === 'Ready' ? (
        <>
          {children(state)}
          <ReadingDisclaimer />
        </>
      ) : null}
    </OrtusScreen>
  );
}

/** Loading, missing-profile and out-of-range states shared by every readings page. */
export function ReadingsStateNotice({ state, style }: { state: ReadingsUiState; style?: StyleProp<ViewStyle> }) {
  const { tf } = useT();
  switch (state.kind) {
    case 'NoProfile':
      return (
        <PlaceholderSection
          label={tf('readings_no_profile_label')}
          title={tf('readings_no_profile_title')}
          body={tf('readings_no_profile_body')}
          style={style}
        />
      );
    case 'Unavailable':
      return (
        <PlaceholderSection
          label={tf('readings_unavailable_label')}
          title={tf('readings_unavailable_title')}
          body={tf('readings_unavailable_body')}
          style={style}
        />
      );
    default:
      return null;
  }
}

export function ZiWeiMissingNotice({ style }: { style?: StyleProp<ViewStyle> }) {
  const { tf } = useT();
  return (
    <PlaceholderSection
      label={tf('readings_ziwei_missing_label')}
      title={tf('readings_ziwei_missing_title')}
      body={tf('readings_ziwei_missing_body')}
      style={style}
    />
  );
}

const TOPIC_ICONS: Readonly<Record<Topic, OrtusIconComponent>> = {
  [Topic.PERSONALITY]: OrtusIcons.Me,
  [Topic.CAREER]: OrtusIcons.Chart,
  [Topic.LOVE]: OrtusIcons.Heart,
  [Topic.MONEY]: OrtusIcons.Sparkle,
  [Topic.FAMILY]: OrtusIcons.Today,
  [Topic.WELLBEING]: OrtusIcons.Moon,
};

export const topicIcon = (topic: Topic): OrtusIconComponent => TOPIC_ICONS[topic];
