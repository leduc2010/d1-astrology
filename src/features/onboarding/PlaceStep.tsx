import { useState } from 'react';

import { deepEqual, PlaceCatalog } from '@/core/data';
import type { BirthPlace } from '@/core/model';
import { Reveal } from '@/core/ui';
import {
  CalloutTone,
  OrtusCallout,
  OrtusCard,
  OrtusColors as c,
  OrtusIcons,
  OrtusLinkButton,
  OrtusListRow,
  OrtusSpacing,
  OrtusText,
  OrtusTextField,
  RowTrailing,
  SectionLabel,
} from '@/designsystem';
import { useT } from '@/i18n';

import { CoordinatesSheet } from './CoordinatesSheet';
import { placeDetail, placeTitle } from './onboardingText';
import { canContinue, OnboardingStep, type OnboardingUiState } from './onboardingState';
import { ContinueButton, StepScaffold } from './StepScaffold';

const SUGGESTED_PLACES = 6;

export type PlaceStepProps = {
  state: OnboardingUiState;
  onQueryChange: (query: string) => void;
  onPlaceSelect: (place: BirthPlace) => void;
  onCoordinates: (latitude: number, longitude: number, utcOffsetMinutes: number | null) => void;
  onBack: () => void;
  onContinue: () => void;
};

/** S01-05: search the bundled place list, or type coordinates for anywhere else. */
export function PlaceStep({ state, onQueryChange, onPlaceSelect, onCoordinates, onBack, onContinue }: PlaceStepProps) {
  const t = useT();
  const [showCoordinates, setShowCoordinates] = useState(false);
  const searching = state.placeQuery.trim() !== '';
  const places = searching ? state.placeResults : PlaceCatalog.places.slice(0, SUGGESTED_PLACES);
  const chosen = state.place;
  const chosenHidden = chosen !== null && !places.some((place) => deepEqual(place, chosen));
  return (
    <>
      <StepScaffold
        step={OnboardingStep.Place}
        title={t.tf('onboarding_place_title')}
        onBack={onBack}
        bottomBar={<ContinueButton onPress={onContinue} enabled={canContinue(state)} />}
      >
        <Reveal index={2}>
          <OrtusTextField
            value={state.placeQuery}
            onChangeText={onQueryChange}
            label={t.tf('onboarding_place_label')}
            placeholder={t.tf('onboarding_place_search')}
            leadingIcon={OrtusIcons.Search}
            autoCapitalize="words"
            returnKeyType="search"
          />
        </Reveal>
        {chosenHidden && (
          <>
            <SectionLabel text={t.tf('onboarding_selected')} />
            <PlaceList places={[chosen]} chosen={chosen} state={state} onPlaceSelect={onPlaceSelect} />
          </>
        )}
        <Reveal index={3}>
          <SectionLabel text={t.tf(searching ? 'onboarding_place_results' : 'onboarding_place_suggested')} />
        </Reveal>
        {places.length === 0 ? (
          <OrtusText variant="body" color={c.textSecondary}>
            {t.tf('onboarding_place_none')}
          </OrtusText>
        ) : (
          <Reveal index={4}>
            <PlaceList places={places} chosen={chosen} state={state} onPlaceSelect={onPlaceSelect} />
          </Reveal>
        )}
        <OrtusLinkButton
          text={t.tf('onboarding_place_manual')}
          onPress={() => setShowCoordinates(true)}
          trailingIcon={OrtusIcons.ChevronRight}
        />
        <OrtusCallout text={t.tf('onboarding_place_note')} tone={CalloutTone.Info} />
      </StepScaffold>
      {showCoordinates && (
        <CoordinatesSheet
          initial={state.place}
          onDismiss={() => setShowCoordinates(false)}
          onSave={(lat, lon, offset) => {
            onCoordinates(lat, lon, offset);
            setShowCoordinates(false);
          }}
        />
      )}
    </>
  );
}

type PlaceListProps = {
  places: readonly BirthPlace[];
  chosen: BirthPlace | null;
  state: OnboardingUiState;
  onPlaceSelect: (place: BirthPlace) => void;
};

function PlaceList({ places, chosen, state, onPlaceSelect }: PlaceListProps) {
  const t = useT();
  return (
    <OrtusCard contentPadding={OrtusSpacing.xs}>
      {places.map((place, index) => (
        <OrtusListRow
          key={`${place.name}|${place.region}|${place.latitude}|${place.longitude}`}
          title={placeTitle(t, place)}
          subtitle={placeDetail(t, place, state.dateCheck?.solar)}
          icon={OrtusIcons.Pin}
          trailing={chosen !== null && deepEqual(place, chosen) ? RowTrailing.Selected : RowTrailing.None}
          showDivider={index < places.length - 1}
          onPress={() => onPlaceSelect(place)}
        />
      ))}
    </OrtusCard>
  );
}
