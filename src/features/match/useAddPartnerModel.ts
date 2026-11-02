import { useCallback, useMemo, useReducer, useRef } from 'react';

import { useServices } from '@/core/data';
import { todayEpochDay, type BirthPlace, type Gender, type Relationship } from '@/core/model';
import { BirthDates, civilDateOfEpochDay, type CalendarMode } from '@/core/ui';

import {
  addPartnerReducer,
  initialAddPartnerState,
  savePartner,
  type AddPartnerAction,
  type AddPartnerState,
} from './addPartnerModel';

/** What the add-person form can do; the screen depends on this, not on the model. */
export interface AddPartnerActions {
  setName(name: string): void;
  setCalendarMode(mode: CalendarMode): void;
  setYear(year: number): void;
  setMonth(month: number): void;
  setDay(day: number): void;
  setLeapMonth(isLeap: boolean): void;
  setHour(hour: number): void;
  setMinute(minute: number): void;
  setTimeUnknown(unknown: boolean): void;
  setPlaceQuery(query: string): void;
  selectPlace(place: BirthPlace): void;
  setGender(gender: Gender): void;
  setRelationship(relationship: Relationship): void;
  setConsent(given: boolean): void;
  save(): void;
}

/** S07-02 (Kotlin `AddPartnerViewModel`): the other person's birth data, relationship and consent. */
export function useAddPartnerModel(): { state: AddPartnerState; actions: AddPartnerActions } {
  const { partners } = useServices();
  const todayEpoch = useMemo(() => todayEpochDay(), []);
  const dates = useMemo(() => new BirthDates(civilDateOfEpochDay(todayEpoch)), [todayEpoch]);
  const reducer = useMemo(() => addPartnerReducer(dates), [dates]);
  const [state, dispatch] = useReducer(reducer, dates, initialAddPartnerState);
  // One write at a time, even if Save is tapped again before the next render.
  const saving = useRef(false);

  const send = useCallback((action: AddPartnerAction) => dispatch(action), []);
  const save = useCallback(() => {
    if (saving.current) return;
    saving.current = true;
    void savePartner(state, send, partners, todayEpoch).finally(() => {
      saving.current = false;
    });
  }, [partners, send, state, todayEpoch]);

  const actions = useMemo<AddPartnerActions>(
    () => ({
      setName: (name) => send({ type: 'name', name }),
      setCalendarMode: (mode) => send({ type: 'calendarMode', mode }),
      setYear: (year) => send({ type: 'year', year }),
      setMonth: (month) => send({ type: 'month', month }),
      setDay: (day) => send({ type: 'day', day }),
      setLeapMonth: (isLeap) => send({ type: 'leapMonth', isLeap }),
      setHour: (hour) => send({ type: 'hour', hour }),
      setMinute: (minute) => send({ type: 'minute', minute }),
      setTimeUnknown: (unknown) => send({ type: 'timeUnknown', unknown }),
      setPlaceQuery: (query) => send({ type: 'placeQuery', query }),
      selectPlace: (place) => send({ type: 'place', place }),
      setGender: (gender) => send({ type: 'gender', gender }),
      setRelationship: (relationship) => send({ type: 'relationship', relationship }),
      setConsent: (given) => send({ type: 'consent', given }),
      save,
    }),
    [save, send],
  );
  return { state, actions };
}
