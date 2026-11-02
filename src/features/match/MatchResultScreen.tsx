import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { OrtusScreen, Reveal, useResumedOnly } from '@/core/ui';
import {
  asCard,
  ButtonStyle,
  CalloutTone,
  Disclaimer,
  OrtusBottomSheet,
  OrtusCallout,
  OrtusCardRow,
  OrtusColors,
  OrtusLinkButton,
  OrtusTopBar,
  OrtusWideButton,
} from '@/designsystem';
import { useT } from '@/i18n';
import { goBack } from '@/navigation/routes';

import { MatchNotice } from './MatchCommon';
import { AstroCard, BaZiCard, FolkCard, PointsCard, SealsHeader } from './MatchResultParts';
import type { MatchResultUiState } from './matchResultModel';
import { useMatchResultModel } from './useMatchResultModel';

/** A pair's match, wired to its model; a person who is no longer stored closes the page. */
export function MatchResultScreen({ partnerId }: { partnerId: number }) {
  const model = useMatchResultModel(partnerId);
  const onBack = useResumedOnly(goBack);
  return <MatchResultContent state={model.state} onDelete={model.onDelete} onGone={goBack} onBack={onBack} />;
}

export type MatchResultContentProps = {
  state: MatchResultUiState;
  onDelete: () => void;
  onGone: () => void;
  onBack: () => void;
};

/** S07-03: two charts read system by system — never added up into one score. */
export function MatchResultContent({ state, onDelete, onGone, onBack }: MatchResultContentProps) {
  const { tf } = useT();
  const isGone = state.kind === 'Gone';
  useEffect(() => {
    if (isGone) onGone();
  }, [isGone, onGone]);
  const title =
    state.kind === 'Ready' ? tf('match_pair_name', state.report.first.name, state.report.second.name) : tf('match_title');
  return (
    <OrtusScreen header={<OrtusTopBar title={title} onBack={onBack} backAccessibilityLabel={tf('match_back')} />}>
      {state.kind === 'NoProfile' ? <MatchNotice isMissingProfile /> : null}
      {state.kind === 'Unavailable' ? <MatchNotice isMissingProfile={false} /> : null}
      {state.kind === 'Ready' ? <ReadyContent state={state} onDelete={onDelete} /> : null}
    </OrtusScreen>
  );
}

type Ready = Extract<MatchResultUiState, { kind: 'Ready' }>;

function ReadyContent({ state, onDelete }: { state: Ready; onDelete: () => void }) {
  const { tf } = useT();
  const report = state.report;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const c = OrtusColors;
  return (
    <>
      <Reveal index={0}>
        <SealsHeader report={report} />
      </Reveal>
      <Reveal index={1}>
        <AstroCard report={report} />
      </Reveal>
      <Reveal index={2}>
        <BaZiCard report={report} />
      </Reveal>
      <Reveal index={3}>
        <FolkCard report={report} />
      </Reveal>
      <Reveal index={4}>
        <OrtusCardRow>
          <PointsCard
            label={tf('match_strengths')}
            points={report.strengths}
            empty={tf('match_strengths_empty')}
            tone={asCard(c.auspicious, c.auspicious.content)}
            report={report}
          />
          <PointsCard
            label={tf('match_cares')}
            points={report.cares}
            empty={tf('match_cares_empty')}
            tone={asCard(c.inauspicious, c.inauspicious.content)}
            report={report}
          />
        </OrtusCardRow>
      </Reveal>
      <Disclaimer text={tf('match_disclaimer')} />
      {state.deleteFailed ? <OrtusCallout text={tf('match_delete_failed')} tone={CalloutTone.Warning} /> : null}
      <OrtusLinkButton
        text={tf('match_delete')}
        onPress={() => setConfirmDelete(true)}
        color={c.textMuted}
        style={styles.center}
      />
      {confirmDelete ? (
        <DeleteSheet name={state.partner.profile.name} onConfirm={onDelete} onDismiss={() => setConfirmDelete(false)} />
      ) : null}
    </>
  );
}

type DeleteSheetProps = { name: string; onConfirm: () => void; onDismiss: () => void };

function DeleteSheet({ name, onConfirm, onDismiss }: DeleteSheetProps) {
  const { tf } = useT();
  return (
    <OrtusBottomSheet onDismiss={onDismiss} title={tf('match_delete_title', name)} subtitle={tf('match_delete_body')}>
      {(close) => (
        <>
          <OrtusWideButton
            text={tf('match_delete_confirm')}
            onPress={() => {
              close();
              onConfirm();
            }}
          />
          <OrtusWideButton text={tf('match_delete_cancel')} onPress={close} variant={ButtonStyle.Outline} />
        </>
      )}
    </OrtusBottomSheet>
  );
}

const styles = StyleSheet.create({
  center: { alignSelf: 'center' },
});
