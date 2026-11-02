import { useEffect } from 'react';

import { OrtusScreen, Reveal, useResumedOnly } from '@/core/ui';
import {
  CalloutTone,
  OrtusCallout,
  OrtusCheckboxRow,
  OrtusTextField,
  OrtusTopBar,
  OrtusWideButton,
} from '@/designsystem';
import { useT } from '@/i18n';
import { goBack, navigateToSavedPartner } from '@/navigation/routes';

import { DateSection, GenderSection, PlaceSection, RelationshipSection, TimeSection } from './AddPartnerSections';
import { canSave, type AddPartnerState } from './addPartnerModel';
import { useAddPartnerModel, type AddPartnerActions } from './useAddPartnerModel';

/** The add-person form, wired to its model; once saved, their match opens in place of the form. */
export function AddPartnerScreen() {
  const { state, actions } = useAddPartnerModel();
  const onBack = useResumedOnly(goBack);
  return <AddPartnerContent state={state} actions={actions} onSaved={navigateToSavedPartner} onBack={onBack} />;
}

export type AddPartnerContentProps = {
  state: AddPartnerState;
  actions: AddPartnerActions;
  onSaved: (id: number) => void;
  onBack: () => void;
};

/** S07-02: the other person's birth data, relationship and consent, on one scrolling form. */
export function AddPartnerContent({ state, actions, onSaved, onBack }: AddPartnerContentProps) {
  const { tf } = useT();
  const savedId = state.savedId;
  useEffect(() => {
    if (savedId !== null) onSaved(savedId);
  }, [savedId, onSaved]);
  return (
    <OrtusScreen
      header={<OrtusTopBar title={tf('match_add_title')} onBack={onBack} backAccessibilityLabel={tf('match_back')} />}
    >
      <Reveal index={0}>
        <OrtusTextField
          value={state.name}
          onChangeText={actions.setName}
          label={tf('match_field_name')}
          placeholder={tf('match_name_placeholder')}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </Reveal>
      <Reveal index={1}>
        <DateSection state={state} actions={actions} />
      </Reveal>
      <Reveal index={2}>
        <TimeSection state={state} actions={actions} />
      </Reveal>
      <Reveal index={3}>
        <PlaceSection state={state} actions={actions} />
      </Reveal>
      <GenderSection state={state} actions={actions} />
      <RelationshipSection state={state} actions={actions} />
      <OrtusCheckboxRow
        title={tf('match_consent_title')}
        checked={state.hasConsent}
        onCheckedChange={actions.setConsent}
        description={tf('match_consent_body')}
      />
      {state.saveFailed ? <OrtusCallout text={tf('match_save_failed')} tone={CalloutTone.Warning} /> : null}
      <OrtusWideButton text={tf('match_save')} onPress={actions.save} enabled={canSave(state)} />
    </OrtusScreen>
  );
}
