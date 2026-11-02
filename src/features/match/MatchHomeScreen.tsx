import { OrtusScreen, Reveal, useResumedOnly } from '@/core/ui';
import { ButtonStyle, OrtusColors, OrtusIcons, OrtusText, OrtusTopBar, OrtusWideButton } from '@/designsystem';
import { useT } from '@/i18n';
import { goBack, navigateToAddPartner, navigateToMatchResult } from '@/navigation/routes';

import { MatchNotice } from './MatchCommon';
import { PairCards, SavedPairs } from './MatchHomeParts';
import type { MatchHomeUiState } from './matchHomeModel';
import { useMatchHomeModel } from './useMatchHomeModel';

/** The match hub, wired to its model and the app's navigation. */
export function MatchHomeScreen() {
  const model = useMatchHomeModel();
  const onOpenResult = useResumedOnly(navigateToMatchResult);
  const onAddPartner = useResumedOnly(navigateToAddPartner);
  const onBack = useResumedOnly(goBack);
  return (
    <MatchHomeContent
      state={model.state}
      onOpenResult={onOpenResult}
      onSelect={model.onSelect}
      onAddPartner={onAddPartner}
      onBack={onBack}
    />
  );
}

export type MatchHomeContentProps = {
  state: MatchHomeUiState;
  onOpenResult: (id: number) => void;
  onSelect: (id: number) => void;
  onAddPartner: () => void;
  onBack: () => void;
};

/** S07-01: the owner and the person picked to compare with, then everyone added before. */
export function MatchHomeContent({ state, onOpenResult, onSelect, onAddPartner, onBack }: MatchHomeContentProps) {
  const { tf } = useT();
  return (
    <OrtusScreen header={<OrtusTopBar title={tf('match_title')} onBack={onBack} backAccessibilityLabel={tf('match_back')} />}>
      {state.kind === 'NoProfile' ? <MatchNotice isMissingProfile /> : null}
      {state.kind === 'Unavailable' ? <MatchNotice isMissingProfile={false} /> : null}
      {state.kind === 'Ready' ? (
        <>
          <Reveal index={0}>
            <OrtusText variant="body" color={OrtusColors.textSecondary}>
              {tf('match_intro')}
            </OrtusText>
          </Reveal>
          <Reveal index={1}>
            <PairCards state={state} onAddPartner={onAddPartner} />
          </Reveal>
          <Reveal index={2}>
            <OrtusWideButton
              text={tf('match_view')}
              onPress={() => {
                if (state.selected) onOpenResult(state.selected.partner.id);
              }}
              enabled={state.selected !== null}
            />
          </Reveal>
          <Reveal index={3}>
            <SavedPairs state={state} onOpenResult={onOpenResult} onSelect={onSelect} />
          </Reveal>
          <Reveal index={4}>
            <OrtusWideButton
              text={tf('match_add_partner')}
              onPress={onAddPartner}
              variant={ButtonStyle.Outline}
              leadingIcon={OrtusIcons.Plus}
            />
          </Reveal>
        </>
      ) : null}
    </OrtusScreen>
  );
}
