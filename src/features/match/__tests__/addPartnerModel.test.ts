import { epochDayOf, searchPlaces } from '@/core/data';
import { type BirthPlace, Gender, Relationship } from '@/core/model';
import { FakePartnerRepository } from '@/core/testing';
import { BirthDates, CalendarMode } from '@/core/ui';
import { civilDate } from '@/engine';

import {
  addPartnerReducer,
  canSave,
  initialAddPartnerState,
  savePartner,
  type AddPartnerAction,
  type AddPartnerState,
} from '../addPartnerModel';
import { HANOI } from '../testing/matchTestData';

const TODAY = civilDate(2026, 11, 1);
const SAIGON = searchPlaces('Sài Gòn')[0]!;

/** Holds the form the way the Kotlin view model did: one state, changed only through actions. */
function form(partners: FakePartnerRepository) {
  const dates = new BirthDates(TODAY);
  const reduce = addPartnerReducer(dates);
  let state: AddPartnerState = initialAddPartnerState(dates);
  const send = (action: AddPartnerAction) => {
    state = reduce(state, action);
  };
  return {
    get state() {
      return state;
    },
    send,
    save: () => savePartner(state, send, partners, epochDayOf(TODAY)),
  };
}

function fillIn(f: ReturnType<typeof form>) {
  f.send({ type: 'name', name: '  Minh ' });
  f.send({ type: 'year', year: 1988 });
  f.send({ type: 'month', month: 10 });
  f.send({ type: 'day', day: 3 });
  f.send({ type: 'place', place: HANOI });
  f.send({ type: 'gender', gender: Gender.MALE });
  f.send({ type: 'relationship', relationship: Relationship.PARTNER });
  f.send({ type: 'consent', given: true });
}

describe('AddPartnerViewModel', () => {
  let partners: FakePartnerRepository;
  let f: ReturnType<typeof form>;

  beforeEach(() => {
    partners = new FakePartnerRepository();
    f = form(partners);
  });

  test('an empty form cannot be saved', () => {
    expect(canSave(f.state)).toBe(false);
    expect(f.state.isTimeUnknown).toBe(true);
  });

  test('saving needs the consent box', async () => {
    fillIn(f);
    f.send({ type: 'consent', given: false });

    await f.save();

    expect(canSave(f.state)).toBe(false);
    expect(partners.current()).toHaveLength(0);
  });

  test('saving stores the person with a trimmed name and no time', async () => {
    fillIn(f);

    await f.save();

    const stored = partners.current();
    expect(stored).toHaveLength(1);
    const saved = stored[0]!;
    expect(saved.id).toBe(f.state.savedId);
    expect(saved.profile.name).toBe('Minh');
    expect(saved.profile.date.year).toBe(1988);
    expect(saved.profile.clock).toBeNull();
    expect(saved.relationship).toBe(Relationship.PARTNER);
    expect(saved.addedOnEpochDay).toBe(epochDayOf(TODAY));
    expect(canSave(f.state)).toBe(false);
  });

  test('a known time is stored', async () => {
    fillIn(f);
    f.send({ type: 'timeUnknown', unknown: false });
    f.send({ type: 'hour', hour: 7 });
    f.send({ type: 'minute', minute: 30 });

    await f.save();

    const clock = partners.current()[0]!.profile.clock;
    expect(clock?.hour).toBe(7);
    expect(clock?.minute).toBe(30);
  });

  test('a lunar entry is remembered', async () => {
    fillIn(f);
    f.send({ type: 'calendarMode', mode: CalendarMode.Lunar });

    await f.save();

    expect(partners.current()[0]!.profile.enteredAsLunar).toBe(true);
  });

  test('a Southern lunar date before 1976 lands on the same solar day as for the owner', async () => {
    // Tết Mậu Thân: lunar 1/1/1968 was 29 January in the North and 30 January in the South,
    // the day onboarding stores for the owner too.
    async function saveLunarNewYear(place: BirthPlace) {
      const repository = new FakePartnerRepository();
      const lunar = form(repository);
      fillIn(lunar);
      lunar.send({ type: 'calendarMode', mode: CalendarMode.Lunar });
      lunar.send({ type: 'year', year: 1968 });
      lunar.send({ type: 'month', month: 1 });
      lunar.send({ type: 'day', day: 1 });
      lunar.send({ type: 'place', place });
      await lunar.save();
      return repository.current()[0]!.profile.date;
    }
    expect(await saveLunarNewYear(HANOI)).toEqual({ year: 1968, month: 1, day: 29 });
    expect(await saveLunarNewYear(SAIGON)).toEqual({ year: 1968, month: 1, day: 30 });
  });

  test('a future date blocks saving', () => {
    fillIn(f);
    f.send({ type: 'year', year: 2026 });
    f.send({ type: 'month', month: 12 });

    expect(f.state.dateCheck?.isFuture).toBe(true);
    expect(canSave(f.state)).toBe(false);
  });

  test('a failed write keeps the form and shows a notice', async () => {
    partners.addFailure = new Error('disk full');
    fillIn(f);

    await f.save();

    expect(f.state.saveFailed).toBe(true);
    expect(f.state.isSaving).toBe(false);
    expect(f.state.savedId).toBeNull();
    expect(canSave(f.state)).toBe(true);
  });

  test('a long name is cut', () => {
    f.send({ type: 'name', name: 'x'.repeat(100) });

    expect(f.state.name).toHaveLength(40);
  });
});
