import { StyleSheet, View } from 'react-native';

import { RELATIONSHIPS, Gender, type BirthPlace } from '@/core/model';
import { BirthDateWheels, BirthTimeWheels, CalendarMode, placeName, relationshipName, stemBranchName } from '@/core/ui';
import {
  CalloutTone,
  OrtusCallout,
  OrtusCard,
  OrtusChip,
  OrtusColors,
  OrtusField,
  OrtusIcons,
  OrtusListRow,
  OrtusSegmentedControl,
  OrtusSpacing,
  OrtusText,
  OrtusTextField,
  RowTrailing,
} from '@/designsystem';
import { yearPillar } from '@/engine';
import { useT } from '@/i18n';

import type { AddPartnerState } from './addPartnerModel';
import type { AddPartnerActions } from './useAddPartnerModel';

/** Calendar modes and genders in the order of their segmented controls. */
const MODES: readonly CalendarMode[] = [CalendarMode.Solar, CalendarMode.Lunar];
const GENDERS: readonly Gender[] = [Gender.MALE, Gender.FEMALE];

type SectionProps = { state: AddPartnerState; actions: AddPartnerActions };

export function DateSection({ state, actions }: SectionProps) {
  const t = useT();
  const date = state.date;
  const check = state.dateCheck;
  return (
    <OrtusField label={t.tf('match_field_date')}>
      <OrtusSegmentedControl
        options={[t.tf('match_calendar_solar'), t.tf('match_calendar_lunar')]}
        selectedIndex={MODES.indexOf(date.mode)}
        onSelect={(index) => {
          const mode = MODES[index];
          if (mode) actions.setCalendarMode(mode);
        }}
      />
      <BirthDateWheels
        date={date}
        firstYear={state.firstYear}
        lastYear={state.lastYear}
        daysInMonth={state.daysInMonth}
        onDayChange={actions.setDay}
        onMonthChange={actions.setMonth}
        onYearChange={actions.setYear}
      />
      {date.mode === CalendarMode.Lunar && check?.leapMonth === date.month ? (
        <OrtusCard contentPadding={OrtusSpacing.xs}>
          <OrtusListRow
            title={t.tf('match_leap_month')}
            subtitle={t.tf('match_leap_month_body', date.month)}
            trailing={RowTrailing.toggle(date.isLeapMonth, actions.setLeapMonth)}
          />
        </OrtusCard>
      ) : null}
      {check ? (
        <OrtusText variant="caption" color={OrtusColors.textSecondary}>
          {t.tf('match_lunar_year_hint', stemBranchName(t, yearPillar(check.lunar.year)))}
        </OrtusText>
      ) : null}
      {check?.isFuture ? <OrtusCallout text={t.tf('match_date_future')} tone={CalloutTone.Warning} /> : null}
    </OrtusField>
  );
}

export function TimeSection({ state, actions }: SectionProps) {
  const { tf } = useT();
  return (
    <OrtusField label={tf('match_field_time')}>
      <OrtusCard contentPadding={OrtusSpacing.xs}>
        <OrtusListRow
          title={tf('match_time_unknown')}
          trailing={RowTrailing.toggle(state.isTimeUnknown, actions.setTimeUnknown)}
        />
      </OrtusCard>
      {state.isTimeUnknown ? null : (
        <BirthTimeWheels clock={state.clock} onHourChange={actions.setHour} onMinuteChange={actions.setMinute} />
      )}
    </OrtusField>
  );
}

/** Keeps the picked place on screen even when a new search no longer lists it. */
function shownPlaces(state: AddPartnerState): readonly BirthPlace[] {
  const chosen = state.place;
  return chosen !== null && !state.placeResults.includes(chosen) ? [chosen, ...state.placeResults] : state.placeResults;
}

export function PlaceSection({ state, actions }: SectionProps) {
  const t = useT();
  const places = shownPlaces(state);
  return (
    <View style={styles.place}>
      <OrtusTextField
        value={state.placeQuery}
        onChangeText={actions.setPlaceQuery}
        label={t.tf('match_field_place')}
        placeholder={t.tf('match_place_placeholder')}
        leadingIcon={OrtusIcons.Search}
        autoCapitalize="words"
        returnKeyType="search"
      />
      {places.length === 0 ? (
        <OrtusText variant="body" color={OrtusColors.textSecondary}>
          {t.tf('match_place_empty')}
        </OrtusText>
      ) : (
        <OrtusCard contentPadding={OrtusSpacing.xs}>
          {places.map((place, index) => (
            <OrtusListRow
              key={`${place.name}|${place.region}|${place.latitude}|${place.longitude}`}
              title={placeName(t, place)}
              icon={OrtusIcons.Pin}
              trailing={place === state.place ? RowTrailing.Selected : RowTrailing.None}
              showDivider={index < places.length - 1}
              onPress={() => actions.selectPlace(place)}
            />
          ))}
        </OrtusCard>
      )}
    </View>
  );
}

export function GenderSection({ state, actions }: SectionProps) {
  const { tf } = useT();
  return (
    <OrtusField label={tf('match_field_gender')}>
      <OrtusSegmentedControl
        options={[tf('match_gender_male'), tf('match_gender_female')]}
        selectedIndex={state.gender === null ? -1 : GENDERS.indexOf(state.gender)}
        onSelect={(index) => {
          const gender = GENDERS[index];
          if (gender) actions.setGender(gender);
        }}
      />
    </OrtusField>
  );
}

export function RelationshipSection({ state, actions }: SectionProps) {
  const t = useT();
  return (
    <OrtusField label={t.tf('match_field_relationship')}>
      <View style={styles.chips}>
        {RELATIONSHIPS.map((relationship) => (
          <OrtusChip
            key={relationship}
            text={relationshipName(t, relationship)}
            selected={state.relationship === relationship}
            onPress={() => actions.setRelationship(relationship)}
          />
        ))}
      </View>
    </OrtusField>
  );
}

const styles = StyleSheet.create({
  place: { width: '100%', gap: OrtusSpacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: OrtusSpacing.xs },
});
