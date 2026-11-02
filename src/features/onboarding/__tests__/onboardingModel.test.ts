import { searchPlaces } from '@/core/data';
import { type BirthPlace, type BirthProfile, birthClock, Gender } from '@/core/model';
import { FakeProfileRepository, FakeSettingsRepository } from '@/core/testing';
import { CalendarMode } from '@/core/ui';
import { civilDate } from '@/engine';
import { OnboardingController } from '../onboardingModel';
import { BUILD_TASKS, canContinue, OnboardingStep } from '../onboardingState';

// Made-up births; the places come from the bundled catalog.
const TODAY = civilDate(2026, 11, 1);
const instant = (): Promise<void> => Promise.resolve();
const hanoi = searchPlaces('Hà Nội')[0];
const saigon = searchPlaces('Sài Gòn')[0];

let settings: FakeSettingsRepository;
let profiles: FakeProfileRepository;

beforeEach(() => {
  settings = new FakeSettingsRepository();
  profiles = new FakeProfileRepository();
});

const controller = (profile: FakeProfileRepository = profiles, isEditing = false): OnboardingController =>
  new OnboardingController({ settings, profile, isEditing, today: TODAY, wait: instant });

/** Walks from Welcome to Review with a complete profile. */
function fillIn(model: OnboardingController, timeUnknown = false): void {
  model.next(); // Welcome -> Consent
  model.setAnalytics(true);
  model.next(); // -> Date
  model.setYear(1995);
  model.setMonth(8);
  model.setDay(15);
  model.next(); // -> Time
  model.setHour(9);
  model.setMinute(30);
  model.setTimeUnknown(timeUnknown);
  model.next(); // -> Place
  model.selectPlace(hanoi);
  model.next(); // -> Name
  model.setName('  Lan ');
  model.setGender(Gender.FEMALE);
  model.next(); // -> Review
}

const settingsNow = () => settings.state.current();

describe('OnboardingController', () => {
  test('full flow saves the profile and consents, then finishes', async () => {
    const model = controller();
    fillIn(model);
    expect(model.state.step).toBe(OnboardingStep.Review);
    expect(model.state.review).not.toBeNull();

    model.next();
    expect(model.state.step).toBe(OnboardingStep.Building);
    await model.whenIdle();

    const state = model.state;
    expect(state.isFinished).toBe(true);
    expect(state.build.completedTasks).toBe(BUILD_TASKS.length);
    expect(state.build.summary?.lifePalace).toBeTruthy();
    const expected: BirthProfile = {
      name: 'Lan',
      gender: Gender.FEMALE,
      date: { year: 1995, month: 8, day: 15 },
      clock: birthClock(9, 30),
      place: hanoi,
      enteredAsLunar: false,
    };
    expect(profiles.saved).toEqual(expected);
    expect(settingsNow().onboardingCompleted).toBe(true);
    expect(settingsNow().analyticsConsent).toBe(true);
  });

  test('unknown time saves no clock and skips the life palace', async () => {
    const model = controller();
    fillIn(model, true);
    model.next();
    await model.whenIdle();

    expect(profiles.saved?.clock).toBeNull();
    expect(model.state.build.summary?.lifePalace ?? null).toBeNull();
  });

  test('continue is blocked until each step is complete', () => {
    const model = controller();
    model.next();
    model.next();
    model.setYear(2026);
    model.setMonth(12);
    expect(canContinue(model.state)).toBe(false); // future date
    model.next();
    expect(model.state.step).toBe(OnboardingStep.Date);

    model.setYear(2000);
    model.next();
    model.next();
    expect(canContinue(model.state)).toBe(false); // no place
    model.selectPlace(hanoi);
    model.next();
    model.setName('   ');
    model.setGender(Gender.MALE);
    expect(canContinue(model.state)).toBe(false); // blank name
  });

  test('back walks one step and stops at welcome', () => {
    const model = controller();
    expect(model.back()).toBe(false);
    model.next();
    model.next();
    expect(model.back()).toBe(true);
    expect(model.state.step).toBe(OnboardingStep.Consent);
  });

  test('edit from review returns to the date and keeps the answers', () => {
    const model = controller();
    fillIn(model);
    model.edit();
    const state = model.state;
    expect(state.step).toBe(OnboardingStep.Date);
    expect(state.date.year).toBe(1995);
    expect(state.place).toEqual(hanoi);
  });

  test('typed coordinates become the place', () => {
    const model = controller();
    model.setCoordinates(48.86, 2.35);
    const place = model.state.place;
    expect(place?.latitude).toBe(48.86);
    expect(place?.region).toBe('');
  });

  test('a typed utc offset fixes the zone', () => {
    const model = controller();
    model.setCoordinates(39.9, 116.4, 480);
    expect(model.state.place?.zoneId).toBe('+08:00');
  });

  test('failed save can be retried', async () => {
    profiles.failNextSave = true;
    const model = controller();
    fillIn(model);
    model.next();
    await model.whenIdle();
    expect(model.state.build.saveFailed).toBe(true);
    expect(model.state.isFinished).toBe(false);

    model.retrySave();
    await model.whenIdle();
    expect(model.state.isFinished).toBe(true);
    expect(profiles.saved).not.toBeNull();
  });

  test('back after a failed save returns to review', async () => {
    profiles.failNextSave = true;
    const model = controller();
    fillIn(model);
    model.next();
    await model.whenIdle();

    expect(model.back()).toBe(true);
    expect(model.state.step).toBe(OnboardingStep.Review);
  });

  test('editing fills in the saved details and saves only the profile', async () => {
    const saved: BirthProfile = {
      name: 'Lan',
      gender: Gender.FEMALE,
      date: { year: 1995, month: 9, day: 9 },
      clock: null,
      place: hanoi,
      enteredAsLunar: true,
    };
    const editing = new FakeProfileRepository(saved);
    const model = controller(editing, true);

    const state = model.state;
    expect(state.step).toBe(OnboardingStep.Date);
    expect(state.date.mode).toBe(CalendarMode.Lunar);
    const solar = state.dateCheck?.solar;
    expect(solar && { year: solar.year, month: solar.month, day: solar.day }).toEqual(saved.date);
    expect(state.isTimeUnknown).toBe(true);
    expect(state.place).toEqual(hanoi);
    expect(state.name).toBe('Lan');
    expect(model.back()).toBe(false); // back from the date leaves the editor

    model.next(); // -> Time
    model.setTimeUnknown(false);
    model.setHour(7);
    for (let i = 0; i < 3; i++) model.next(); // -> Place, Name, Review
    expect(model.state.step).toBe(OnboardingStep.Review);
    model.next();
    await model.whenIdle();

    expect(model.state.isFinished).toBe(true);
    expect(editing.saved).toEqual({ ...saved, clock: birthClock(7, 0) });
    expect(settingsNow().onboardingCompleted).toBe(false); // a correction does not touch first-launch settings
  });

  test('a lunar date entered for the South before 1976 uses the Southern calendar', async () => {
    // Tết Mậu Thân: lunar 1/1/1968 was 29 January in the North and 30 January in the South.
    async function saveLunarNewYear(place: BirthPlace) {
      const repository = new FakeProfileRepository();
      const model = controller(repository);
      fillIn(model);
      model.edit(); // back to the date step
      model.setCalendarMode(CalendarMode.Lunar);
      model.setYear(1968);
      model.setMonth(1);
      model.setDay(1);
      model.selectPlace(place);
      for (let i = 0; i < 4; i++) model.next(); // -> Time, Place, Name, Review
      model.next();
      await model.whenIdle();
      return repository.saved?.date;
    }
    expect(await saveLunarNewYear(hanoi)).toEqual({ year: 1968, month: 1, day: 29 });
    expect(await saveLunarNewYear(saigon)).toEqual({ year: 1968, month: 1, day: 30 });
  });

  test('editing a Southern lunar birthday keeps the date', async () => {
    const saved: BirthProfile = {
      name: 'Lan',
      gender: Gender.FEMALE,
      date: { year: 1968, month: 1, day: 30 },
      clock: null,
      place: saigon,
      enteredAsLunar: true,
    };
    const editing = new FakeProfileRepository(saved);
    const model = controller(editing, true);
    expect(model.state.date.day).toBe(1); // the wheels show lunar 1/1/1968 as entered

    for (let i = 0; i < 5; i++) model.next(); // -> Time, Place, Name, Review, save
    await model.whenIdle();
    expect(editing.saved).toEqual(saved);
  });
});
